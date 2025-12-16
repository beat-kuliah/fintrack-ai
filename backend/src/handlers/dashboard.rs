use axum::{
    extract::State,
    http::{header::AUTHORIZATION, HeaderMap},
    Json,
};
use chrono::{Datelike, Utc};
use serde::Serialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{error::AppError, utils::jwt::verify_token, AppState};

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

#[derive(Serialize)]
pub struct DashboardSummary {
    pub total_balance: f64,
    pub total_income: f64,
    pub total_expense: f64,
    pub this_month_income: f64,
    pub this_month_expense: f64,
    pub wallet_count: i64,
    pub transaction_count: i64,
}

pub async fn get_summary(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let total_balance: (f64,) = sqlx::query_as(
        r#"SELECT COALESCE(SUM(balance)::float8, 0) FROM wallets WHERE user_id = $1"#
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    let total_income: (f64,) = sqlx::query_as(
        r#"SELECT COALESCE(SUM(amount)::float8, 0) FROM transactions WHERE user_id = $1 AND transaction_type = 'income'"#
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    let total_expense: (f64,) = sqlx::query_as(
        r#"SELECT COALESCE(SUM(amount)::float8, 0) FROM transactions WHERE user_id = $1 AND transaction_type = 'expense'"#
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    let now = Utc::now();
    let first_day = chrono::NaiveDate::from_ymd_opt(now.year(), now.month(), 1).unwrap();
    
    let this_month_income: (f64,) = sqlx::query_as(
        r#"SELECT COALESCE(SUM(amount)::float8, 0) FROM transactions WHERE user_id = $1 AND transaction_type = 'income' AND date >= $2"#
    )
    .bind(user_id)
    .bind(first_day)
    .fetch_one(&state.db)
    .await?;

    let this_month_expense: (f64,) = sqlx::query_as(
        r#"SELECT COALESCE(SUM(amount)::float8, 0) FROM transactions WHERE user_id = $1 AND transaction_type = 'expense' AND date >= $2"#
    )
    .bind(user_id)
    .bind(first_day)
    .fetch_one(&state.db)
    .await?;

    let wallet_count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM wallets WHERE user_id = $1"#
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    let transaction_count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM transactions WHERE user_id = $1"#
    )
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    let summary = DashboardSummary {
        total_balance: total_balance.0,
        total_income: total_income.0,
        total_expense: total_expense.0,
        this_month_income: this_month_income.0,
        this_month_expense: this_month_expense.0,
        wallet_count: wallet_count.0,
        transaction_count: transaction_count.0,
    };

    Ok(Json(json!({
        "success": true,
        "data": summary
    })))
}

pub async fn get_monthly_stats(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let stats: Vec<(i32, i32, f64, f64)> = sqlx::query_as(
        r#"
        SELECT 
            EXTRACT(MONTH FROM date)::int as month,
            EXTRACT(YEAR FROM date)::int as year,
            COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END)::float8, 0) as income,
            COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END)::float8, 0) as expense
        FROM transactions 
        WHERE user_id = $1 AND date >= NOW() - INTERVAL '12 months'
        GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
        ORDER BY year DESC, month DESC
        LIMIT 12
        "#
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await?;

    let formatted: Vec<_> = stats.into_iter().map(|(month, year, income, expense)| {
        json!({
            "month": month,
            "year": year,
            "income": income,
            "expense": expense
        })
    }).collect();

    Ok(Json(json!({
        "success": true,
        "data": formatted
    })))
}

pub async fn get_by_category(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let now = Utc::now();
    let first_day = chrono::NaiveDate::from_ymd_opt(now.year(), now.month(), 1).unwrap();

    let stats: Vec<(String, Option<String>, Option<String>, f64)> = sqlx::query_as(
        r#"
        SELECT 
            c.name,
            c.icon,
            c.color,
            COALESCE(SUM(t.amount)::float8, 0) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1 AND t.transaction_type = 'expense' AND t.date >= $2
        GROUP BY c.id, c.name, c.icon, c.color
        ORDER BY total DESC
        LIMIT 10
        "#
    )
    .bind(user_id)
    .bind(first_day)
    .fetch_all(&state.db)
    .await?;

    let formatted: Vec<_> = stats.into_iter().map(|(name, icon, color, total)| {
        json!({
            "name": name,
            "icon": icon,
            "color": color,
            "total": total
        })
    }).collect();

    Ok(Json(json!({
        "success": true,
        "data": formatted
    })))
}
