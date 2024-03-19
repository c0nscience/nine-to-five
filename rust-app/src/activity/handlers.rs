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
use urlencoding::decode;

use crate::{activity, auth, errors, states};

use super::{update, AvailableTag, Create};

const FORM_DATE_TIME_FORMAT: &str = "%Y-%m-%dT%H:%M";

pub fn router(state: states::AppState) -> Router<states::AppState> {
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
            auth::check_authorized,
        ))
}

struct ActivityTemplData {
    id: sqlx::types::Uuid,
    name: String,
    duration: String,
    duration_iso: String,
    tags: Vec<TagTemplData>,
}

struct RunningActivityTemplData {
    id: sqlx::types::Uuid,
    name: String,
    start_time: i64,
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
    running: Option<RunningActivityTemplData>,
    date: String,
    curr: chrono::NaiveDate,
    prev: chrono::NaiveDate,
    next: chrono::NaiveDate,
}

async fn list(
    Path(date): Path<String>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    TypedHeader(cookie): TypedHeader<Cookie>,
) -> Result<impl IntoResponse, errors::AppError> {
    let timezone = parse_timezone(&cookie)?;

    let start = date.parse::<NaiveDate>()?;
    let Some(end) = start.succ_opt() else {
        return Err(errors::AppError::InternalError);
    };

    let Some(prev) = start.pred_opt() else {
        return Err(errors::AppError::InternalError);
    };

    let now = Utc::now().with_timezone(&timezone).date_naive();
    let date = if now == start {
        "Today".to_string()
    } else {
        start.format("%a, %b %d %Y").to_string()
    };

    let from = to_utc(start, timezone)?;
    let to = to_utc(end, timezone)?;

    let activities = activity::in_range(&state.db, user_id.clone(), from, to).await?;
    let activities = activities
        .iter()
        .filter(|a| a.end_time.is_some())
        .map(|a| {
            let (duration, duration_iso) = format_duration(a.start_time, a.end_time);
            ActivityTemplData {
                id: a.id,
                name: a.name.clone(),
                duration,
                duration_iso,
                tags: a
                    .tags
                    .iter()
                    .map(|t| TagTemplData {
                        name: t.name.clone(),
                    })
                    .collect(),
            }
        })
        .collect();

    let running = activity::running(&state.db, user_id.clone())
        .await?
        .map(|a| {
            let (duration, duration_iso) = format_duration(a.start_time, a.end_time);
            let start_time = a.start_time.timestamp_millis();
            RunningActivityTemplData {
                id: a.id,
                name: a.name.clone(),
                start_time,
                duration,
                duration_iso,
                tags: a
                    .tags
                    .iter()
                    .map(|t| TagTemplData {
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

fn format_duration(start: DateTime<Utc>, end: Option<DateTime<Utc>>) -> (String, String) {
    let duration = end.unwrap_or_else(Utc::now) - start;
    let duration_iso = format!("{duration}");
    let is_negative = duration.num_seconds() < 0;
    let seconds = duration.num_seconds().abs();
    let minutes = (seconds / 60) % 60;
    let hours = (seconds / 60) / 60;

    let duration = if hours.abs() > 0 {
        format!("{hours}h {minutes}m")
    } else {
        format!("{minutes}m")
    };

    let duration = if is_negative {
        format!("-{duration}")
    } else {
        duration
    };

    (duration, duration_iso)
}

fn to_utc(nd: chrono::NaiveDate, tz: Tz) -> Result<chrono::DateTime<Utc>, errors::AppError> {
    let Some(nd) = nd.and_hms_opt(0, 0, 0) else {
        return Err(errors::AppError::InternalError);
    };
    let LocalResult::Single(dt) = tz.from_local_datetime(&nd) else {
        return Err(errors::AppError::InternalError);
    };

    Ok(dt.to_utc())
}

#[derive(Template)]
#[template(path = "activities/start_form.html")]
struct StartForm {
    available_tags: Vec<AvailableTag>,
}

async fn start_form(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    let available_tags = activity::available_tags(&state.db, user_id).await?;
    Ok(StartForm { available_tags })
}

#[derive(Debug, Deserialize)]
struct CreateActivity {
    name: String,

    #[serde(default)]
    tags: Vec<sqlx::types::Uuid>,
}

async fn start(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Form(create_activity): Form<CreateActivity>,
) -> Result<Redirect, errors::AppError> {
    let start = Utc::now();
    let activity_id = activity::create(
        &state.db,
        Create {
            user_id: user_id.clone(),
            name: create_activity.name,
            start_time: start.adjust().unwrap_or(start),
            end_time: None,
        },
    )
    .await?;

    activity::associate_tags(&state.db, create_activity.tags, activity_id).await?;

    Ok(Redirect::to("/app"))
}

#[derive(Debug, Deserialize)]
struct DateQuery {
    date: String,
}

async fn stop(
    Path(id): Path<String>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Query(query): Query<DateQuery>,
    TypedHeader(cookie): TypedHeader<Cookie>,
) -> Result<impl IntoResponse, errors::AppError> {
    let now = Utc::now();
    activity::stop(
        &state.db,
        user_id.clone(),
        id.clone(),
        now.adjust().unwrap_or(now),
    )
    .await?;

    list(
        Path(query.date),
        State(state.clone()),
        Extension(user_id.clone()),
        TypedHeader(cookie.clone()),
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
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Form(new_tag): Form<AddTagForm>,
) -> Result<impl IntoResponse, errors::AppError> {
    let name = new_tag.name.trim();
    if !activity::tag_exists(&state.db, user_id.clone(), name.to_string()).await? {
        activity::create_tag(&state.db, user_id.clone(), name.to_string()).await?;
    };
    let available_tags = activity::available_tags(&state.db, user_id.clone()).await?;

    Ok(AvailableTagsTemplate { available_tags })
}

async fn delete_activity(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Query(query): Query<DateQuery>,
    TypedHeader(cookie): TypedHeader<Cookie>,
) -> Result<impl IntoResponse, errors::AppError> {
    activity::delete(&state.db, user_id.clone(), id).await?;
    list(
        Path(query.date),
        State(state.clone()),
        Extension(user_id.clone()),
        TypedHeader(cookie.clone()),
    )
    .await
}

trait WithContains {
    fn contains(arr: &[activity::Tag], id: &sqlx::types::Uuid) -> bool;
}

#[derive(Template)]
#[template(path = "activities/edit_form.html")]
struct EditFormTemplate {
    activity: EditFormData,
    available_tags: Vec<activity::AvailableTag>,
    redirect_to: String,
}

impl WithContains for EditFormTemplate {
    fn contains(arr: &[activity::Tag], id: &sqlx::types::Uuid) -> bool {
        arr.iter().any(|e| e.id == *id)
    }
}

#[derive(Debug)]
struct EditFormData {
    id: sqlx::types::Uuid,
    name: String,
    start_time: String,
    end_time: Option<String>,
    tags: Vec<activity::Tag>,
}

async fn edit_form(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    TypedHeader(cookie): TypedHeader<Cookie>,
    Query(query): Query<DateQuery>,
) -> Result<impl IntoResponse, errors::AppError> {
    let timezone = parse_timezone(&cookie)?;

    let Some(activity) = activity::get(&state.db, user_id.clone(), id).await? else {
        return Err(errors::AppError::NotFound);
    };

    let available_tags = activity::available_tags(&state.db, user_id).await?;

    let start = activity
        .start_time
        .with_timezone(&timezone)
        .format(FORM_DATE_TIME_FORMAT);
    let end = activity.end_time.map(|d| {
        d.with_timezone(&timezone)
            .format(FORM_DATE_TIME_FORMAT)
            .to_string()
    });
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
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    TypedHeader(cookie): TypedHeader<Cookie>,
    Query(query): Query<DateQuery>,
    Form(updated_activity): Form<UpdateActivity>,
) -> Result<Redirect, errors::AppError> {
    let timezone = parse_timezone(&cookie)?;

    let LocalResult::Single(start_time) =
        NaiveDateTime::parse_from_str(updated_activity.start_time.as_str(), FORM_DATE_TIME_FORMAT)?
            .and_local_timezone(timezone)
            .map(|d| d.to_utc())
    else {
        return Err(errors::AppError::InternalError);
    };

    let end_time = updated_activity
        .end_time
        .and_then(|e| NaiveDateTime::parse_from_str(e.as_str(), FORM_DATE_TIME_FORMAT).ok())
        .map(|d| d.and_local_timezone(timezone))
        .and_then(|d| {
            let LocalResult::Single(d) = d else {
                return None;
            };
            Some(d)
        })
        .map(|d| d.to_utc());

    update(
        &state.db,
        user_id.clone(),
        activity::Update {
            id,
            name: updated_activity.name,
            start_time,
            end_time,
        },
    )
    .await?;

    activity::delete_associate_tags(&state.db, user_id.clone(), id).await?;
    activity::associate_tags(&state.db, updated_activity.tags, id).await?;

    Ok(Redirect::to(format!("/app/{}", query.date).as_str()))
}

fn parse_timezone(cookie: &Cookie) -> Result<Tz, errors::AppError> {
    cookie
        .get("timezone")
        .and_then(|d| decode(d).ok())
        .and_then(|d| d.parse::<Tz>().ok())
        .ok_or(errors::AppError::InternalError)
}

trait Adjustable
where
    Self: Sized,
{
    fn adjust(self) -> Option<Self>;
}

const ACCURACY: i32 = 5;
impl Adjustable for DateTime<Utc> {
    fn adjust(self) -> Option<Self> {
        let minute: i32 = self.minute().try_into().ok()?;
        let remainder: i32 = minute % ACCURACY;
        let adjust_by: i32 = if remainder < 3 {
            -remainder
        } else {
            ACCURACY - remainder
        };
        let result = minute + adjust_by;
        let result = result.try_into().ok()?;
        self.with_minute(result)
            .and_then(|d| d.with_second(0))
            .and_then(|d| d.with_nanosecond(0))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_adjust_to_accuracy_down() -> Result<(), String> {
        assert_eq!(
            Utc.with_ymd_and_hms(2024, 3, 18, 10, 10, 0).unwrap(),
            Utc.with_ymd_and_hms(2024, 3, 18, 10, 12, 0)
                .unwrap()
                .adjust()
                .ok_or("could not adjust the time")?
        );
        Ok(())
    }

    #[test]
    fn test_adjust_to_accuracy_up() -> Result<(), String> {
        assert_eq!(
            Utc.with_ymd_and_hms(2024, 3, 18, 10, 15, 0).unwrap(),
            Utc.with_ymd_and_hms(2024, 3, 18, 10, 13, 0)
                .unwrap()
                .adjust()
                .ok_or("could not adjust the time")?
        );
        Ok(())
    }

    #[test]
    fn test_adjust_truncates_to_minutes() -> Result<(), String> {
        assert_eq!(
            Utc.with_ymd_and_hms(2024, 3, 18, 10, 15, 0).unwrap(),
            Utc.with_ymd_and_hms(2024, 3, 18, 10, 13, 42)
                .unwrap()
                .with_nanosecond(133_723_948)
                .ok_or("could not add nano seconds to the time")?
                .adjust()
                .ok_or("could not adjust the time")?
        );
        Ok(())
    }

    #[test]
    fn test_format_duration() {
        let start = Utc.with_ymd_and_hms(2024, 3, 18, 10, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 3, 18, 10, 5, 0).unwrap();
        let (duration, _) = format_duration(start, Some(end));
        assert_eq!("5m", duration);
    }

    #[test]
    fn test_format_duration_with_negative_duration() {
        let start = Utc.with_ymd_and_hms(2024, 3, 18, 10, 5, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 3, 18, 10, 0, 0).unwrap();
        let (duration, _) = format_duration(start, Some(end));
        assert_eq!("-5m", duration);
    }

    #[test]
    fn test_format_duration_with_long_duration() {
        let start = Utc.with_ymd_and_hms(2024, 3, 18, 10, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 3, 18, 11, 5, 0).unwrap();
        let (duration, _) = format_duration(start, Some(end));
        assert_eq!("1h 5m", duration);
    }

    #[test]
    fn test_format_duration_with_negative_long_duration() {
        let start = Utc.with_ymd_and_hms(2024, 3, 18, 11, 5, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 3, 18, 10, 0, 0).unwrap();
        let (duration, _) = format_duration(start, Some(end));
        assert_eq!("-1h 5m", duration);
    }
}
