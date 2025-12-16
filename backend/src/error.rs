use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    // Auth errors
    InvalidCredentials,
    Unauthorized,
    TokenCreationError,
    TokenExpired,
    
    // Validation errors
    ValidationError(String),
    
    // Database errors
    DatabaseError(sqlx::Error),
    NotFound(String),
    Conflict(String),
    
    // Internal errors
    InternalError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::InvalidCredentials => {
                (StatusCode::UNAUTHORIZED, "Email atau password salah".to_string())
            }
            AppError::Unauthorized => {
                (StatusCode::UNAUTHORIZED, "Unauthorized - silakan login terlebih dahulu".to_string())
            }
            AppError::TokenCreationError => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Gagal membuat token".to_string())
            }
            AppError::TokenExpired => {
                (StatusCode::UNAUTHORIZED, "Token sudah expired, silakan login ulang".to_string())
            }
            AppError::ValidationError(msg) => {
                (StatusCode::BAD_REQUEST, msg)
            }
            AppError::DatabaseError(e) => {
                tracing::error!("Database error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error".to_string())
            }
            AppError::NotFound(resource) => {
                (StatusCode::NOT_FOUND, format!("{} tidak ditemukan", resource))
            }
            AppError::Conflict(msg) => {
                (StatusCode::CONFLICT, msg)
            }
            AppError::InternalError(msg) => {
                tracing::error!("Internal error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };

        let body = Json(json!({
            "success": false,
            "error": error_message
        }));

        (status, body).into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseError(err)
    }
}

impl From<jsonwebtoken::errors::Error> for AppError {
    fn from(_: jsonwebtoken::errors::Error) -> Self {
        AppError::TokenCreationError
    }
}

impl From<argon2::password_hash::Error> for AppError {
    fn from(_: argon2::password_hash::Error) -> Self {
        AppError::InternalError("Password hashing error".to_string())
    }
}

