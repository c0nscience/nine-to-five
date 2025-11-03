use crate::summaries::{associate_tags, delete, delete_associate_tags};
use askama::Template;
use axum::{
    Extension, Router,
    extract::State,
    middleware,
    response::{Html, IntoResponse, Redirect},
    routing::{get, post},
};

use axum_extra::extract::Form;
use serde::Deserialize;

use crate::{
    activity, auth,
    encrypt::decrypt,
    errors, states,
    summaries::{self, Summary, create},
};

pub fn router(state: states::AppState) -> Router<states::AppState> {
    Router::new()
        .route("/", post(create_summary))
        .route("/edit", get(edit_form).post(update_summary))
        .route("/delete", get(delete_summary))
        .route("/new", get(new_form))
        .route_layer(middleware::from_fn_with_state(
            state,
            auth::check_authorized,
        ))
}

#[derive(Template)]
#[template(path = "summary/new_form.html")]
struct NewSummaryTemplate {
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
    Ok(Html(NewSummaryTemplate { available_tags }.render()?))
}

#[derive(Debug, Deserialize)]
struct CreateSummary {
    #[serde(default)]
    selection_tags: Vec<sqlx::types::Uuid>,

    #[serde(default)]
    group_tags: Vec<sqlx::types::Uuid>,
}

async fn create_summary(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Form(create_summary): Form<CreateSummary>,
) -> Result<impl IntoResponse, errors::AppError> {
    let cm = Summary {
        selection_tags: create_summary.selection_tags,
        group_tags: create_summary.group_tags,
    };
    create(&state.db, user_id, cm).await?;

    Ok(Redirect::to("/app"))
}

trait WithContains {
    fn contains(arr: &[activity::Tag], id: &sqlx::types::Uuid) -> bool;
}

#[derive(Template)]
#[template(path = "summary/edit_form.html")]
struct EditFormTemplate {
    summary: EditFormData,
    available_tags: Vec<activity::AvailableTag>,
}

impl WithContains for EditFormTemplate {
    fn contains(arr: &[activity::Tag], id: &sqlx::types::Uuid) -> bool {
        arr.iter().any(|e| e.id == *id)
    }
}

#[derive(Debug)]
struct EditFormData {
    selection_tags: Vec<activity::Tag>,
    group_tags: Vec<activity::Tag>,
}

async fn edit_form(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, errors::AppError> {
    let Some(summary) = summaries::get(&state.db, user_id.clone()).await? else {
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

    let summary = EditFormData {
        selection_tags: summary.selection_tags,
        group_tags: summary.group_tags,
    };

    Ok(Html(
        EditFormTemplate {
            summary,
            available_tags,
        }
        .render()?,
    ))
}

#[derive(Debug, Deserialize)]
struct UpdateSummary {
    #[serde(default)]
    selection_tags: Vec<sqlx::types::Uuid>,

    #[serde(default)]
    group_tags: Vec<sqlx::types::Uuid>,
}

async fn update_summary(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    Form(updated_summary): Form<UpdateSummary>,
) -> Result<Redirect, errors::AppError> {
    let Some(summary) = summaries::get(&state.db, user_id.clone()).await? else {
        return Err(errors::AppError::NotFound);
    };
    let id = summary.id;

    delete_associate_tags(&state.db, user_id.clone(), id).await?;
    associate_tags(
        &state.db,
        "summary_selection_tags".to_string(),
        &updated_summary.selection_tags,
        id,
    )
    .await?;
    associate_tags(
        &state.db,
        "summary_group_tags".to_string(),
        &updated_summary.group_tags,
        id,
    )
    .await?;

    Ok(Redirect::to("/app"))
}

async fn delete_summary(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
) -> Result<Redirect, errors::AppError> {
    let Some(summary) = summaries::get(&state.db, user_id.clone()).await? else {
        return Err(errors::AppError::NotFound);
    };
    let id = summary.id;

    delete(&state.db, user_id.clone(), id).await?;
    Ok(Redirect::to("/app"))
}
