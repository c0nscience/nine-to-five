use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use jsonwebtoken::jwk;
use oauth2::basic::BasicClient;
use sqlx::PgPool;

#[derive(Debug, Clone)]
pub struct OAuthConfig {
    pub audience: String,
    pub idp_domain: String,
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub db: PgPool,
    pub jwk_set: jwk::JwkSet,
    pub oauth_client: BasicClient,
    pub verifiers: Arc<Mutex<HashMap<String, String>>>,
    pub oauth_config: OAuthConfig,
}