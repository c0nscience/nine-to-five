use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum_extra::extract::multipart;
use thiserror::Error;
use tracing::warn;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("unauthorized")]
    Unauthorized,

    #[error("not found")]
    NotFound,

    #[error("internal server error")]
    InternalError,

    #[error("{0}")]
    MultipartError(#[from] multipart::MultipartError),

    #[error("{0}")]
    HttpRequestError(#[from] reqwest::Error),

    #[error("{0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("{0}")]
    Utf8Error(#[from] std::str::Utf8Error),

    #[error("{0}")]
    SerdeError(#[from] serde_json::Error),

    #[error("{0}")]
    OAuthError(
        #[from]
        oauth2::RequestTokenError<
            oauth2::reqwest::Error<reqwest::Error>,
            oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>,
        >,
    ),

    #[error("{0}")]
    JwtError(#[from] jsonwebtoken::errors::Error),

    #[error("{0}")]
    Anyhow(#[from] anyhow::Error),

    #[error("{0}")]
    Chrono(#[from] chrono::ParseError),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        use AppError::{
            Anyhow, Chrono, HttpRequestError, InternalError, JwtError, MultipartError, NotFound,
            OAuthError, SerdeError, Sqlx, Unauthorized, Utf8Error,
        };

        match self {
            NotFound => (StatusCode::NOT_FOUND).into_response(),
            Unauthorized | JwtError(_) | OAuthError(_) => {
                (StatusCode::UNAUTHORIZED).into_response()
            }
            InternalError => (StatusCode::INTERNAL_SERVER_ERROR).into_response(),
            Anyhow(err) => {
                warn!("anyhow: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
            HttpRequestError(err) => {
                warn!("request error: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
            Sqlx(err) => {
                warn!("sqlx: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
            Chrono(err) => {
                warn!("chrono: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
            MultipartError(err) => {
                warn!("multipart: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
            Utf8Error(err) => {
                warn!("utf8: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
            SerdeError(err) => {
                warn!("serde: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
        }
    }
}
