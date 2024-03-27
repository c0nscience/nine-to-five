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
use chrono::Datelike;
use chrono_tz::Tz;
use serde::Deserialize;
use tracing::info;
use urlencoding::decode;

use super::{create, get_by_tags, list_all, ListMetric, Metric, MetricType};
use crate::{activity, auth, errors, metrics, states};

pub fn router(state: states::AppState) -> Router<states::AppState> {
    Router::new()
        .route("/", get(list).post(create_metric))
        .route("/:id", get(detail))
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
    let metrics = list_all(&state.db, user_id).await?;

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
    let available_tags = activity::available_tags(&state.db, user_id).await?;
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

impl From<CreateMetric> for Metric {
    fn from(val: CreateMetric) -> Self {
        Self {
            name: val.name,
            tags: val.tags,
            metric_type: val.metric_type,
            hours_per_week: val.hours_per_week,
        }
    }
}

async fn create_metric(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Form(updated_activity): Form<CreateMetric>,
) -> Result<impl IntoResponse, errors::AppError> {
    create(&state.db, user_id, updated_activity.into()).await?;

    Ok(Redirect::to("/app/metrics"))
}

#[derive(Template)]
#[template(path = "metrics/detail.html")]
struct DetailTemplate {
    metric_type: MetricType,
    total_time: String,
    total_time_until_last_week: String,
    data_points: Vec<DataPoint>,
}

const DEFAULT_HOURS_PER_WEEK: i16 = 0;

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
    let timezone = parse_timezone(&cookie);
    let Some(config) = metrics::get(&state.db, user_id.clone(), id).await? else {
        return Err(errors::AppError::NotFound);
    };

    let current_week = start_of_week(chrono::Utc::now().with_timezone(&timezone).date_naive());
    let mut total_time = chrono::Duration::hours(0);
    let mut total_time_until_last_week = chrono::Duration::hours(0);
    let data_points = get_by_tags(&state.db, user_id.clone(), &config.tags)
        .await?
        .iter()
        .fold(HashMap::new(), |mut acc, date_tpl| {
            let date = date_tpl.0;
            let date = date.with_timezone(&timezone).date_naive();
            let date = start_of_week(date);
            acc.entry(date).or_insert_with(Vec::new).push(date_tpl);
            acc
        })
        .into_iter()
        .fold(Vec::new(), |mut acc, (date, activities)| {
            let duration = activities
                .iter()
                .map(|(start, end)| *end - start)
                .fold(chrono::Duration::zero(), |acc, d| acc + d);

            let hours_per_week = config.hours_per_week.unwrap_or(DEFAULT_HOURS_PER_WEEK);
            let over_time = duration - chrono::Duration::hours(hours_per_week.into());
            total_time += over_time;
            if date < current_week {
                total_time_until_last_week += over_time;
            }

            acc.push(DataPoint { date, duration });
            acc
        });

    Ok(DetailTemplate {
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

    let duration = if is_negative {
        format!("-{duration}")
    } else {
        duration
    };

    duration
}

fn start_of_week(date: chrono::NaiveDate) -> chrono::NaiveDate {
    date - chrono::Duration::days(date.weekday().num_days_from_monday() as i64)
}

fn parse_timezone(cookie: &Cookie) -> Tz {
    cookie
        .get("timezone")
        .and_then(|d| decode(d).ok())
        .and_then(|d| d.parse::<Tz>().ok())
        .unwrap_or(Tz::Europe__Berlin)
}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_should_set_date_to_beginning_of_the_week() -> Result<(), String> {
        let date = chrono::NaiveDate::from_ymd_opt(2021, 1, 1).unwrap();
        let expected = chrono::NaiveDate::from_ymd_opt(2020, 12, 28).unwrap();

        assert_eq!(start_of_week(date), expected);
        Ok(())
    }
}
