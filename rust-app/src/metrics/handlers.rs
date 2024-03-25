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

use super::{create, list_all, ListMetric, Metric};
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

    #[serde(default)]
    tags: Vec<sqlx::types::Uuid>,
}

impl From<CreateMetric> for Metric {
    fn from(val: CreateMetric) -> Self {
        Self {
            name: val.name,
            tags: val.tags,
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
    Path(_id): Path<String>,
    State(_state): State<states::AppState>,
    Extension(_user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    Ok(DetailTemplate {})
}
