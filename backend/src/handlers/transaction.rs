use axum::{
    extract::{Path, Query, State},
    http::{header::AUTHORIZATION, HeaderMap},
    Json,
};
use chrono::Utc;
use serde_json::{json, Value};
use uuid::Uuid;
use validator::Validate;

use crate::{
    error::AppError,
    models::transaction::{CreateTransactionRequest, Transaction, TransactionQuery, TransactionResponse, UpdateTransactionRequest},
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

pub async fn list_transactions(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<TransactionQuery>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let limit = query.limit.unwrap_or(50);
    let offset = query.offset.unwrap_or(0);

    let transactions = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT id, user_id, wallet_id, category_id, transaction_type, amount, description, date, created_at, updated_at
        FROM transactions 
        WHERE user_id = $1
            AND ($2::uuid IS NULL OR wallet_id = $2)
            AND ($3::uuid IS NULL OR category_id = $3)
            AND ($4::text IS NULL OR transaction_type = $4)
            AND ($5::date IS NULL OR date >= $5)
            AND ($6::date IS NULL OR date <= $6)
        ORDER BY date DESC, created_at DESC
        LIMIT $7 OFFSET $8
        "#
    )
    .bind(user_id)
    .bind(query.wallet_id)
    .bind(query.category_id)
    .bind(&query.transaction_type)
    .bind(query.start_date)
    .bind(query.end_date)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let mut response = Vec::new();
    for tx in transactions {
        response.push(TransactionResponse::from_with_category(tx, &state.db).await?);
    }

    let total: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM transactions WHERE user_id = $1"#
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true,
        "data": response,
        "meta": {
            "total": total.0,
            "limit": limit,
            "offset": offset
        }
    })))
}

pub async fn create_transaction(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateTransactionRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    payload.validate().map_err(|e| {
        AppError::ValidationError(e.to_string())
    })?;

    let tx_id = Uuid::new_v4();
    let date = payload.date.unwrap_or_else(|| Utc::now().date_naive());

    // Get or create default wallet if wallet_id is not provided
    let wallet_id = if let Some(w_id) = payload.wallet_id {
        // Verify wallet belongs to user and is not deleted
        let wallet_exists: bool = sqlx::query_scalar(
            r#"SELECT EXISTS(SELECT 1 FROM wallets WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL)"#
        )
        .bind(w_id)
        .bind(user_id)
        .fetch_one(&state.db)
        .await?;

        if !wallet_exists {
            return Err(AppError::NotFound("Wallet".to_string()));
        }
        w_id
    } else {
        // Get default wallet (exclude deleted)
        let default_wallet: Option<Uuid> = sqlx::query_scalar(
            r#"SELECT id FROM wallets WHERE user_id = $1 AND is_default = true AND deleted_at IS NULL LIMIT 1"#
        )
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?;

        if let Some(w_id) = default_wallet {
            w_id
        } else {
            // No default wallet found: create cash wallet as default
            let new_wallet_id = Uuid::new_v4();
            sqlx::query(
                r#"INSERT INTO wallets (id, user_id, name, wallet_type, balance, icon, color, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"#
            )
            .bind(new_wallet_id)
            .bind(user_id)
            .bind("Cash")
            .bind("cash")
            .bind(0.0)
            .bind("💵")
            .bind("#22c55e")
            .bind(true)
            .execute(&state.db)
            .await?;
            new_wallet_id
        }
    };

    // Get or create category
    let category_id = if let Some(cat_id) = payload.category_id {
        // Verify category exists
        let cat_exists: bool = sqlx::query_scalar(
            r#"SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND (user_id = $2 OR user_id IS NULL))"#
        )
        .bind(cat_id)
        .bind(user_id)
        .fetch_one(&state.db)
        .await?;

        if !cat_exists {
            return Err(AppError::NotFound("Category".to_string()));
        }
        Some(cat_id)
    } else if let Some(ref cat_name) = payload.category_name {
        // Find or create category by name
        let existing_cat: Option<Uuid> = sqlx::query_scalar(
            r#"SELECT id FROM categories WHERE name = $1 AND category_type = $2 AND (user_id = $3 OR user_id IS NULL) LIMIT 1"#
        )
        .bind(cat_name)
        .bind(&payload.transaction_type)
        .bind(user_id)
        .fetch_optional(&state.db)
        .await?;

        if let Some(cat_id) = existing_cat {
            Some(cat_id)
        } else {
            // Create new category
            let new_cat_id = Uuid::new_v4();
            sqlx::query(
                r#"INSERT INTO categories (id, user_id, name, category_type) VALUES ($1, $2, $3, $4)"#
            )
            .bind(new_cat_id)
            .bind(user_id)
            .bind(cat_name)
            .bind(&payload.transaction_type)
            .execute(&state.db)
            .await?;
            Some(new_cat_id)
        }
    } else {
        None
    };

    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        INSERT INTO transactions (id, user_id, wallet_id, category_id, transaction_type, amount, description, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, wallet_id, category_id, transaction_type, amount, description, date, created_at, updated_at
        "#
    )
    .bind(tx_id)
    .bind(user_id)
    .bind(wallet_id)
    .bind(category_id)
    .bind(&payload.transaction_type)
    .bind(payload.amount)
    .bind(&payload.description)
    .bind(date)
    .fetch_one(&state.db)
    .await?;

    // Update wallet balance
    let balance_change = if payload.transaction_type == "income" {
        payload.amount
    } else {
        -payload.amount
    };

    sqlx::query(
        r#"UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3"#
    )
    .bind(balance_change)
    .bind(wallet_id)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    let response = TransactionResponse::from_with_category(transaction, &state.db).await?;

    Ok(Json(json!({
        "success": true,
        "message": "Transaksi berhasil ditambahkan!",
        "data": response
    })))
}

