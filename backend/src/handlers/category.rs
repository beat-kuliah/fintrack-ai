use axum::{
    extract::{Path, State},
    http::{header::AUTHORIZATION, HeaderMap},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;
use validator::Validate;

use crate::{
    db,
    error::AppError,
    models::category::{Category, CategoryResponse, CreateCategoryRequest},
    utils::jwt::verify_token,
    AppState,
};

async fn get_user_id(state: &AppState, headers: &HeaderMap) -> Result<Uuid, AppError> {
    let auth_header = headers
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or(AppError::Unauthorized)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AppError::Unauthorized)?;

    let claims = verify_token(token, &state.config.jwt_secret)?;
    Ok(claims.sub)
}

pub async fn list_categories(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let categories = db::get_user_categories(&state.db, user_id).await?;
    let response: Vec<CategoryResponse> = categories.into_iter().map(CategoryResponse::from).collect();

    Ok(Json(json!({
        "success": true,
        "data": response
    })))
}

pub async fn create_category(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateCategoryRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    payload.validate().map_err(|e| {
        AppError::ValidationError(e.to_string())
    })?;

    let category_id = Uuid::new_v4();
    let category = sqlx::query_as::<_, Category>(
        r#"
        INSERT INTO categories (id, user_id, name, icon, color, category_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, user_id, name, icon, color, category_type, created_at
        "#
    )
    .bind(category_id)
    .bind(user_id)
    .bind(&payload.name)
    .bind(&payload.icon)
    .bind(&payload.color)
    .bind(&payload.category_type)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true,
        "message": "Kategori berhasil dibuat!",
        "data": CategoryResponse::from(category)
    })))
}

pub async fn delete_category(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let result = sqlx::query(
        r#"DELETE FROM categories WHERE id = $1 AND user_id = $2"#
    )
    .bind(id)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Category".to_string()));
    }

    Ok(Json(json!({
        "success": true,
        "message": "Kategori berhasil dihapus!"
    })))
}
