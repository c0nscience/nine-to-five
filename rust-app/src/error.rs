use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("unauthorized")]
    Unauthorized,

    #[error("internal server error")]
    InternalError,

    #[error("{0}")]
    HttpRequestError(#[from] reqwest::Error),

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
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        use AppError::{
            Anyhow, HttpRequestError, InternalError, JwtError, OAuthError, Unauthorized,
        };

        match self {
            Unauthorized | JwtError(_) | OAuthError(_) => {
                (StatusCode::UNAUTHORIZED).into_response()
            }
            InternalError | Anyhow(_) | HttpRequestError(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
        }
    }
}
