use askama::Template;
use axum::{
    extract::{FromRef, Query, Request, State},
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
use sqlx::{
    postgres::PgPoolOptions, // PgPool,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tracing::error;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ntf_rust=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db_connection_str = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:rust@localhost".to_string());

    let _db = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&db_connection_str)
        .await
        .expect("can not connect to database");

    let client_id = std::env::var("CLIENT_ID").unwrap();
    let client_secret = std::env::var("CLIENT_SECRET").unwrap();
    let oauth_client = build_oauth_client(client_id, client_secret);

    let verifiers = HashMap::new();
    let state = AppState {
        // db,
        oauth_client,
        key: Key::generate(),
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
        .nest("/app", protected_route)
        .route("/login", get(login))
        .route("/callback", get(callback))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn index() -> impl IntoResponse {
    IndexTemplate {}
}

async fn protected() -> impl IntoResponse {
    ProtectedTemplate {}
}

async fn login(State(state): State<AppState>) -> Redirect {
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let (auth_url, csrf_token) = state
        .oauth_client
        .authorize_url(CsrfToken::new_random)
        .set_pkce_challenge(pkce_challenge)
        .url();

    state.verifiers.lock().unwrap().insert(
        csrf_token.secret().to_string(),
        pkce_verifier.secret().to_string(),
    );

    Redirect::temporary(auth_url.as_str())
}

fn build_oauth_client(client_id: String, client_secret: String) -> BasicClient {
    let redirect_url = "http://localhost:3000/callback".to_string();

    let auth_url = AuthUrl::new("https://ninetofive.eu.auth0.com/authorize".to_string())
        .expect("invalid authorize endpoint URL");
    let token_url = TokenUrl::new("https://ninetofive.eu.auth0.com/oauth/token".to_string())
        .expect("invalid token endpoint URL");

    BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        auth_url,
        Some(token_url),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_url).unwrap())
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
) -> Result<impl IntoResponse, impl IntoResponse> {
    let pkce_verifier = {
        let verifiers = state.verifiers.lock().unwrap();
        verifiers.get(&auth_request.state).unwrap().into()
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

    let secs: i64 = token.expires_in().unwrap().as_secs().try_into().unwrap();

    let _max_age = Local::now().naive_local() + Duration::seconds(secs);

    let cookie = Cookie::build(("sid", token.access_token().secret().to_owned()))
        .domain(".localhost")
        .path("/")
        .secure(true)
        .http_only(true)
        .max_age(time::Duration::seconds(secs));

    Ok((jar.add(cookie), Redirect::temporary("/app")))
}

async fn check_authorized(
    State(_state): State<AppState>,
    jar: PrivateCookieJar,
    mut req: Request,
    next: Next,
) -> Result<impl IntoResponse, impl IntoResponse> {
    let Some(cookie) = jar.get("sid").map(|cookie| cookie.value().to_owned()) else {
        return Err((StatusCode::UNAUTHORIZED, "Unauthorized!".to_string()));
    };

    req.extensions_mut().insert(cookie);

    Ok(next.run(req).await)
}

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {}

#[derive(Template)]
#[template(path = "app.html")]
struct ProtectedTemplate {}
