use askama::Template;
use axum::{
    extract::{Path, Query, State},
    middleware,
    response::{IntoResponse, Redirect},
    routing::{delete, get, post},
    Extension, Router,
};

use axum_extra::extract::Form;
use chrono::prelude::*;
use serde::Deserialize;

use crate::states::AppState;

use super::{AvailableTag, Create};

const FORM_DATE_TIME_FORMAT: &str = "%Y-%m-%dT%H:%M";

pub fn router(state: crate::states::AppState) -> Router<AppState> {
    Router::new()
        .route("/:date", get(list))
        .route("/start", get(start_form))
        .route("/start", post(start))
        .route(
            "/activity/:id",
            delete(delete_activity).get(edit_form).post(update_activity),
        )
        .route("/activity/:id/stop", post(stop))
        .route("/tags", post(add_tag))
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
    start_time: i64,
    // end_time: Option<chrono::DateTime<chrono::Utc>>,
    duration: String,
    duration_iso: String,
    tags: Vec<TagTemplData>,
}

pub struct TagTemplData {
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
            let start_time = a.start_time.timestamp_millis();
            ActivityTemplData {
                id: a.id,
                name: a.name.clone(),
                start_time,
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
            let start_time = a.start_time.timestamp_millis();
            ActivityTemplData {
                id: a.id,
                name: a.name.clone(),
                start_time,
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

    #[serde(default)]
    tags: Vec<sqlx::types::Uuid>,
}

async fn start(
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Form(create_activity): Form<CreateActivity>,
) -> Result<Redirect, crate::errors::AppError> {
    let activity_id = crate::activity::create(
        &state.db,
        Create {
            user_id: user_id.clone(),
            name: create_activity.name,
            start_time: Utc::now(),
            end_time: None,
        },
    )
    .await?;

    crate::activity::associate_tags(
        &state.db,
        user_id.clone(),
        create_activity.tags,
        activity_id,
    )
    .await?;

    Ok(Redirect::to("/app"))
}

#[derive(Debug, Deserialize)]
struct DateQuery {
    date: String,
}

async fn stop(
    Path(id): Path<String>,
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Query(query): Query<DateQuery>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    crate::activity::stop(&state.db, user_id.clone(), id.clone()).await?;
    list(
        Path(query.date),
        State(state.clone()),
        Extension(user_id.clone()),
    )
    .await
}

#[derive(Template)]
#[template(path = "activities/tag_option_list.html")]
struct AvailableTagsTemplate {
    available_tags: Vec<AvailableTag>,
}

#[derive(Debug, Deserialize)]
struct AddTagForm {
    #[serde(rename = "tags-search")]
    name: String,
}

async fn add_tag(
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Form(new_tag): Form<AddTagForm>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    let name = new_tag.name.trim();
    if !crate::activity::tag_exists(&state.db, user_id.clone(), name.to_string()).await? {
        crate::activity::create_tag(&state.db, user_id.clone(), name.to_string()).await?;
    };
    let available_tags = crate::activity::available_tags(&state.db, user_id.clone()).await?;

    Ok(AvailableTagsTemplate { available_tags })
}

async fn delete_activity(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Query(query): Query<DateQuery>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    crate::activity::delete(&state.db, user_id.clone(), id).await?;
    list(
        Path(query.date),
        State(state.clone()),
        Extension(user_id.clone()),
    )
    .await
}

trait WithContains {
    fn contains(arr: &[crate::activity::Tag], id: &sqlx::types::Uuid) -> bool;
}

#[derive(Template)]
#[template(path = "activities/edit_form.html")]
struct EditFormTemplate {
    activity: EditFormData,
    available_tags: Vec<crate::activity::AvailableTag>,
    redirect_to: String,
}

impl WithContains for EditFormTemplate {
    fn contains(arr: &[crate::activity::Tag], id: &sqlx::types::Uuid) -> bool {
        arr.iter().any(|e| e.id == *id)
    }
}

#[derive(Debug)]
struct EditFormData {
    id: sqlx::types::Uuid,
    name: String,
    start_time: String,
    end_time: Option<String>,
    tags: Vec<crate::activity::Tag>,
}

async fn edit_form(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Query(query): Query<DateQuery>,
) -> Result<impl IntoResponse, crate::errors::AppError> {
    let Some(activity) = crate::activity::get(&state.db, user_id.clone(), id).await? else {
        return Err(crate::errors::AppError::NotFound);
    };
    let available_tags = crate::activity::available_tags(&state.db, user_id).await?;
    let start = activity.start_time.format(FORM_DATE_TIME_FORMAT);
    let end = activity
        .end_time
        .map(|d| d.format(FORM_DATE_TIME_FORMAT).to_string());
    let activity = EditFormData {
        id: activity.id,
        name: activity.name,
        start_time: start.to_string(),
        end_time: end,
        tags: activity.tags,
    };

    Ok(EditFormTemplate {
        activity,
        available_tags,
        redirect_to: query.date,
    })
}

#[derive(Debug, Deserialize)]
struct UpdateActivity {
    name: String,
    start_time: String,
    end_time: Option<String>,

    #[serde(default)]
    tags: Vec<sqlx::types::Uuid>,
}

async fn update_activity(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<crate::states::AppState>,
    Extension(user_id): Extension<String>,
    Query(query): Query<DateQuery>,
    Form(updated_activity): Form<UpdateActivity>,
) -> Result<Redirect, crate::errors::AppError> {
    let start_time =
        NaiveDateTime::parse_from_str(updated_activity.start_time.as_str(), FORM_DATE_TIME_FORMAT)?
            .and_utc();
    let end_time = updated_activity
        .end_time
        .and_then(|e| NaiveDateTime::parse_from_str(e.as_str(), FORM_DATE_TIME_FORMAT).ok())
        .map(|d| d.and_utc());
    crate::activity::update(
        &state.db,
        user_id.clone(),
        crate::activity::UpdateActivity {
            id,
            name: updated_activity.name,
            start_time,
            end_time,
        },
    )
    .await?;

    crate::activity::delete_associate_tags(&state.db, user_id.clone(), id).await?;
    crate::activity::associate_tags(&state.db, user_id.clone(), updated_activity.tags, id).await?;

    Ok(Redirect::to(format!("/app/{}", query.date).as_str()))
}
