use std::collections::HashMap;

use std::sync::{Arc, Mutex};

use anyhow::Context;
use askama::Template;

use axum::{http::StatusCode, response::IntoResponse, routing::get, Router};

use axum_session::{Key, SessionConfig, SessionLayer, SessionPgPool, SessionStore};

use chrono::Duration;
use jsonwebtoken::jwk;

use nine_to_five::states::OAuthConfig;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::compression::CompressionLayer;
use tower_http::services::{ServeDir, ServeFile};

use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().init();

    let production = dotenvy::var("ENV").unwrap_or_else(|_| "dev".to_string());
    let app_url = dotenvy::var("APP_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
    let port = dotenvy::var("PORT").map_or_else(|_| Ok(3000), |p| p.parse::<u16>())?;

    let client_id = dotenvy::var("CLIENT_ID").context("oauth2 client id not provided")?;
    let client_secret = dotenvy::var("CLIENT_SECRET").context("oauth2 secret not provided")?;
    let idp_domain = dotenvy::var("IDP_DOMAIN").context("idp domain not provided")?;
    let cookie_key = dotenvy::var("COOKIE_KEY").context("cookie key not provided")?;
    let database_key = dotenvy::var("DATABASE_KEY").context("database key not provided")?;
    let audience = dotenvy::var("OAUTH_AUDIENCE").context("audience not provided")?;

    let database_url =
        dotenvy::var("DATABASE_URL").context("no postgres connection url provided")?;

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
    sqlx::migrate!().run(&db).await?;

    let secure = production == "prod";

    let session_config = SessionConfig::default()
        .with_table_name("sessions")
        .with_key(Key::from(cookie_key.as_bytes()))
        .with_database_key(Key::from(database_key.as_bytes()))
        .with_http_only(true)
        .with_secure(secure)
        .with_ip_and_user_agent(false)
        .with_lifetime(Duration::days(31))
        .with_max_age(Some(Duration::days(31)));
    let session_store = SessionStore::<SessionPgPool>::new(Some(db.clone().into()), session_config)
        .await
        .context("could not create session store")?;

    let oauth_client =
        nine_to_five::auth::build_oauth_client(&app_url, client_id, client_secret, &idp_domain)
            .context("could not create oauth client")?;

    let oauth_config = OAuthConfig {
        audience,
        idp_domain,
    };
    let state = nine_to_five::states::AppState {
        db,
        jwk_set,
        oauth_client,
        verifiers: Arc::new(Mutex::new(HashMap::new())),
        oauth_config,
    };

    let app = Router::new()
        .route("/callback", get(nine_to_five::auth::callback))
        .nest(
            "/app",
            nine_to_five::activity::handlers::router(state.clone()),
        )
        .route("/login", get(nine_to_five::auth::login))
        .route("/signup", get(nine_to_five::auth::signup))
        .layer(SessionLayer::new(session_store))
        .route("/", get(index))
        .route("/health", get(health))
        .nest_service("/assets", ServeDir::new("assets"))
        .nest_service("/favicon.ico", ServeFile::new("assets/favicon.ico"))
        .layer(CompressionLayer::new())
        .with_state(state.clone());

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

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {}
