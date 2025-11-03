use std::collections::HashSet;

use anyhow::anyhow;
use askama::Template;
use axum::{
    Extension, Router,
    extract::{Path, Query, State},
    middleware,
    response::{Html, IntoResponse, Redirect},
    routing::{delete, get, post},
};

use axum_extra::{TypedHeader, extract::Form, headers::Cookie};
use chrono::{Duration, LocalResult, TimeDelta, prelude::*};

use chrono_tz::Tz;
use serde::Deserialize;

use crate::{
    activity::{self, summary_in_range},
    auth, encrypt, errors,
    func::parse_timezone,
    hash::{self},
    states,
};

use super::{
    AvailableTag, Create, Tag, Update, associate_tags, available_tags, create, create_tag,
    delete_associate_tags, in_range, running, tag_exists, update,
};

const FORM_DATE_TIME_FORMAT: &str = "%Y-%m-%dT%H:%M";
const FORM_TIME_FORMAT: &str = "%H:%M";

pub fn router(state: states::AppState) -> Router<states::AppState> {
    Router::new()
        .route("/{date}", get(list))
        .route("/{date}/summary", get(summary))
        .route("/start", get(start_form).post(start))
        .route(
            "/activity/{id}",
            delete(delete_activity).get(edit_form).post(update_activity),
        )
        .route("/activity/{id}/continue", get(continue_activity))
        .route("/activity/{id}/stop", post(stop))
        .route("/tags", post(add_tag))
        .route("/menu", get(menu))
        .route("/", get(today))
        .route_layer(middleware::from_fn_with_state(
            state,
            auth::check_authorized,
        ))
}

struct ActivityTemplData {
    id: sqlx::types::Uuid,
    name: String,
    start_time: String,
    end_time: String,
    duration: TimeDelta,
    duration_human: String,
    duration_iso: String,
    tags: Vec<TagTemplData>,
}

struct RunningActivityTemplData {
    id: sqlx::types::Uuid,
    name: String,
    start_time: DateTime<Utc>,
    start_time_timestamp: i64,
    duration: TimeDelta,
    duration_human: String,
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
    total_duration: String,
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
    let timezone = parse_timezone(&cookie);

    let start = date.parse::<NaiveDate>()?;
    let Some(end) = start.succ_opt() else {
        return Err(errors::AppError::InternalError);
    };

    let Some(prev) = start.pred_opt() else {
        return Err(errors::AppError::InternalError);
    };

    let now = Utc::now().with_timezone(&timezone).date_naive();
    let start_fmt = start.format("%a, %b %d %Y").to_string();
    let date = if now == start {
        format!("Today ({start_fmt})")
    } else {
        start_fmt
    };

    let from = to_utc(start, timezone)?;
    let to = to_utc(end, timezone)?;

    let activities = in_range(&state.db, user_id.clone(), from, to).await?;
    let activities: Vec<ActivityTemplData> = activities
        .iter()
        .filter(|a| a.end_time.is_some())
        .map(|a| {
            let (duration_human, duration_iso, duration) =
                format_duration(a.start_time, a.end_time);
            let name = encrypt::decrypt(&a.name, &state.database_key).unwrap_or_default();
            let mut tags: Vec<TagTemplData> = a
                .tags
                .iter()
                .map(|t| {
                    let name = encrypt::decrypt(&t.name, &state.database_key).unwrap_or_default();
                    TagTemplData { name }
                })
                .collect();

            tags.sort_by_key(|t| t.name.to_lowercase());

            let start = a
                .start_time
                .with_timezone(&timezone)
                .format(FORM_TIME_FORMAT)
                .to_string();
            let end = match a
                .end_time
                .map(|d| d.with_timezone(&timezone).format(FORM_TIME_FORMAT))
            {
                Some(s) => s.to_string(),
                None => "".to_string(),
            };

            ActivityTemplData {
                id: a.id,
                name,
                start_time: start,
                end_time: end,
                duration,
                duration_human,
                duration_iso,
                tags,
            }
        })
        .collect();

