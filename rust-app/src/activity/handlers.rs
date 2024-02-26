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

struct ActivityTemplate {
    id: sqlx::types::Uuid,
    user_id: String,
    name: String,
    start_time: chrono::DateTime<chrono::Utc>,
    end_time: Option<chrono::DateTime<chrono::Utc>>,
    duration: chrono::TimeDelta,
    tags: Vec<TagTemplate>,
}

pub struct TagTemplate {
    id: sqlx::types::Uuid,
    user_id: String,
    name: String,
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
        date
    };
    let activities = crate::activity::in_range(state.db, user_id, start, end).await?;
    let activities = activities
        .iter()
        .map(|a| {
            let duration = a.end_time.unwrap_or_else(Utc::now) - a.start_time;
            ActivityTemplate {
                id: a.id,
                user_id: a.user_id.clone(),
                name: a.name.clone(),
                start_time: a.start_time,
                end_time: a.end_time,
                duration,
                tags: a
                    .tags
                    .iter()
                    .map(|t| TagTemplate {
                        id: t.id,
                        user_id: t.user_id.clone(),
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

async fn new_activity(
    State(_state): State<crate::states::AppState>,
    Extension(_user_id): Extension<String>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    Ok(NewActivityTemplate {})
}
#[derive(Template)]
#[template(path = "activities.html")]
struct ActivitiesTemplate {
    activities: Vec<ActivityTemplate>,
    date: String,
    prev: chrono::NaiveDate,
    next: chrono::NaiveDate,
}
#[derive(Template)]
#[template(path = "activities/create_modal.html")]
struct NewActivityTemplate {}
