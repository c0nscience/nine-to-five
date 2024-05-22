use std::collections::HashMap;

use askama::Template;
use axum::{
    extract::{Path, State},
    middleware,
    response::{IntoResponse, Redirect},
    routing::get,
    Extension, Router,
};

use axum_extra::{extract::Form, headers::Cookie, TypedHeader};
use chrono::{Datelike, NaiveDate};
use serde::Deserialize;
use tracing::info;

use super::{
    associate_tags, create, delete, delete_associate_tags, get_by_tags, get_config, list_all,
    update, ListMetric, Metric, MetricType, Update,
};
use crate::{
    activity, auth,
    encrypt::{decrypt, encrypt},
    errors,
    func::parse_timezone,
    metrics, states,
};

pub fn router(state: states::AppState) -> Router<states::AppState> {
    Router::new()
        .route("/", get(list).post(create_metric))
        .route("/:id", get(detail))
        .route("/:id/edit", get(edit_form).post(update_metric))
        .route("/:id/delete", get(delete_metric))
        .route("/new", get(new_form))
        .route_layer(middleware::from_fn_with_state(
            state,
            auth::check_authorized,
        ))
}

#[derive(Template)]
#[template(path = "metrics.html")]
struct MetricsTemplate {
    metrics: Vec<ListMetric>,
}

async fn list(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    let metrics = list_all(&state.db, user_id)
        .await?
        .iter()
        .map(|m| {
            let name = decrypt(&m.name, &state.database_key).unwrap_or_default();
            ListMetric { id: m.id, name }
        })
        .collect();

    Ok(MetricsTemplate { metrics })
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
    let mut available_tags: Vec<activity::AvailableTag> =
        activity::available_tags(&state.db, user_id)
            .await?
            .iter()
            .map(|t| {
                let name = decrypt(&t.name, &state.database_key).unwrap_or_default();
                activity::AvailableTag {
                    id: t.id,
                    name,
                    search_hash: t.search_hash.clone(),
                }
            })
            .collect();
    available_tags.sort_by_key(|t| t.name.to_lowercase());
    Ok(NewMetricTemplate { available_tags })
}

#[derive(Debug, Deserialize)]
struct CreateMetric {
    name: String,
    metric_type: MetricType,
    hours_per_week: Option<i16>,

    #[serde(default)]
    tags: Vec<sqlx::types::Uuid>,
}

async fn create_metric(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Form(updated_activity): Form<CreateMetric>,
) -> Result<impl IntoResponse, errors::AppError> {
    let name = encrypt(&updated_activity.name, &state.database_key).unwrap_or_default();
    let cm = Metric {
        name,
        metric_type: updated_activity.metric_type,
        hours_per_week: updated_activity.hours_per_week,
        tags: updated_activity.tags,
    };
    create(&state.db, user_id, cm).await?;

    Ok(Redirect::to("/app/metrics"))
}

trait WithConversion {
    fn as_f64(i: i64) -> f64;
}

#[derive(Template)]
#[template(path = "metrics/detail.html")]
struct DetailTemplate {
    name: String,
    metric_type: MetricType,
    total_time: String,
    total_time_until_last_week: String,
    data_points: Vec<DataPoint>,
}

impl WithConversion for DetailTemplate {
    fn as_f64(i: i64) -> f64 {
        i as f64
    }
}

const DEFAULT_HOURS_PER_WEEK: i16 = 40;

struct DataPoint {
    date: chrono::NaiveDate,
    duration: chrono::Duration,
}

