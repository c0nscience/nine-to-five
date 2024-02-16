use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use anyhow::Context;
use askama::Template;
use axum::Extension;
use axum::{
    extract::{FromRef, Host, Query, Request, State},
    http::StatusCode,
    middleware::{self, Next},
    response::{IntoResponse, Redirect},
    routing::get,
    Router,
};
use axum_extra::extract::{cookie::Cookie, cookie::Key, PrivateCookieJar};
use chrono::{Duration, Local};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, TokenResponse,
    TokenUrl,
};
use serde::Deserialize;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tracing::{error, info};

#[derive(Clone)]
struct AppState {
    // db: PgPool,
    oauth_client: BasicClient,
    key: Key,
    verifiers: Arc<Mutex<HashMap<String, String>>>,
}

impl FromRef<AppState> for Key {
    fn from_ref(input: &AppState) -> Self {
        input.key.clone()
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

    let database_url = dotenvy::var("DATABASE_URL").unwrap_or_else(|_| {
        info!("no database url provided falling back to default local database.");
        "postgres://postgres:rust@localhost".to_string()
    });

    let _db = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&database_url)
        .await
        .context("could not connect to database")?;

    let oauth_client = build_oauth_client(app_url, client_id, client_secret, &idp_domain)
        .context("could not create oauth client")?;

    let verifiers = HashMap::new();
    let state = AppState {
        // db,
        oauth_client,
        key: Key::from(cookie_key.as_bytes()),
        verifiers: Arc::new(Mutex::new(verifiers)),
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
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    if let Ok(addr) = listener.local_addr() {
        info!("server started at {}", addr);
    }

    axum::serve(listener, app)
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
    info!("user id: {user_id}");
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
        .add_extra_param("audience", "https://api.ntf.io")
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
    app_url: String,
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

async fn callback(
    State(state): State<AppState>,
    jar: PrivateCookieJar,
    Query(auth_request): Query<AuthRequest>,
    Host(hostname): Host,
) -> Result<impl IntoResponse, impl IntoResponse> {
    info!("{hostname}");
    let pkce_verifier = match state.verifiers.lock() {
        Ok(verifiers) => {
            let lock = verifiers.get(&auth_request.state);
            match lock {
                Some(v) => v.into(),
                None => return Err((StatusCode::UNAUTHORIZED, "not allowed".to_string())),
            }
        }
        Err(e) => {
            error!("could not lock the verifiers store in callback handler: {e}");
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let pkce_verifier = PkceCodeVerifier::new(pkce_verifier);

    let token = match state
        .oauth_client
        .exchange_code(AuthorizationCode::new(auth_request.code))
        .set_pkce_verifier(pkce_verifier)
        .request_async(async_http_client)
        .await
    {
        Ok(res) => res,
        Err(e) => {
            error!("could not exchange code: {e}");
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };
    info!("token: {:?}", token);
    let secs: i64 = if let Some(resp) = token.expires_in() {
        match resp.as_secs().try_into() {
            Ok(s) => s,
            Err(e) => {
                error!("could not get token expiration in seconds: {e}");
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "could net get token expiration in seconds".to_string(),
                ));
            }
        }
    } else {
        error!("token does not have an expiration");
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            "no expriation date found".to_string(),
        ));
    };

    let _max_age = Local::now().naive_local() + Duration::seconds(secs);
    let cookie = Cookie::build(("access_token", token.access_token().secret().to_owned()))
        .domain(hostname)
        .path("/")
        .secure(true)
        .http_only(true)
        .max_age(time::Duration::seconds(secs));
    let cookie_refresh_token = Cookie::build((
        "refresh_token",
        token.refresh_token().unwrap().secret().to_owned(),
    ))
    .domain(".localhost")
    .path("/")
    .secure(true)
    .http_only(true)
    .max_age(time::Duration::seconds(secs));

    Ok((
        jar.add(cookie).add(cookie_refresh_token),
        Redirect::temporary("/app"),
    ))
}

async fn check_authorized(
    State(_state): State<AppState>,
    jar: PrivateCookieJar,
    mut req: Request,
    next: Next,
) -> Result<impl IntoResponse, impl IntoResponse> {
    let Some(cookie) = jar
        .get("access_token")
        .map(|cookie| cookie.value().to_owned())
    else {
        info!("no access_token found");
        return Err((StatusCode::UNAUTHORIZED, "Unauthorized!".to_string()));
    };
    let Some(refresh_token) = jar
        .get("refresh_token")
        .map(|cookie| cookie.value().to_owned())
    else {
        info!("no refresh_token found");
        return Err((StatusCode::UNAUTHORIZED, "Unauthorized!".to_string()));
    };

    // TODO if access_token is expired get new access_token with refresh token
    // TODO update access_token and refresh_token in cookie
    info!("{refresh_token}");
    req.extensions_mut().insert(cookie);

    Ok(next.run(req).await)
}

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {}

#[derive(Template)]
#[template(path = "app.html")]
struct ProtectedTemplate {}
