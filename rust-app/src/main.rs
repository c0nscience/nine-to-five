use std::{collections::HashMap, time::Duration};

use askama::Template;
use axum::{
    extract::{Query, State},
    response::{IntoResponse, Redirect},
    routing::get,
    Router,
};
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, AuthorizationCode, ClientId,
    ClientSecret, CsrfToken, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, TokenUrl,
};
use serde::Deserialize;
use sqlx::{postgres::PgPoolOptions, PgPool};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Clone)]
struct AppState {
    db: PgPool,
    oauth_client: BasicClient,
    verifiers: HashMap<String, PkceCodeVerifier>,
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

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&db_connection_str)
        .await
        .expect("can not connect to database");

    let client_id = std::env::var("CLIENT_ID").unwrap();
    let client_secret = std::env::var("CLIENT_SECRET").unwrap();
    let oauth_client = build_oauth_client(client_id, client_secret);

    let state = AppState {
        db: pool,
        oauth_client,
        verifiers: HashMap::new(),
    };

    let app = Router::new()
        .route("/", get(index))
        .route("/login", get(login))
        .route("/callback", get(callback))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn index() -> impl IntoResponse {
    IndexTemplate {}
}

async fn login(State(state): State<AppState>) -> Redirect {
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
    dbg!(pkce_challenge.as_str());
    dbg!(pkce_verifier);
    let (auth_url, _csrf_token) = state
        .oauth_client
        .authorize_url(CsrfToken::new_random)
        .set_pkce_challenge(pkce_challenge)
        .url();
    dbg!(_csrf_token.secret());
    state
        .verifiers
        .insert(_csrf_token.secret().to_string(), pkce_verifier);
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

async fn callback(State(state): State<AppState>, auth_request: Query<AuthRequest>) -> Redirect {
    let auth_request = auth_request.0;

    dbg!(auth_request.state);

    let pkce_verifier = state.verifiers.get(auth_request.state);

    let _token_result = state
        .oauth_client
        .exchange_code(AuthorizationCode::new(auth_request.code))
        .set_pkce_verifier(pkce_verifier)
        .request_async(async_http_client);

    Redirect::temporary("/")
}

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {}
