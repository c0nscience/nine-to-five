use askama::Template;
use axum::{
    extract::{Path, State},
    middleware,
    response::{IntoResponse, Redirect},
    routing::{get, post},
    Extension, Form, Router,
};
use axum_macros::debug_handler;
use chrono::prelude::*;
use serde::Deserialize;
use tracing::{error, info};

use crate::states::AppState;

use super::StoreActivity;

pub fn router(state: crate::states::AppState) -> Router<AppState> {
    Router::new()
        .route("/:date", get(activities))
        .route("/new", get(new_activity))
        .route("/new", post(create_new_activity))
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

struct ActivityTemplData {
    // id: sqlx::types::Uuid,
    // user_id: String,
    name: String,
    // start_time: chrono::DateTime<chrono::Utc>,
    // end_time: Option<chrono::DateTime<chrono::Utc>>,
    duration: String,
    duration_iso: String,
    tags: Vec<TagTemplData>,
}

pub struct TagTemplData {
    // id: sqlx::types::Uuid,
    // user_id: String,
    name: String,
}

#[derive(Template)]
#[template(path = "activities.html")]
struct ActivitiesTemplate {
    activities: Vec<ActivityTemplData>,
    date: String,
    prev: chrono::NaiveDate,
    next: chrono::NaiveDate,
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
    let Some(prev) = start.pred_opt() else {
        return Err(crate::errors::AppError::InternalError);
    };
    let date = if Utc::now().date_naive() == start {
        "Today".to_string()
    } else {
        start.format("%a, %b %d, %Y").to_string()
    };
    let activities = crate::activity::in_range(state.db, user_id, start, end).await?;
    let activities = activities
        .iter()
        .map(|a| {
            let duration = a.end_time.unwrap_or_else(Utc::now) - a.start_time;
            let duration_iso = format!("{duration}");
            let mintues = (duration.num_seconds() / 60) % 60;
            let hours = (duration.num_seconds() / 60) / 60;
            let duration = format!("{hours}h {mintues}m");
            ActivityTemplData {
                // id: a.id,
                // user_id: a.user_id.clone(),
                name: a.name.clone(),
                // start_time: a.start_time,
                // end_time: a.end_time,
                duration,
                duration_iso,
                tags: a
                    .tags
                    .iter()
                    .map(|t| TagTemplData {
                        // id: t.id,
                        // user_id: t.user_id.clone(),
                        name: t.name.clone(),
                    })
                    .collect(),
            }
        })
        .collect();
    Ok(ActivitiesTemplate {
        activities,
        date,
        prev,
        next: end,
    })
}

#[derive(Template)]
#[template(path = "activities/create_modal.html")]
struct NewActivityTemplate {}

async fn new_activity(
    State(_state): State<crate::states::AppState>,
    Extension(_user_id): Extension<String>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    Ok(NewActivityTemplate {})
}

#[derive(Debug, Deserialize)]
struct CreateActivity {
    name: String,
}

#[debug_handler]
async fn create_new_activity(
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Form(create_activity): Form<CreateActivity>,
) -> Result<Redirect, crate::errors::AppError> {
    crate::activity::create(
        state.db,
        StoreActivity {
            user_id,
            name: create_activity.name,
            start_time: Utc::now(),
            end_time: None,
            // tags: Vec::new(),
        },
    )
    .await?;
    Ok(Redirect::to("/app"))
}
