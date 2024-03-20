
use askama::Template;
use axum::{
    extract::{State},
    middleware,
    response::{IntoResponse},
    routing::{get},
    Extension, Router,
};






use tracing::info;


use crate::{auth, errors, states};

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
    State(_state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    info!("user_id: {}", user_id);

    Ok(MetricsTemplate {})
}