    let running = running(&state.db, user_id.clone()).await?.map(|a| {
        let (duration_human, duration_iso, duration) = format_duration(a.start_time, a.end_time);
        let start_time_timestamp = a.start_time.timestamp_millis();
        let start_time = a.start_time;
        let name = encrypt::decrypt(&a.name, &state.database_key).unwrap_or_default();
        let mut tags: Vec<TagTemplData> = a
            .tags
            .iter()
            .map(|t| {
                let name = encrypt::decrypt(&t.name, &state.database_key).unwrap_or_default();
                TagTemplData { name }
            })
            .collect();

        tags.sort_by_key(|t| t.name.to_lowercase());
        RunningActivityTemplData {
            id: a.id,
            name,
            start_time,
            start_time_timestamp,
            duration,
            duration_human,
            duration_iso,
            tags,
        }
    });

    let total_duration: TimeDelta = activities.iter().map(|a| a.duration).sum();
    let total_duration = total_duration
        + running
            .as_ref()
            .filter(|r| r.start_time.date_naive() == start)
            .map_or(TimeDelta::zero(), |r| r.duration);
    let total_duration = duration_human(total_duration);

    Ok(Html(
        ActivitiesTemplate {
            activities,
            total_duration,
            running,
            date,
            curr: start,
            prev,
            next: end,
        }
        .render()?,
    ))
}

fn duration_human(duration: TimeDelta) -> String {
    let is_negative = duration.num_seconds() < 0;
    let seconds = duration.num_seconds().abs();
    let minutes = (seconds / 60) % 60;
    let hours = (seconds / 60) / 60;

    let duration_human = if hours.abs() > 0 {
        format!("{hours}h {minutes}m")
    } else {
        format!("{minutes}m")
    };

    if is_negative {
        format!("-{duration_human}")
    } else {
        duration_human
    }
}

