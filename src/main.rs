use std::collections::HashMap;

use std::sync::{Arc, Mutex};

use anyhow::Context;
use askama::Template;

use axum::response::Html;
use axum::{Router, http::StatusCode, response::IntoResponse, routing::get};

use axum_session::{Key, SessionConfig, SessionLayer, SessionStore};

use axum_session_sqlx::SessionPgPool;
use base64::{Engine, engine::general_purpose};
use chrono::Duration;
use hash::hash;
use jsonwebtoken::jwk;

use aes_gcm::{Aes256Gcm, Key as AesKey};
use sqlx::postgres::PgPoolOptions;
use states::OAuthConfig;
use std::net::SocketAddr;
use tower_http::compression::CompressionLayer;
use tower_http::services::{ServeDir, ServeFile};

use tracing::info;

pub mod activity;
pub mod auth;
pub mod encrypt;
pub mod errors;
pub mod func;
pub mod hash;
pub mod import;
pub mod metrics;
pub mod summaries;
pub mod states;

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
    let session_database_key =
        dotenvy::var("SESSION_DATABASE_KEY").context("session database key not provided")?;
    let audience = dotenvy::var("OAUTH_AUDIENCE").context("audience not provided")?;
    let db_user = dotenvy::var("DB_USER").context("no db user")?;
    let db_password = dotenvy::var("POSTGRES_PASSWORD").context("no db password")?;
    let db_port = dotenvy::var("DB_PORT").context("no db port")?;
    let db_name = dotenvy::var("DB_NAME").context("no db name")?;
    let db_host = dotenvy::var("DB_HOST").context("no db host")?;

    let database_url =
        format!("postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}");
    let database_key = dotenvy::var("DATABASE_KEY").context("database key not provided")?;
    let database_hash_key =
        dotenvy::var("DATABASE_HASH_KEY").context("database hash key not provided")?;

    // let rnd_key = Aes256Gcm::generate_key(OsRng);
    // let rnd_key = general_purpose::STANDARD.encode(rnd_key);
    // info!("rnd key: {}", rnd_key);

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
        .with_database_key(Key::from(session_database_key.as_bytes()))
        .with_http_only(true)
        .with_secure(secure)
        // .with_ip_and_user_agent(true)
        // .with_hashed_ip(false)
        // .with_hashed_xforward(true)
        .with_lifetime(Duration::days(31))
        .with_max_age(Some(Duration::days(31)));
    let session_store = SessionStore::<SessionPgPool>::new(Some(db.clone().into()), session_config)
        .await
        .context("could not create session store")?;

    let oauth_client = auth::build_oauth_client(&app_url, client_id, client_secret, &idp_domain)
        .context("could not create oauth client")?;

    let http_client = reqwest::ClientBuilder::new()
        .redirect(reqwest::redirect::Policy::none())
        .build()?;

    let oauth_config = OAuthConfig {
        audience,
        idp_domain,
    };

    let key = general_purpose::STANDARD.decode(database_key.as_str())?;
    let key = AesKey::<Aes256Gcm>::from_slice(&key);

    let state = states::AppState {
        db,
        jwk_set,
        oauth_client,
        http_client,
        verifiers: Arc::new(Mutex::new(HashMap::new())),
        oauth_config,
        database_key: *key,
        database_hash_key,
    };

    let app = Router::new()
        .route("/callback", get(auth::callback))
        .nest("/app", activity::handlers::router(state.clone()))
        .nest("/app/metrics", metrics::handlers::router(state.clone()))
        .nest("/app/summaries", summaries::handlers::router(state.clone()))
        .nest("/app/import", import::router(state.clone()))
        .route("/login", get(auth::login))
        .route("/signup", get(auth::signup))
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

#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {}

async fn index() -> Result<impl IntoResponse, errors::AppError> {
    Ok(Html(IndexTemplate {}.render()?))
}

async fn health() -> (StatusCode, impl IntoResponse) {
    (StatusCode::OK, "OK")
}