async fn detail(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    TypedHeader(cookie): TypedHeader<Cookie>,
) -> Result<impl IntoResponse, errors::AppError> {
    type ActivityDuration = (
        chrono::prelude::DateTime<chrono::prelude::Utc>,
        chrono::prelude::DateTime<chrono::prelude::Utc>,
    );

    let mt_full_start = std::time::SystemTime::now();

    let timezone = parse_timezone(&cookie);

    let mt_start = std::time::SystemTime::now();
    let Some(config) = get_config(&state.db, user_id.clone(), id).await? else {
        return Err(errors::AppError::NotFound);
    };
    if let Ok(mt_elapsed) = mt_start.elapsed() {
        info!(
            "get config took: {}ms ({}us)",
            mt_elapsed.as_millis(),
            mt_elapsed.as_micros()
        );
    };

    let current_week = start_of_week(chrono::Utc::now().with_timezone(&timezone).date_naive());
    let mut total_time = chrono::Duration::hours(0);
    let mut total_time_until_last_week = chrono::Duration::hours(0);

    let mt_start = std::time::SystemTime::now();
    let activities_by_tag = get_by_tags(&state.db, user_id.clone(), &config.tags).await?;
    if let Ok(mt_elapsed) = mt_start.elapsed() {
        info!(
            "fetching all activities took: {}ms ({}us)",
            mt_elapsed.as_millis(),
            mt_elapsed.as_micros()
        );
    };

    let mt_start = std::time::SystemTime::now();
    let mut start = chrono::NaiveDate::MAX;
    let mut end = chrono::NaiveDate::MIN;
    let activities_by_week = activities_by_tag.iter().fold(
        HashMap::new(),
        |mut acc: HashMap<NaiveDate, Vec<&ActivityDuration>>, date_tpl| {
            let date = date_tpl.0;
            let date = date.with_timezone(&timezone).date_naive();
            let date = start_of_week(date);
            start = start.min(date);
            end = end.max(date);
            acc.entry(date).or_default().push(date_tpl);
            acc
        },
    );
    if let Ok(mt_elapsed) = mt_start.elapsed() {
        info!(
            "sort into by_week took: {}ms ({}us)",
            mt_elapsed.as_millis(),
            mt_elapsed.as_micros()
        );
    };

    let mt_start = std::time::SystemTime::now();
    let mut data_points =
        start
            .iter_weeks()
            .take_while(|d| *d <= end)
            .fold(Vec::new(), |mut acc, date| {
                let Some(activities) = activities_by_week.get(&date) else {
                    acc.push(DataPoint {
                        date,
                        duration: chrono::Duration::zero(),
                    });
                    return acc;
                };
                let duration = activities
                    .iter()
                    .map(|(start, end)| *end - *start)
                    .fold(chrono::Duration::zero(), |acc, d| acc + d);

                match config.metric_type {
                    MetricType::Sum => {
                        total_time += duration;
                        if date < current_week {
                            total_time_until_last_week += duration;
                        }
                    }
                    MetricType::Overtime => {
                        let hours_per_week =
                            config.hours_per_week.unwrap_or(DEFAULT_HOURS_PER_WEEK);
                        let over_time = duration - chrono::Duration::hours(hours_per_week.into());
                        total_time += over_time;
                        if date < current_week {
                            total_time_until_last_week += over_time;
                        }
                    }
                    MetricType::Count => {}
                }

                acc.push(DataPoint { date, duration });
                acc
            });

    if let Ok(mt_elapsed) = mt_start.elapsed() {
        info!(
            "sort aggregating each week took: {}ms ({}us)",
            mt_elapsed.as_millis(),
            mt_elapsed.as_micros()
        );
    };

    data_points.sort_by_key(|d| d.date);

    if let Ok(mt_elapsed) = mt_start.elapsed() {
        info!(
            "final sort took: {}ms ({}us)",
            mt_elapsed.as_millis(),
            mt_elapsed.as_micros()
        );
    }

    if let Ok(mt_elapsed) = mt_full_start.elapsed() {
        info!(
            "full funcion took: {}ms ({}us)",
            mt_elapsed.as_millis(),
            mt_elapsed.as_micros(),
        );
    }

    let name = decrypt(&config.name, &state.database_key).unwrap_or_default();
    Ok(DetailTemplate {
        name,
        metric_type: config.metric_type,
        total_time: format_duration(total_time),
        total_time_until_last_week: format_duration(total_time_until_last_week),
        data_points,
    })
}

fn format_duration(duration: chrono::Duration) -> String {
    let is_negative = duration.num_seconds() < 0;
    let seconds = duration.num_seconds().abs();
    let minutes = (seconds / 60) % 60;
    let hours = (seconds / 60) / 60;

    let duration = if hours.abs() > 0 {
        format!("{hours}h {minutes}m")
    } else {
        format!("{minutes}m")
    };

    if is_negative {
        format!("-{duration}")
    } else {
        duration
    }
}

fn start_of_week(date: chrono::NaiveDate) -> chrono::NaiveDate {
    date - chrono::Duration::days(i64::from(date.weekday().num_days_from_monday()))
}

trait WithContains {
    fn contains(arr: &[activity::Tag], id: &sqlx::types::Uuid) -> bool;
}

#[derive(Template)]
#[template(path = "metrics/edit_form.html")]
struct EditFormTemplate {
    metric: EditFormData,
    available_tags: Vec<activity::AvailableTag>,
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
    metric_type: MetricType,
    hours_per_week: Option<i16>,
    tags: Vec<activity::Tag>,
}

async fn edit_form(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    let Some(metric) = metrics::get(&state.db, user_id.clone(), id).await? else {
        return Err(errors::AppError::NotFound);
    };

    let mut available_tags: Vec<activity::AvailableTag> =
        activity::available_tags(&state.db, user_id)
            .await?
            .iter()
            .map(|t| {
                let name = decrypt(&t.name, &state.database_key).unwrap_or_default();
                activity::AvailableTag {
                    id: t.id,
                    name,
                    search_hash: t.search_hash.clone(),
                }
            })
            .collect();

    available_tags.sort_by_key(|t| t.name.to_lowercase());

    let name = decrypt(&metric.name, &state.database_key).unwrap_or_default();
    let metric = EditFormData {
        id: metric.id,
        name,
        metric_type: metric.metric_type,
        hours_per_week: metric.hours_per_week,
        tags: metric.tags,
    };

    Ok(EditFormTemplate {
        metric,
        available_tags,
    })
}

#[derive(Debug, Deserialize)]
struct UpdateMetric {
    name: String,
    metric_type: MetricType,
    hours_per_week: Option<i16>,

    #[serde(default)]
    tags: Vec<sqlx::types::Uuid>,
}

async fn update_metric(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Form(updated_metric): Form<UpdateMetric>,
) -> Result<Redirect, errors::AppError> {
    let name = encrypt(&updated_metric.name, &state.database_key).unwrap_or_default();
    update(
        &state.db,
        user_id.clone(),
        Update {
            id,
            name,
            metric_type: updated_metric.metric_type,
            hours_per_week: updated_metric.hours_per_week,
        },
    )
    .await?;

    delete_associate_tags(&state.db, user_id.clone(), id).await?;
    associate_tags(&state.db, &updated_metric.tags, id).await?;

    Ok(Redirect::to("/app/metrics"))
}

async fn delete_metric(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<Redirect, errors::AppError> {
    delete(&state.db, user_id.clone(), id).await?;
    Ok(Redirect::to("/app/metrics"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_set_date_to_beginning_of_the_week() -> Result<(), String> {
        let date = chrono::NaiveDate::from_ymd_opt(2021, 1, 1).ok_or("Invalid date")?;
        let expected = chrono::NaiveDate::from_ymd_opt(2020, 12, 28).ok_or("Invalid date")?;

        assert_eq!(start_of_week(date), expected);
        Ok(())
    }
}