fn format_duration(
    start: DateTime<Utc>,
    end: Option<DateTime<Utc>>,
) -> (String, String, TimeDelta) {
    let duration = end.unwrap_or_else(Utc::now) - start;
    let duration_iso = format!("{duration}");
    let duration_human = duration_human(duration);

    (duration_human, duration_iso, duration)
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

async fn today(TypedHeader(cookie): TypedHeader<Cookie>) -> Result<Redirect, errors::AppError> {
    let timezone = parse_timezone(&cookie);
    let now = Utc::now().with_timezone(&timezone).date_naive();
    let now = now.format("%Y-%m-%d");

    Ok(Redirect::temporary(format!("/app/{now}").as_str()))
}

pub struct RangeSummaryTemplate {
    duration: TimeDelta,
    duration_human: String,
    duration_iso: String,
    labels: Vec<String>,
    tags: Vec<Tag>,
}

#[derive(Template)]
#[template(path = "activities/summary.html")]
struct ActivitiesSummaryTemplate {
    range_summary: Vec<RangeSummaryTemplate>,
    total_duration: String,
    date: String,
    curr: chrono::NaiveDate,
    prev: chrono::NaiveDate,
    next: chrono::NaiveDate,
}

async fn summary(
    Path(date): Path<String>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    TypedHeader(cookie): TypedHeader<Cookie>,
) -> Result<impl IntoResponse, errors::AppError> {
    let timezone = parse_timezone(&cookie);

    let start = date.parse::<NaiveDate>()?;
    let Some(end) = start.succ_opt() else {
        return Err(errors::AppError::InternalError);
    };

    let Some(prev) = start.pred_opt() else {
        return Err(errors::AppError::InternalError);
    };

    let now = Utc::now().with_timezone(&timezone).date_naive();
    let start_fmt = start.format("%a, %b %d %Y").to_string();
    let date = if now == start {
        format!("Today ({start_fmt})")
    } else {
        start_fmt
    };

    let from = to_utc(start, timezone)?;
    let to = to_utc(end, timezone)?;

    let range_summary = summary_in_range(&state.db, user_id.clone(), from, to).await?;
    let range_summary = range_summary
        .iter()
        .map(|rs| {
            let duration = rs.duration;
            let duration_human = duration_human(rs.duration);
            let duration_iso = format!("{duration}");
            let tags = rs
                .tags
                .iter()
                .map(|t| {
                    let name = encrypt::decrypt(&t.name, &state.database_key).unwrap_or_default();
                    Tag {
                        id: t.id,
                        user_id: t.user_id.clone(),
                        name,
                    }
                })
                .collect();
            let labels = rs
                .labels
                .iter()
                .map(|l| encrypt::decrypt(l, &state.database_key).unwrap_or_default())
                .collect::<HashSet<_>>()
                .into_iter()
                .collect::<Vec<_>>();

            RangeSummaryTemplate {
                duration,
                duration_human,
                duration_iso,
                labels,
                tags,
            }
        })
        .collect::<Vec<_>>();

    let total_duration: TimeDelta = range_summary.iter().map(|rs| rs.duration).sum();
    let total_duration = duration_human(total_duration);

    Ok(Html(
        ActivitiesSummaryTemplate {
            range_summary,
            total_duration,
            date,
            curr: start,
            prev,
            next: end,
        }
        .render()?,
    ))
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
    let mut available_tags: Vec<AvailableTag> = available_tags(&state.db, user_id)
        .await?
        .iter()
        .map(|t| {
            let name = encrypt::decrypt(&t.name, &state.database_key).unwrap_or_default();
            AvailableTag {
                id: t.id,
                name,
                search_hash: t.search_hash.clone(),
            }
        })
        .collect();
    available_tags.sort_by_key(|t| t.name.to_lowercase());

    Ok(Html(StartForm { available_tags }.render()?))
}

#[derive(Debug, Deserialize)]
enum StartOption {
    #[serde(rename = "normal")]
    Normal,

    #[serde(rename = "with-start")]
    WithStart,

    #[serde(rename = "repeating")]
    Repeating,
}

#[derive(Debug, Deserialize)]
struct CreateActivity {
    name: String,

    start_option: StartOption,
    start_time: Option<String>,
    end_time: Option<String>,
    from: Option<String>,
    to: Option<String>,

    #[serde(default)]
    days: Vec<chrono::Weekday>,

    #[serde(default)]
    tags: Vec<sqlx::types::Uuid>,
}

async fn start(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    TypedHeader(cookie): TypedHeader<Cookie>,
    Form(create_activity): Form<CreateActivity>,
) -> Result<Redirect, errors::AppError> {
    let timezone = parse_timezone(&cookie);
    let mut start = Utc::now();

    match create_activity.start_option {
        StartOption::WithStart => {
            if let Some(start_time) = create_activity.start_time {
                let start_time = NaiveTime::parse_from_str(start_time.as_str(), FORM_TIME_FORMAT)?;
                let start_time = parse_time(start_time, start.date_naive(), timezone)?;
                start = start_time;
            }
        }
        StartOption::Repeating => {
            let start_time = create_activity
                .start_time
                .as_ref()
                .ok_or_else(|| anyhow!("start_time is required for repeating activities"))
                .and_then(|s| Ok(NaiveTime::parse_from_str(s, FORM_TIME_FORMAT)?))?;

            let end_time = create_activity
                .end_time
                .as_ref()
                .ok_or_else(|| anyhow!("end_time is required for repeating activities"))
                .and_then(|s| Ok(NaiveTime::parse_from_str(s, FORM_TIME_FORMAT)?))?;

            let from = create_activity
                .from
                .and_then(|d| d.parse::<NaiveDate>().ok())
                .ok_or_else(|| anyhow!("from is required for repeating activities"))?;

            let to = create_activity
                .to
                .and_then(|d| d.parse::<NaiveDate>().ok())
                .ok_or_else(|| anyhow!("to is required for repeating activities"))?;

            for date in from
                .iter_days()
                .take_while(|d| d <= &to)
                .filter(|d| create_activity.days.contains(&d.weekday()))
            {
                let start_time = parse_time(start_time, date, timezone)?;
                let end_time = parse_time(end_time, date, timezone)?;
                let name = encrypt::encrypt(&create_activity.name, &state.database_key)
                    .unwrap_or_default();

                let activity = Create {
                    user_id: user_id.clone(),
                    name,
                    start_time,
                    end_time: Some(end_time),
                };
                let activity_id = create(&state.db, activity).await?;

                associate_tags(&state.db, &create_activity.tags, activity_id).await?;
            }
        }
        StartOption::Normal => {}
    }

    if !matches!(create_activity.start_option, StartOption::Repeating) {
        let name = encrypt::encrypt(&create_activity.name, &state.database_key).unwrap_or_default();
        let activity_id = create(
            &state.db,
            Create {
                user_id: user_id.clone(),
                name,
                start_time: start.adjust().unwrap_or(start),
                end_time: None,
            },
        )
        .await?;

        associate_tags(&state.db, &create_activity.tags, activity_id).await?;
    }

    Ok(Redirect::to("/app"))
}

fn parse_time(
    nt: NaiveTime,
    nd: NaiveDate,
    timezone: Tz,
) -> Result<DateTime<Utc>, errors::AppError> {
    let LocalResult::Single(nd) = nd
        .and_time(nt)
        .and_local_timezone(timezone)
        .map(|d| d.to_utc())
    else {
        return Err(errors::AppError::InternalError);
    };
    Ok(nd)
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
    let now = now.adjust().unwrap_or(now);
    activity::stop(&state.db, user_id.clone(), id.clone(), now).await?;

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
    let hashed_name = hash::hash(name, &state.database_hash_key)?;
    if !tag_exists(&state.db, user_id.clone(), hashed_name.clone()).await? {
        let enc_name = encrypt::encrypt(name, &state.database_key)?;
        create_tag(&state.db, user_id.clone(), enc_name, hashed_name).await?;
    }
    let mut available_tags: Vec<AvailableTag> = available_tags(&state.db, user_id)
        .await?
        .iter()
        .map(|t| {
            let name = encrypt::decrypt(&t.name, &state.database_key).unwrap_or_default();
            AvailableTag {
                id: t.id,
                name,
                search_hash: t.search_hash.clone(),
            }
        })
        .collect();
    available_tags.sort_by_key(|t| t.name.to_lowercase());

    Ok(Html(AvailableTagsTemplate { available_tags }.render()?))
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
    fn contains(arr: &[Tag], id: &sqlx::types::Uuid) -> bool;
}

#[derive(Template)]
#[template(path = "activities/edit_form.html")]
struct EditFormTemplate {
    activity: EditFormData,
    available_tags: Vec<AvailableTag>,
    redirect_to: String,
}

impl WithContains for EditFormTemplate {
    fn contains(arr: &[Tag], id: &sqlx::types::Uuid) -> bool {
        arr.iter().any(|e| e.id == *id)
    }
}

#[derive(Debug)]
struct EditFormData {
    id: sqlx::types::Uuid,
    name: String,
    start_time: String,
    end_time: Option<String>,
    tags: Vec<Tag>,
}

async fn edit_form(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    TypedHeader(cookie): TypedHeader<Cookie>,
    Query(query): Query<DateQuery>,
) -> Result<impl IntoResponse, errors::AppError> {
    let timezone = parse_timezone(&cookie);

    let Some(activity) = activity::get(&state.db, user_id.clone(), id).await? else {
        return Err(errors::AppError::NotFound);
    };

    let mut available_tags: Vec<AvailableTag> = available_tags(&state.db, user_id)
        .await?
        .iter()
        .map(|t| {
            let name = encrypt::decrypt(&t.name, &state.database_key).unwrap_or_default();
            AvailableTag {
                id: t.id,
                name,
                search_hash: t.search_hash.clone(),
            }
        })
        .collect();

    available_tags.sort_by_key(|t| t.name.to_lowercase());

    let start = activity
        .start_time
        .with_timezone(&timezone)
        .format(FORM_DATE_TIME_FORMAT);
    let end = activity.end_time.map(|d| {
        d.with_timezone(&timezone)
            .format(FORM_DATE_TIME_FORMAT)
            .to_string()
    });

    let name = encrypt::decrypt(&activity.name, &state.database_key).unwrap_or_default();
    let activity = EditFormData {
        id: activity.id,
        name,
        start_time: start.to_string(),
        end_time: end,
        tags: activity.tags,
    };

    Ok(Html(
        EditFormTemplate {
            activity,
            available_tags,
            redirect_to: query.date,
        }
        .render()?,
    ))
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
    let timezone = parse_timezone(&cookie);

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

    let name = encrypt::encrypt(&updated_activity.name, &state.database_key).unwrap_or_default();
    update(
        &state.db,
        user_id.clone(),
        Update {
            id,
            name,
            start_time,
            end_time,
        },
    )
    .await?;

    delete_associate_tags(&state.db, user_id.clone(), id).await?;
    associate_tags(&state.db, &updated_activity.tags, id).await?;

    Ok(Redirect::to(format!("/app/{}", query.date).as_str()))
}

async fn continue_activity(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<Redirect, errors::AppError> {
    let now = Utc::now();
    let now = now.adjust().unwrap_or(now);
    if let Some(running) = running(&state.db, user_id.clone()).await? {
        activity::stop(&state.db, user_id.clone(), running.id.to_string(), now).await?;
    }

    let Some(activity_to_continue) = activity::get(&state.db, user_id.clone(), id).await? else {
        return Ok(Redirect::to("/app"));
    };

    let name = encrypt::decrypt(&activity_to_continue.name, &state.database_key)
        .and_then(|c| encrypt::encrypt(&c, &state.database_key))
        .unwrap_or_default();

    let new_id = create(
        &state.db,
        Create {
            user_id: user_id.clone(),
            name,
            start_time: now,
            end_time: None,
        },
    )
    .await?;

    associate_tags(
        &state.db,
        &activity_to_continue
            .tags
            .iter()
            .map(|t| t.id)
            .collect::<Vec<sqlx::types::Uuid>>(),
        new_id,
    )
    .await?;

    Ok(Redirect::to("/app"))
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

        self.checked_add_signed(Duration::minutes(adjust_by.into()))
            .and_then(|d| d.with_second(0))
            .and_then(|d| d.with_nanosecond(0))
    }
}

#[derive(Template)]
#[template(path = "menu.html")]
struct MenuTemplate {
    show_import: bool,
}

async fn menu(
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    let show_import =
        user_id == "auth0|59ac17508f649c3f85124ec1" || user_id == "auth0|59cc17a23b09c52496036107";
    Ok(Html(MenuTemplate { show_import }.render()?))
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
    fn test_adjust_at_the_edge_of_an_hour() -> Result<(), String> {
        assert_eq!(
            Utc.with_ymd_and_hms(2024, 3, 18, 11, 00, 0).unwrap(),
            Utc.with_ymd_and_hms(2024, 3, 18, 10, 59, 0)
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
        let (duration, _, _) = format_duration(start, Some(end));
        assert_eq!("5m", duration);
    }

    #[test]
    fn test_format_duration_with_negative_duration() {
        let start = Utc.with_ymd_and_hms(2024, 3, 18, 10, 5, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 3, 18, 10, 0, 0).unwrap();
        let (duration, _, _) = format_duration(start, Some(end));
        assert_eq!("-5m", duration);
    }

    #[test]
    fn test_format_duration_with_long_duration() {
        let start = Utc.with_ymd_and_hms(2024, 3, 18, 10, 0, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 3, 18, 11, 5, 0).unwrap();
        let (duration, _, _) = format_duration(start, Some(end));
        assert_eq!("1h 5m", duration);
    }

    #[test]
    fn test_format_duration_with_negative_long_duration() {
        let start = Utc.with_ymd_and_hms(2024, 3, 18, 11, 5, 0).unwrap();
        let end = Utc.with_ymd_and_hms(2024, 3, 18, 10, 0, 0).unwrap();
        let (duration, _, _) = format_duration(start, Some(end));
        assert_eq!("-1h 5m", duration);
    }
}
