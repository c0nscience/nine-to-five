use askama::Template;
use axum::{
    extract::{Path, State},
    middleware,
    response::{IntoResponse, Redirect},
    routing::get,
    Extension, Router,
};
use chrono::prelude::*;

use crate::states::AppState;

pub fn router(state: crate::states::AppState) -> Router<AppState> {
    Router::new()
        .route("/:date", get(activities))
        .route("/new", get(new_activity))
        .route(
            "/",
            get(|| async {
                let now = Utc::now();
                let now = now.format("%Y-%m-%d");
                Redirect::temporary(format!("/app/{now}").as_str())
            }),
        )
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
    let start = date.parse::<NaiveDate>()?;
    let Some(end) = start.succ_opt() else {
        return Err(crate::errors::AppError::InternalError);
    };
    let activities = crate::activity::in_range(state.db, user_id, start, end).await?;
    Ok(ActivitiesTemplate { activities, date })
}

async fn new_activity(
    State(_state): State<crate::states::AppState>,
    Extension(_user_id): Extension<String>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    Ok(NewActivityTemplate {})
}
#[derive(Template)]
#[template(path = "activities.html")]
struct ActivitiesTemplate {
    activities: Vec<crate::activity::Activity>,
    date: String,
}
#[derive(Template)]
#[template(path = "activities/create_modal.html")]
struct NewActivityTemplate {}
