use std::str::FromStr;

use anyhow::Context;
use axum::{
    extract::{Query, Request, State},
    middleware::Next,
    response::{IntoResponse, Redirect, Response},
};
use axum_macros::debug_handler;
use axum_session::SessionPgSession;

use jsonwebtoken::jwk::AlgorithmParameters;
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, TokenResponse,
    TokenUrl,
};
use serde::Deserialize;

use tracing::error;

pub async fn login(
    State(state): State<crate::state::AppState>,
) -> Result<impl IntoResponse, crate::error::AppError> {
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let (auth_url, csrf_token) = state
        .oauth_client
        .authorize_url(CsrfToken::new_random)
        .set_pkce_challenge(pkce_challenge)
        .add_scope(oauth2::Scope::new("openid".to_string()))
        .add_scope(oauth2::Scope::new("offline_access".to_string()))
        .add_extra_param("audience", "https://api.ntf.io") //TODO parametrize the audience value
        .url();

    match state.verifiers.lock() {
        Ok(mut v) => {
            v.insert(
                csrf_token.secret().to_string(),
                pkce_verifier.secret().to_string(),
            );
        }
        Err(_) => {
            error!("could not lock the verifiers store in login handler");
            return Err(crate::error::AppError::InternalError);
        }
    };

    Ok(Redirect::temporary(auth_url.as_str()))
}

pub fn build_oauth_client(
    app_url: &str,
    client_id: String,
    client_secret: String,
    idp_domain: &str,
) -> Result<BasicClient, oauth2::url::ParseError> {
    let redirect_url = RedirectUrl::new(format!("{app_url}/callback"))?;

    let auth_url = AuthUrl::new(format!("https://{idp_domain}/authorize"))?;
    let token_url = TokenUrl::new(format!("https://{idp_domain}/oauth/token"))?;
    Ok(BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        auth_url,
        Some(token_url),
    )
    .set_redirect_uri(redirect_url))
}

#[derive(Debug, Deserialize)]
pub struct AuthRequest {
    code: String,
    state: String,
}

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
}

#[debug_handler]
pub async fn callback(
    session: SessionPgSession,
    State(state): State<crate::state::AppState>,
    Query(auth_request): Query<AuthRequest>,
) -> Result<impl IntoResponse, crate::error::AppError> {
    let pkce_verifier = match state.verifiers.lock() {
        Ok(verifiers) => {
            let lock = verifiers.get(&auth_request.state);
            match lock {
                Some(v) => v.into(),
                None => return Err(crate::error::AppError::Unauthorized),
            }
        }
        Err(_) => return Err(crate::error::AppError::InternalError),
    };

    let pkce_verifier = PkceCodeVerifier::new(pkce_verifier);

    let token = state
        .oauth_client
        .exchange_code(AuthorizationCode::new(auth_request.code))
        .set_pkce_verifier(pkce_verifier)
        .request_async(async_http_client)
        .await?;

    let header = decode_header(token.access_token().secret())?;
    let kid = match header.kid {
        Some(k) => k,
        None => return Err(crate::error::AppError::InternalError),
    };

    if let Some(j) = state.jwk_set.find(&kid) {
        match &j.algorithm {
            AlgorithmParameters::RSA(rsa) => {
                let decoding_key = DecodingKey::from_rsa_components(&rsa.n, &rsa.e)
                    .context("could not create deconding key")?;

                let key_algorithm = match j.common.key_algorithm {
                    Some(ka) => ka,
                    None => return Err(crate::error::AppError::InternalError),
                };

                let mut validation = Validation::new(
                    Algorithm::from_str(key_algorithm.to_string().as_str())
                        .context("could not create algorithm from jwk")?,
                );
                //TODO grab these values from the environment
                validation.set_audience(&[
                    "https://api.ntf.io",
                    "https://ninetofive.eu.auth0.com/userinfo",
                ]);

                validation.set_issuer(&["https://ninetofive.eu.auth0.com/"]);

                let decoded_token = decode::<Claims>(
                    token.access_token().secret().as_str(),
                    &decoding_key,
                    &validation,
                )
                .context("could not decode access token")?;

                session.set("id", decoded_token.claims.sub);
            }
            _ => unreachable!("wrong algorithm"),
        }
    }

    Ok(Redirect::temporary("/app"))
}

pub async fn check_authorized(
    session: SessionPgSession,
    State(_state): State<crate::state::AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, crate::error::AppError> {
    let user_id = match session.get::<String>("id") {
        Some(id) => id,
        None => return Ok(Redirect::to("/login").into_response()),
    };

    req.extensions_mut().insert(user_id);

    Ok(next.run(req).await)
}
