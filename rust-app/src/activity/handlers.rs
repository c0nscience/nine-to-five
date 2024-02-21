use askama::Template;
use axum::{
    extract::{Path, State},
    middleware,
    response::IntoResponse,
    routing::get,
    Extension, Router,
};
use chrono::prelude::*;
use tracing::{error, info};

use crate::states::AppState;

pub fn router(state: crate::states::AppState) -> Router<AppState> {
    Router::new()
        .route("/:date", get(activities))
        .route_layer(middleware::from_fn_with_state(
            state,
            crate::auth::check_authorized,
        ))
}

async fn activities(
    Path(date): Path<String>,
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    info!("user {}", user_id);
    let start = date.parse::<NaiveDate>()?;
    let Some(end) = start.succ_opt() else {
        return Err(crate::errors::AppError::InternalError);
    };
    let activities = match crate::activity::in_range(state.db, user_id, start, end).await {
        Ok(a) => a,
        Err(e) => {
            error!("error {e}");
            Vec::new()
        }
    };
    info!("activities: {:#?}", activities);
    Ok(ActivitiesTemplate {})
}

#[derive(Template)]
#[template(path = "activities.html")]
struct ActivitiesTemplate {}
