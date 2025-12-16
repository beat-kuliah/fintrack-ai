use axum::{
    extract::State,
    http::{header::AUTHORIZATION, HeaderMap},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;
use validator::Validate;

use crate::{
    db,
    error::AppError,
    models::user::{AuthResponse, LoginRequest, RegisterRequest, User, UserResponse},
    utils::{jwt::create_token, password::{hash_password, verify_password}},
    AppState,
};

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    payload.validate().map_err(|e| {
        AppError::ValidationError(e.to_string())
    })?;

    if db::find_user_by_email(&state.db, &payload.email).await?.is_some() {
        return Err(AppError::Conflict("Email sudah terdaftar".to_string()));
    }

    let password_hash = hash_password(&payload.password)?;
    let user_id = Uuid::new_v4();
    
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, email, name, password_hash)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, password_hash, created_at, updated_at
        "#
    )
    .bind(user_id)
    .bind(&payload.email)
    .bind(&payload.name)
    .bind(&password_hash)
    .fetch_one(&state.db)
    .await?;

    create_default_categories(&state.db, user_id).await?;
    create_default_wallet(&state.db, user_id).await?;

    let token = create_token(user.id, &user.email, &state.config.jwt_secret)?;

    Ok(Json(AuthResponse {
        success: true,
        message: "Registrasi berhasil! Selamat datang di FinTrack 🎉".to_string(),
        token,
        user: UserResponse::from(user),
    }))
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    payload.validate().map_err(|e| {
        AppError::ValidationError(e.to_string())
    })?;

    let user = db::find_user_by_email(&state.db, &payload.email)
        .await?
        .ok_or(AppError::InvalidCredentials)?;

    if !verify_password(&payload.password, &user.password_hash)? {
        return Err(AppError::InvalidCredentials);
    }

    let token = create_token(user.id, &user.email, &state.config.jwt_secret)?;

    Ok(Json(AuthResponse {
        success: true,
        message: "Login berhasil! 🚀".to_string(),
        token,
        user: UserResponse::from(user),
    }))
}

pub async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    let auth_header = headers
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or(AppError::Unauthorized)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AppError::Unauthorized)?;

    let claims = crate::utils::jwt::verify_token(token, &state.config.jwt_secret)?;

    let user = db::find_user_by_id(&state.db, claims.sub)
        .await?
        .ok_or(AppError::NotFound("User".to_string()))?;

    Ok(Json(json!({
        "success": true,
        "user": UserResponse::from(user)
    })))
}

pub async fn logout() -> Json<Value> {
    Json(json!({
        "success": true,
        "message": "Logout berhasil!"
    }))
}

async fn create_default_categories(pool: &sqlx::PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    let default_categories = vec![
        ("Gaji", "💼", "#22c55e", "income"),
        ("Freelance", "💻", "#10b981", "income"),
        ("Investasi", "📈", "#14b8a6", "income"),
        ("Bonus", "💰", "#059669", "income"),
        ("Makanan", "🍔", "#ef4444", "expense"),
        ("Transport", "🚗", "#f97316", "expense"),
        ("Belanja", "🛒", "#eab308", "expense"),
        ("Hiburan", "🎮", "#8b5cf6", "expense"),
        ("Tagihan", "📄", "#ec4899", "expense"),
        ("Kesehatan", "💊", "#06b6d4", "expense"),
        ("Pendidikan", "📚", "#3b82f6", "expense"),
        ("Lainnya", "📦", "#6b7280", "expense"),
    ];

    for (name, icon, color, cat_type) in default_categories {
        sqlx::query(
            r#"INSERT INTO categories (id, user_id, name, icon, color, category_type) VALUES ($1, $2, $3, $4, $5, $6)"#
        )
        .bind(Uuid::new_v4())
        .bind(user_id)
        .bind(name)
        .bind(icon)
        .bind(color)
        .bind(cat_type)
        .execute(pool)
        .await?;
    }

    Ok(())
}

async fn create_default_wallet(pool: &sqlx::PgPool, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO wallets (id, user_id, name, wallet_type, balance, icon, color) VALUES ($1, $2, $3, $4, $5, $6, $7)"#
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind("Cash")
    .bind("cash")
    .bind(0.0_f64)
    .bind("💵")
    .bind("#22c55e")
    .execute(pool)
    .await?;

    Ok(())
}
