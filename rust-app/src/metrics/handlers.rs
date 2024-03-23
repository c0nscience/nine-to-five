use askama::Template;
use axum::{
    extract::State,
    middleware,
    response::{IntoResponse, Redirect},
    routing::get,
    Extension, Router,
};

use tracing::info;

use super::*;
use crate::{activity, auth, errors, states};

pub fn router(state: states::AppState) -> Router<states::AppState> {
    Router::new()
        .route("/", get(list).post(create_metric))
        .route("/new", get(new_form))
        .route_layer(middleware::from_fn_with_state(
            state,
            auth::check_authorized,
        ))
}

#[derive(Template)]
#[template(path = "metrics.html")]
struct MetricsTemplate {}

async fn list(
    State(_state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    info!("user_id: {}", user_id);

    Ok(MetricsTemplate {})
}

#[derive(Template)]
#[template(path = "metrics/new_form.html")]
struct NewMetricTemplate {
    available_tags: Vec<activity::AvailableTag>,
}

async fn new_form(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    let available_tags = activity::available_tags(&state.db, user_id).await?;
    Ok(NewMetricTemplate { available_tags })
}

async fn create_metric(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    Ok(Redirect::to("/app/metrics"))
}
