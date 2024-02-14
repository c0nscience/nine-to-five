use core::panic;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

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
use sqlx::postgres::PgPoolOptions;
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
async fn main() {
    tracing_subscriber::fmt().init();

    let db_connection_str = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        info!("no database url provided falling back to default local database.");
        "postgres://postgres:rust@localhost".to_string()
    });

    let _db = match PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .connect(&db_connection_str)
        .await
    {
        Ok(db) => db,
        Err(e) => {
            panic!("could not connect to database: {e}");
        }
    };

    let client_id = match std::env::var("CLIENT_ID") {
        Ok(id) => id,
        Err(e) => panic!("oauth2 client id not provided: {e}"),
    };
    let client_secret = match std::env::var("CLIENT_SECRET") {
        Ok(secret) => secret,
        Err(e) => panic!("oauth2 secret not provided: {e}"),
    };
    let idp_domain = match std::env::var("IDP_DOMAIN") {
        Ok(domain) => domain,
        Err(e) => panic!("idp domain not provided: {e}"),
    };
    let oauth_client = match build_oauth_client(client_id, client_secret, &idp_domain) {
        Ok(cli) => cli,
        Err(e) => panic!("could not create oauth client: {e}"),
    };

    let verifiers = HashMap::new();
    let state = AppState {
        // db,
        oauth_client,
        key: Key::generate(), // TODO we have to read,create a given key
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

    let listener = match tokio::net::TcpListener::bind("0.0.0.0:3000").await {
        Ok(l) => {
            let addr = match l.local_addr() {
                Ok(a) => a,
                Err(e) => panic!("could not get local address: {e}"),
            };
            info!("listen on {}", addr);
            l
        }
        Err(e) => panic!("could not create listener: {e}"),
    };

    match axum::serve(listener, app).await {
        Ok(()) => (),
        Err(e) => panic!("could not start server: {e}"),
    };
}

async fn index() -> impl IntoResponse {
    IndexTemplate {}
}

async fn protected() -> impl IntoResponse {
    ProtectedTemplate {}
}

async fn login(State(state): State<AppState>) -> Result<impl IntoResponse, impl IntoResponse> {
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let (auth_url, csrf_token) = state
        .oauth_client
        .authorize_url(CsrfToken::new_random)
        .set_pkce_challenge(pkce_challenge)
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
    client_id: String,
    client_secret: String,
    idp_domain: &str,
) -> Result<BasicClient, oauth2::url::ParseError> {
    // TODO parametrize the callback url
    let redirect_url = RedirectUrl::new("http://localhost:3000/callback".to_string())?;

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
) -> Result<impl IntoResponse, impl IntoResponse> {
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
