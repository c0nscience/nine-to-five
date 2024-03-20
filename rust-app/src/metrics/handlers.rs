use anyhow::anyhow;
use askama::Template;
use axum::{
    extract::{Path, Query, State},
    middleware,
    response::{IntoResponse, Redirect},
    routing::{delete, get, post},
    Extension, Router,
};

use axum_extra::{extract::Form, headers::Cookie, TypedHeader};
use chrono::{prelude::*, LocalResult};

use chrono_tz::Tz;
use serde::Deserialize;
use tracing::info;
use urlencoding::decode;

use crate::{activity, auth, errors, states};

pub fn router(state: states::AppState) -> Router<states::AppState> {
    Router::new()
        .route("/", get(list))
        .route_layer(middleware::from_fn_with_state(
            state,
            auth::check_authorized,
        ))
}

#[derive(Template)]
#[template(path = "metrics.html")]
struct MetricsTemplate {}

async fn list(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    info!("user_id: {}", user_id);

    Ok(MetricsTemplate {})
}
