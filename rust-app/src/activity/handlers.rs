use askama::Template;
use axum::{
    extract::{Path, Query, State},
    middleware,
    response::{IntoResponse, Redirect},
    routing::{get, post},
    Extension, Router,
};

use axum_extra::extract::Form;
use chrono::prelude::*;
use serde::Deserialize;
use tracing::{error, info};

use crate::{states::AppState};

use super::{AvailableTag, Create};

pub fn router(state: crate::states::AppState) -> Router<AppState> {
    Router::new()
        .route("/:date", get(list))
        .route("/start", get(start_form))
        .route("/start", post(start))
        .route("/:id/stop", post(stop))
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
    id: sqlx::types::Uuid,
    name: String,
    // start_time: chrono::DateTime<chrono::Utc>,
    // end_time: Option<chrono::DateTime<chrono::Utc>>,
    duration: String,
    duration_iso: String,
    tags: Vec<TagTemplData>,
}

pub struct TagTemplData {
    // id: sqlx::types::Uuid,
    name: String,
}

#[derive(Template)]
#[template(path = "activities.html")]
struct ActivitiesTemplate {
    activities: Vec<ActivityTemplData>,
    running: Option<ActivityTemplData>,
    date: String,
    curr: chrono::NaiveDate,
    prev: chrono::NaiveDate,
    next: chrono::NaiveDate,
}

async fn list(
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
        start.format("%a, %b %d %Y").to_string()
    };
    let activities = crate::activity::in_range(&state.db, user_id.clone(), start, end).await?;
    let activities = activities
        .iter()
        .filter(|a| a.end_time.is_some())
        .map(|a| {
            let duration = a.end_time.unwrap_or_else(Utc::now) - a.start_time;
            let duration_iso = format!("{duration}");
            let mintues = (duration.num_seconds() / 60) % 60;
            let hours = (duration.num_seconds() / 60) / 60;
            let duration = format!("{hours}h {mintues}m");
            ActivityTemplData {
                id: a.id,
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

    let running = crate::activity::running(&state.db, user_id.clone())
        .await?
        .map(|a| {
            let duration = a.end_time.unwrap_or_else(Utc::now) - a.start_time;
            let duration_iso = format!("{duration}");
            let mintues = (duration.num_seconds() / 60) % 60;
            let hours = (duration.num_seconds() / 60) / 60;
            let duration = format!("{hours}h {mintues}m");
            ActivityTemplData {
                id: a.id,
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
        });
    Ok(ActivitiesTemplate {
        activities,
        running,
        date,
        curr: start,
        prev,
        next: end,
    })
}

#[derive(Template)]
#[template(path = "activities/start_form.html")]
struct StartForm {
    available_tags: Vec<AvailableTag>,
}

async fn start_form(
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    let available_tags = crate::activity::available_tags(&state.db, user_id).await?;
    Ok(StartForm { available_tags })
}

#[derive(Debug, Deserialize)]
struct CreateActivity {
    name: String,

    #[serde(default, rename = "tags[]")]
    tags: Vec<sqlx::types::Uuid>,
}

async fn start(
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Form(create_activity): Form<CreateActivity>,
) -> Result<Redirect, crate::errors::AppError> {
    info!("tags: {:?}", create_activity.tags);
    let activity_id = crate::activity::create(
        &state.db,
        Create {
            user_id: user_id.clone(),
            name: create_activity.name,
            start_time: Utc::now(),
            end_time: None,
            // tags: Vec::new(),
        },
    )
    .await?;

    match crate::activity::associate_tags(
        &state.db,
        user_id.clone(),
        create_activity.tags,
        activity_id,
    )
    .await
    {
        Ok(()) => (),
        Err(e) => error!("associate tags failed: {e}"),
    };

    Ok(Redirect::to("/app"))
}

#[derive(Debug, Deserialize)]
struct StopQuery {
    date: String,
}

async fn stop(
    Path(id): Path<String>,
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Query(query): Query<StopQuery>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    crate::activity::stop(&state.db, user_id.clone(), id.clone()).await?;

    let start = query.date.parse::<NaiveDate>()?;
    let Some(end) = start.succ_opt() else {
        return Err(crate::errors::AppError::InternalError);
    };
    let Some(prev) = start.pred_opt() else {
        return Err(crate::errors::AppError::InternalError);
    };
    let date = if Utc::now().date_naive() == start {
        "Today".to_string()
    } else {
        start.format("%a, %b %d %Y").to_string()
    };
    let activities = crate::activity::in_range(&state.db, user_id.clone(), start, end).await?;
    let activities = activities
        .iter()
        .filter(|a| a.end_time.is_some())
        .map(|a| {
            let duration = a.end_time.unwrap_or_else(Utc::now) - a.start_time;
            let duration_iso = format!("{duration}");
            let mintues = (duration.num_seconds() / 60) % 60;
            let hours = (duration.num_seconds() / 60) / 60;
            let duration = format!("{hours}h {mintues}m");
            ActivityTemplData {
                id: a.id,
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

    let running = crate::activity::running(&state.db, user_id.clone())
        .await?
        .map(|a| {
            let duration = a.end_time.unwrap_or_else(Utc::now) - a.start_time;
            let duration_iso = format!("{duration}");
            let mintues = (duration.num_seconds() / 60) % 60;
            let hours = (duration.num_seconds() / 60) / 60;
            let duration = format!("{hours}h {mintues}m");
            ActivityTemplData {
                id: a.id,
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
        });
    Ok(ActivitiesTemplate {
        activities,
        running,
        date,
        curr: start,
        prev,
        next: end,
    })
}
