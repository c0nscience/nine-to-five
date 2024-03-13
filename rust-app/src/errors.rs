use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("unauthorized")]
    Unauthorized,

    #[error("not found")]
    NotFound,

    #[error("internal server error")]
    InternalError,

    #[error("{0}")]
    HttpRequestError(#[from] reqwest::Error),

    #[error("{0}")]
    Sqlx(#[from] sqlx::Error),

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
            Anyhow, Chrono, HttpRequestError, InternalError, JwtError, NotFound, OAuthError, Sqlx,
            Unauthorized,
        };

        match self {
            NotFound => (StatusCode::NOT_FOUND).into_response(),
            Unauthorized | JwtError(_) | OAuthError(_) => {
                (StatusCode::UNAUTHORIZED).into_response()
            }
            InternalError | Anyhow(_) | HttpRequestError(_) | Sqlx(_) | Chrono(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
        }
    }
}
