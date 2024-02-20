use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use jsonwebtoken::jwk;
use oauth2::basic::BasicClient;

#[derive(Clone)]
pub struct AppState {
    pub jwk_set: jwk::JwkSet,
    pub oauth_client: BasicClient,
    pub verifiers: Arc<Mutex<HashMap<String, String>>>,
}