pub async fn get_transaction(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT id, user_id, wallet_id, category_id, transaction_type, amount, description, date, created_at, updated_at
        FROM transactions WHERE id = $1 AND user_id = $2
        "#
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("Transaction".to_string()))?;

    let response = TransactionResponse::from_with_category(transaction, &state.db).await?;

    Ok(Json(json!({
        "success": true,
        "data": response
    })))
}

pub async fn update_transaction(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateTransactionRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let transaction = sqlx::query_as::<_, Transaction>(
        r#"
        UPDATE transactions SET
            wallet_id = COALESCE($1, wallet_id),
            category_id = COALESCE($2, category_id),
            transaction_type = COALESCE($3, transaction_type),
            amount = COALESCE($4, amount),
            description = COALESCE($5, description),
            date = COALESCE($6, date),
            updated_at = NOW()
        WHERE id = $7 AND user_id = $8
        RETURNING id, user_id, wallet_id, category_id, transaction_type, amount, description, date, created_at, updated_at
        "#
    )
    .bind(payload.wallet_id)
    .bind(payload.category_id)
    .bind(&payload.transaction_type)
    .bind(payload.amount)
    .bind(&payload.description)
    .bind(payload.date)
    .bind(id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("Transaction".to_string()))?;

    let response = TransactionResponse::from_with_category(transaction, &state.db).await?;

    Ok(Json(json!({
        "success": true,
        "message": "Transaksi berhasil diupdate!",
        "data": response
    })))
}

pub async fn delete_transaction(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let transaction = sqlx::query_as::<_, Transaction>(
        r#"SELECT id, user_id, wallet_id, category_id, transaction_type, amount, description, date, created_at, updated_at 
           FROM transactions WHERE id = $1 AND user_id = $2"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound("Transaction".to_string()))?;

    // Reverse the balance change
    let balance_change = if transaction.transaction_type == "income" {
        -transaction.amount
    } else {
        transaction.amount
    };

    sqlx::query(
        r#"UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3"#
    )
    .bind(balance_change)
    .bind(transaction.wallet_id)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    sqlx::query(
        r#"DELETE FROM transactions WHERE id = $1 AND user_id = $2"#
    )
    .bind(id)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true,
        "message": "Transaksi berhasil dihapus!"
    })))
}
