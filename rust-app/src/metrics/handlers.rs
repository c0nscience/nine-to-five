use askama::Template;
use axum::{
    extract::{Path, State},
    middleware,
    response::{IntoResponse, Redirect},
    routing::get,
    Extension, Router,
};

use axum_extra::extract::Form;
use serde::Deserialize;
use tracing::info;

use super::{create, get_by_metric, list_all, ListMetric, Metric, MetricType};
use crate::{activity, auth, errors, states};

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
struct DetailTemplate {}

async fn detail(
    Path(id): Path<sqlx::types::Uuid>,
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    let activities = get_by_metric(&state.db, user_id.clone(), id).await?;
    info!("activities: {:#?}", activities);
    Ok(DetailTemplate {})
}
