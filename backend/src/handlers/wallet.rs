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
    models::wallet::{CreateWalletRequest, UpdateWalletRequest, Wallet, WalletResponse},
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

pub async fn list_wallets(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;
    
    let wallets = db::get_user_wallets(&state.db, user_id).await?;
    let response: Vec<WalletResponse> = wallets.into_iter().map(WalletResponse::from).collect();

    Ok(Json(json!({
        "success": true,
        "data": response
    })))
}

pub async fn create_wallet(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateWalletRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    payload.validate().map_err(|e| {
        AppError::ValidationError(e.to_string())
    })?;

    let wallet_id = Uuid::new_v4();
    let balance = payload.balance.unwrap_or(0.0);

    let wallet = sqlx::query_as::<_, Wallet>(
        r#"
        INSERT INTO wallets (id, user_id, name, wallet_type, balance, icon, color, credit_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, name, wallet_type, balance, icon, color, credit_limit, created_at, updated_at, deleted_at
        "#
    )
    .bind(wallet_id)
    .bind(user_id)
    .bind(&payload.name)
    .bind(&payload.wallet_type)
    .bind(balance)
    .bind(&payload.icon)
    .bind(&payload.color)
    .bind(&payload.credit_limit)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true,
        "message": "Wallet berhasil dibuat!",
        "data": WalletResponse::from(wallet)
    })))
}

pub async fn get_wallet(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let wallet = db::get_wallet_by_id(&state.db, id, user_id)
        .await?
        .ok_or(AppError::NotFound("Wallet".to_string()))?;

    Ok(Json(json!({
        "success": true,
        "data": WalletResponse::from(wallet)
    })))
}

pub async fn update_wallet(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateWalletRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    db::get_wallet_by_id(&state.db, id, user_id)
        .await?
        .ok_or(AppError::NotFound("Wallet".to_string()))?;

    // Update wallet - always update icon and color if provided
    // For icon and color, if Some(value) is provided, update; if None, keep existing
    let wallet = sqlx::query_as::<_, Wallet>(
        r#"
        UPDATE wallets SET
            name = COALESCE(NULLIF($1, ''), name),
            wallet_type = COALESCE(NULLIF($2, ''), wallet_type),
            balance = COALESCE($3, balance),
            icon = COALESCE($4, icon),
            color = COALESCE($5, color),
            credit_limit = COALESCE($6, credit_limit),
            updated_at = NOW()
        WHERE id = $7 AND user_id = $8 AND deleted_at IS NULL
        RETURNING id, user_id, name, wallet_type, balance, icon, color, credit_limit, created_at, updated_at, deleted_at
        "#
    )
    .bind(&payload.name)
    .bind(&payload.wallet_type)
    .bind(payload.balance)
    .bind(&payload.icon)
    .bind(&payload.color)
    .bind(payload.credit_limit)
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true,
        "message": "Wallet berhasil diupdate!",
        "data": WalletResponse::from(wallet)
    })))
}

pub async fn delete_wallet(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    // Check if wallet exists and is not already deleted
    let wallet = db::get_wallet_by_id(&state.db, id, user_id).await?;
    if wallet.is_none() {
        return Err(AppError::NotFound("Wallet".to_string()));
    }

    // Check if wallet has transactions
    let transaction_count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM transactions WHERE wallet_id = $1 AND user_id = $2"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    // Soft delete: set deleted_at timestamp instead of hard delete
    // This preserves transaction history
    let result = sqlx::query(
        r#"UPDATE wallets SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL"#
    )
    .bind(id)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Wallet".to_string()));
    }

    Ok(Json(json!({
        "success": true,
        "message": format!(
            "Wallet berhasil dihapus! {} transaksi tetap tersimpan untuk keperluan laporan.",
            transaction_count.0
        )
    })))
}
