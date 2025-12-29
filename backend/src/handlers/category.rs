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
    models::category::{Category, CategoryResponse, CreateCategoryRequest, UpdateCategoryRequest},
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
        RETURNING id, user_id, name, icon, color, category_type, created_at, deleted_at
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

pub async fn update_category(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateCategoryRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    payload.validate().map_err(|e| {
        AppError::ValidationError(e.to_string())
    })?;

    // Check if category exists and belongs to user
    let category_exists: bool = sqlx::query_scalar(
        r#"SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL)"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    if !category_exists {
        return Err(AppError::NotFound("Category".to_string()));
    }

    // Update category
    let category = sqlx::query_as::<_, Category>(
        r#"
        UPDATE categories 
        SET name = $3, icon = $4, color = $5, category_type = $6, updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        RETURNING id, user_id, name, icon, color, category_type, created_at, deleted_at
        "#
    )
    .bind(id)
    .bind(user_id)
    .bind(&payload.name)
    .bind(&payload.icon)
    .bind(&payload.color)
    .bind(&payload.category_type)
    .fetch_optional(&state.db)
    .await?;

    match category {
        Some(cat) => Ok(Json(json!({
            "success": true,
            "message": "Kategori berhasil diupdate!",
            "data": CategoryResponse::from(cat)
        }))),
        None => Err(AppError::NotFound("Category".to_string())),
    }
}

pub async fn delete_category(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    // Check if category exists and is not already deleted
    let category_exists: bool = sqlx::query_scalar(
        r#"SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL)"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    if !category_exists {
        return Err(AppError::NotFound("Category".to_string()));
    }

    // Check usage in transactions
    let transaction_count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM transactions WHERE category_id = $1 AND user_id = $2"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    // Check usage in budgets
    let budget_count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM budgets WHERE category_id = $1 AND user_id = $2 AND deleted_at IS NULL"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    // If category is used, return error with details
    if transaction_count.0 > 0 || budget_count.0 > 0 {
        return Err(AppError::Conflict(format!(
            "Kategori ini digunakan di {} transaksi dan {} budget. Hapus atau update data terkait terlebih dahulu.",
            transaction_count.0, budget_count.0
        )));
    }

    // Soft delete: set deleted_at timestamp
    let result = sqlx::query(
        r#"UPDATE categories SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL"#
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
