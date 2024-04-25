use askama::Template;
use askama_axum::IntoResponse;
use axum::{
    extract::{Request, State},
    middleware::{self, Next},
    response::{Redirect, Response},
    routing::get,
    Extension, Router,
};
use axum_extra::extract::Multipart;
use serde::Deserialize;
use tracing::info;

use crate::{activity, auth, encrypt, errors, hash, states};

pub fn router(state: states::AppState) -> Router<states::AppState> {
    Router::new()
        .route("/", get(import_form).post(import))
        .route_layer(middleware::from_fn(check_allowed_user))
        .route_layer(middleware::from_fn_with_state(
            state,
            auth::check_authorized,
        ))
}
pub async fn check_allowed_user(
    Extension(user_id): Extension<String>,
    req: Request,
    next: Next,
) -> Result<Response, errors::AppError> {
    let is_allowed_user =
        user_id == "auth0|59ac17508f649c3f85124ec1" || user_id == "auth0|59cc17a23b09c52496036107";
    if !is_allowed_user {
        return Ok(Redirect::to("/app").into_response());
    }

    Ok(next.run(req).await)
}

#[derive(Template)]
#[template(path = "import.html")]
struct ImportTemplate {}

async fn import_form() -> impl IntoResponse {
    ImportTemplate {}
}

#[derive(Deserialize)]
struct ActivityJson {
    name: String,

    #[serde(rename = "start")]
    start_time: chrono::DateTime<chrono::Utc>,

    #[serde(rename = "end")]
    end_time: chrono::DateTime<chrono::Utc>,

    tags: Option<Vec<String>>,
}

async fn import(
    State(state): State<states::AppState>,
    Extension(user_id): Extension<String>,
    mut multipart: Multipart,
) -> Result<Redirect, errors::AppError> {
    let mt_start = std::time::SystemTime::now();

    while let Some(field) = multipart.next_field().await? {
        let data = field.bytes().await?;
        let data = std::str::from_utf8(&data)?;
        let activities = serde_json::from_str::<Vec<ActivityJson>>(data)?;

        for aj in &activities {
            let name = encrypt::encrypt(&aj.name, &state.database_key)?;
            let act = activity::Create {
                user_id: user_id.clone(),
                name,
                start_time: aj.start_time,
                end_time: Some(aj.end_time),
            };
            let activity_id = activity::create(&state.db, act).await?;

            let Some(tags) = &aj.tags else {
                continue;
            };
            let mut tag_ids: Vec<sqlx::types::Uuid> = vec![];
            for tag in tags {
                let hashed_name = hash::hash(tag, &state.database_hash_key)?;
                let exists =
                    activity::tag_exists(&state.db, user_id.clone(), hashed_name.clone()).await?;

                if exists {
                    let existing_tags =
                        activity::available_tags(&state.db, user_id.clone()).await?;
                    existing_tags
                        .iter()
                        .filter(|t| t.search_hash == hashed_name)
                        .map(|t| t.id)
                        .for_each(|id| tag_ids.push(id));
                } else {
                    let name = encrypt::encrypt(&tag, &state.database_key)?;
                    let tag_id =
                        activity::create_tag(&state.db, user_id.clone(), name, hashed_name).await?;
                    tag_ids.push(tag_id);
                }
            }
            if !tag_ids.is_empty() {
                activity::associate_tags(&state.db, &tag_ids, activity_id).await?;
            }
        }
    }

    if let Ok(mt_elapsed) = mt_start.elapsed() {
        info!(
            "import took: {}ms ({}us)",
            mt_elapsed.as_millis(),
            mt_elapsed.as_micros()
        );
    };

    Ok(Redirect::to("/app"))
}
