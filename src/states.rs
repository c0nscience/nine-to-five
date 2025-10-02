use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use aes_gcm::{Aes256Gcm, Key};
use jsonwebtoken::jwk;
use oauth2::basic::BasicClient;
use oauth2::{EndpointNotSet, EndpointSet};
use reqwest::Client;
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
    pub oauth_client:
        BasicClient<EndpointSet, EndpointNotSet, EndpointNotSet, EndpointNotSet, EndpointSet>,
    pub http_client: Client,
    pub verifiers: Arc<Mutex<HashMap<String, String>>>,
    pub oauth_config: OAuthConfig,
    pub database_key: Key<Aes256Gcm>,
    pub database_hash_key: String,
}
