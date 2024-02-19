use std::collections::HashMap;
use std::str::FromStr;
use std::sync::{Arc, Mutex};

use anyhow::Context;
use askama::Template;
use axum::Extension;
use axum::{
    extract::{Query, Request, State},
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Redirect, Response},
    routing::get,
    Router,
};
use axum_macros::debug_handler;
use axum_session::{
    Key, SessionConfig, SessionLayer, SessionPgPool, SessionPgSession, SessionStore,
};

use chrono::Duration;
use jsonwebtoken::jwk::AlgorithmParameters;
use jsonwebtoken::{decode, decode_header, jwk, Algorithm, DecodingKey, Validation};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, TokenResponse,
    TokenUrl,
};
use serde::Deserialize;

use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use thiserror::Error;
use tracing::{error, info};

#[derive(Clone)]
struct AppState {
    jwk_set: jwk::JwkSet,
    oauth_client: BasicClient,
    verifiers: Arc<Mutex<HashMap<String, String>>>,
}

#[derive(Error, Debug)]
enum AppError {
    #[error("unauthorized")]
    Unauthorized,

    #[error("internal server error")]
    InternalError,

    #[error("{0}")]
    HttpRequestError(#[from] reqwest::Error),

    #[error("{0}")]
    OAuthError(
        #[from]
        oauth2::RequestTokenError<
            oauth2::reqwest::Error<reqwest::Error>,
            oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>,
        >,
    ),

    #[error("{0}")]
    JwtError(#[from] jsonwebtoken::errors::Error),

    #[error("{0}")]
    Anyhow(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        use AppError::{
            Anyhow, HttpRequestError, InternalError, JwtError, OAuthError, Unauthorized,
        };

        match self {
            Unauthorized | JwtError(_) | OAuthError(_) => {
                (StatusCode::UNAUTHORIZED).into_response()
            }
            InternalError | Anyhow(_) | HttpRequestError(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().init();

    let app_url = dotenvy::var("APP_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
    let port = dotenvy::var("PORT").map_or_else(|_| Ok(3000), |p| p.parse::<u16>())?;

    let client_id = dotenvy::var("CLIENT_ID").context("oauth2 client id not provided")?;
    let client_secret = dotenvy::var("CLIENT_SECRET").context("oauth2 secret not provided")?;
    let idp_domain = dotenvy::var("IDP_DOMAIN").context("idp domain not provided")?;
    let cookie_key = dotenvy::var("COOKIE_KEY").context("cookie key not provided")?;
    let database_key = dotenvy::var("DATABASE_KEY").context("database key not provided")?;

    let database_url = dotenvy::var("DATABASE_URL").unwrap_or_else(|_| {
        info!("no database url provided falling back to default local database.");
        "postgres://postgres:rust@localhost".to_string()
    });

    let jwk_set = reqwest::get(format!("https://{idp_domain}/.well-known/jwks.json"))
        .await
        .context("could not load jwks")?
        .json::<jwk::JwkSet>()
        .await
        .context("could not transform jwks response into jwk::JwkSet")?;

    let db = PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&database_url)
        .await
        .context("could not connect to database")?;

    let session_config = SessionConfig::default()
        .with_table_name("sessions")
        .with_key(Key::from(cookie_key.as_bytes()))
        .with_database_key(Key::from(database_key.as_bytes()))
        .with_http_only(true)
        .with_secure(true)
        .with_cookie_same_site(axum_session::SameSite::Strict)
        .with_ip_and_user_agent(true)
        .with_lifetime(Duration::days(32))
        .with_max_age(Some(Duration::days(64)))
        .with_cookie_domain("nine-to-five-production.up.railway.app".to_string());
    let session_store = SessionStore::<SessionPgPool>::new(Some(db.clone().into()), session_config)
        .await
        .context("could not create session store")?;

    let oauth_client = build_oauth_client(&app_url, client_id, client_secret, &idp_domain)
        .context("could not create oauth client")?;

    let state = AppState {
        jwk_set,
        oauth_client,
        verifiers: Arc::new(Mutex::new(HashMap::new())),
    };

    let protected_route =
        Router::new()
            .route("/", get(protected))
            .route_layer(middleware::from_fn_with_state(
                state.clone(),
                check_authorized,
            ));

    let app = Router::new()
        .route("/", get(index))
        .route("/health", get(health))
        .nest("/app", protected_route)
        .route("/login", get(login))
        .route("/callback", get(callback))
        .with_state(state)
        .layer(SessionLayer::new(session_store));

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    if let Ok(addr) = listener.local_addr() {
        info!("server started at {}", addr);
    }

    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .context("failed to start server")
}

async fn index() -> impl IntoResponse {
    IndexTemplate {}
}

async fn health() -> (StatusCode, impl IntoResponse) {
    (StatusCode::OK, "OK")
}

async fn protected(Extension(user_id): Extension<String>) -> impl IntoResponse {
    info!("user {}", user_id);
    ProtectedTemplate {}
}

async fn login(State(state): State<AppState>) -> Result<impl IntoResponse, impl IntoResponse> {
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
        Err(e) => {
            error!("could not lock the verifiers store in login handler");
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    Ok(Redirect::temporary(auth_url.as_str()))
}

fn build_oauth_client(
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
struct AuthRequest {
    code: String,
    state: String,
}

#[derive(Debug, Deserialize)]
struct Claims {
    sub: String,
}

#[debug_handler]
async fn callback(
    session: SessionPgSession,
    State(state): State<AppState>,
    Query(auth_request): Query<AuthRequest>,
) -> Result<impl IntoResponse, AppError> {
    let pkce_verifier = match state.verifiers.lock() {
        Ok(verifiers) => {
            let lock = verifiers.get(&auth_request.state);
            match lock {
                Some(v) => v.into(),
                None => return Err(AppError::Unauthorized),
            }
        }
        Err(_) => return Err(AppError::InternalError),
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
        None => return Err(AppError::InternalError),
    };

    if let Some(j) = state.jwk_set.find(&kid) {
        match &j.algorithm {
            AlgorithmParameters::RSA(rsa) => {
                let decoding_key = DecodingKey::from_rsa_components(&rsa.n, &rsa.e)
                    .context("could not create deconding key")?;

                let key_algorithm = match j.common.key_algorithm {
                    Some(ka) => ka,
                    None => return Err(AppError::InternalError),
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

async fn check_authorized(
    session: SessionPgSession,
    State(_state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let user_id = match session.get::<String>("id") {
        Some(id) => id,
        None => return Ok(Redirect::to("/login").into_response()),
    };

    req.extensions_mut().insert(user_id);

    Ok(next.run(req).await)
}

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {}

#[derive(Template)]
#[template(path = "app.html")]
struct ProtectedTemplate {}
