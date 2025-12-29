use axum::{
    extract::{Path, Query, State},
    extract::rejection::JsonRejection,
    http::{header::AUTHORIZATION, HeaderMap},
    Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::{
    db,
    error::AppError,
    models::budget::{
        Budget, BudgetResponse, CopyBudgetRequest, CreateBudgetRequest, UpdateBudgetRequest,
    },
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

#[derive(Debug, serde::Deserialize)]
pub struct BudgetQueryParams {
    pub month: Option<i32>,
    pub year: Option<i32>,
}

pub async fn list_budgets(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<BudgetQueryParams>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let budgets = db::get_user_budgets(&state.db, user_id, params.month, params.year).await?;

    // Get budget usage for each budget
    let mut budget_responses = Vec::new();
    for budget in budgets {
        let (used_amount, category_name) = if let Some(category_id) = budget.category_id {
            // Get category name (only if not deleted)
            let category: Option<(String,)> = sqlx::query_as(
                r#"SELECT name FROM categories WHERE id = $1 AND deleted_at IS NULL"#
            )
            .bind(category_id)
            .fetch_optional(&state.db)
            .await?;

            // Get used amount for this category
            let used: Option<(f64,)> = sqlx::query_as(
                r#"
                SELECT COALESCE(SUM(amount), 0) as used
                FROM transactions
                WHERE user_id = $1
                    AND category_id = $2
                    AND transaction_type = 'expense'
                    AND EXTRACT(MONTH FROM date) = $3
                    AND EXTRACT(YEAR FROM date) = $4
                "#
            )
            .bind(user_id)
            .bind(category_id)
            .bind(budget.month)
            .bind(budget.year)
            .fetch_optional(&state.db)
            .await?;

            (used.map(|u| u.0).unwrap_or(0.0), category.map(|c| c.0))
        } else {
            // Total budget - sum all expenses for the month
            let used: Option<(f64,)> = sqlx::query_as(
                r#"
                SELECT COALESCE(SUM(amount), 0) as used
                FROM transactions
                WHERE user_id = $1
                    AND transaction_type = 'expense'
                    AND EXTRACT(MONTH FROM date) = $2
                    AND EXTRACT(YEAR FROM date) = $3
                "#
            )
            .bind(user_id)
            .bind(budget.month)
            .bind(budget.year)
            .fetch_optional(&state.db)
            .await?;

            (used.map(|u| u.0).unwrap_or(0.0), None)
        };

        let remaining_amount = budget.amount - used_amount;
        let usage_percentage = if budget.amount > 0.0 {
            (used_amount / budget.amount) * 100.0
        } else {
            0.0
        };
        let is_over_budget = used_amount > budget.amount;
        let should_alert = budget
            .alert_threshold
            .map(|threshold| usage_percentage >= threshold as f64)
            .unwrap_or(false);

        budget_responses.push(BudgetResponse {
            id: budget.id,
            category_id: budget.category_id,
            category_name,
            amount: budget.amount,
            month: budget.month,
            year: budget.year,
            is_active: budget.is_active,
            alert_threshold: budget.alert_threshold,
            used_amount: Some(used_amount),
            remaining_amount: Some(remaining_amount),
            usage_percentage: Some(usage_percentage),
            is_over_budget: Some(is_over_budget),
            should_alert: Some(should_alert),
            created_at: budget.created_at,
            updated_at: budget.updated_at,
        });
    }

    Ok(Json(json!({
        "success": true,
        "data": budget_responses
    })))
}

pub async fn create_budget(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Result<Json<CreateBudgetRequest>, JsonRejection>,
) -> Result<Json<Value>, AppError> {
    let payload = payload.map_err(|e| AppError::from(e))?;
    let payload = payload.0;
    
    tracing::debug!("Received budget payload: {:?}", payload);
    let user_id = get_user_id(&state, &headers).await?;

    // Validate amount manually first
    if payload.amount <= 0.0 || payload.amount.is_nan() || payload.amount.is_infinite() {
        return Err(AppError::ValidationError(
            "Amount harus lebih besar dari 0 dan valid".to_string(),
        ));
    }

    // Validate month and year
    if payload.month < 1 || payload.month > 12 {
        return Err(AppError::ValidationError(
            "Month harus antara 1-12".to_string(),
        ));
    }

    if payload.year < 2000 || payload.year > 3000 {
        return Err(AppError::ValidationError(
            "Year harus valid (2000-3000)".to_string(),
        ));
    }

    // Validate alert_threshold if provided
    if let Some(threshold) = payload.alert_threshold {
        if threshold < 0 || threshold > 100 {
            return Err(AppError::ValidationError(
                "Alert threshold harus antara 0-100".to_string(),
            ));
        }
    }

    // Check if budget already exists for this user, category, month, year (not deleted)
    let existing: Option<(Uuid,)> = sqlx::query_as(
        r#"
        SELECT id FROM budgets
        WHERE user_id = $1
            AND (category_id IS NULL AND $2::uuid IS NULL OR category_id = $2)
            AND month = $3
            AND year = $4
            AND deleted_at IS NULL
        "#
    )
    .bind(user_id)
    .bind(&payload.category_id)
    .bind(payload.month)
    .bind(payload.year)
    .fetch_optional(&state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::ValidationError(
            "Budget untuk kategori dan periode ini sudah ada".to_string(),
        ));
    }

    let budget_id = Uuid::new_v4();
    let is_active = payload.is_active.unwrap_or(true);
    let alert_threshold = payload.alert_threshold.unwrap_or(80);

    let budget = sqlx::query_as::<_, Budget>(
        r#"
        INSERT INTO budgets (id, user_id, category_id, amount, month, year, is_active, alert_threshold)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, category_id, amount, month, year, is_active, alert_threshold, created_at, updated_at, deleted_at
        "#
    )
    .bind(budget_id)
    .bind(user_id)
    .bind(&payload.category_id)
    .bind(payload.amount)
    .bind(payload.month)
    .bind(payload.year)
    .bind(is_active)
    .bind(alert_threshold)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true,
        "message": "Budget berhasil dibuat!",
        "data": BudgetResponse {
            id: budget.id,
            category_id: budget.category_id,
            category_name: None,
            amount: budget.amount,
            month: budget.month,
            year: budget.year,
            is_active: budget.is_active,
            alert_threshold: budget.alert_threshold,
            used_amount: Some(0.0),
            remaining_amount: Some(budget.amount),
            usage_percentage: Some(0.0),
            is_over_budget: Some(false),
            should_alert: Some(false),
            created_at: budget.created_at,
            updated_at: budget.updated_at,
        }
    })))
}

pub async fn get_budget(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    let budget = db::get_budget_by_id(&state.db, id, user_id)
        .await?
        .ok_or(AppError::NotFound("Budget".to_string()))?;

    // Calculate usage
    let (used_amount, category_name) = if let Some(category_id) = budget.category_id {
        let category: Option<(String,)> = sqlx::query_as(
            r#"SELECT name FROM categories WHERE id = $1 AND deleted_at IS NULL"#
        )
        .bind(category_id)
        .fetch_optional(&state.db)
        .await?;

        let used: Option<(f64,)> = sqlx::query_as(
            r#"
            SELECT COALESCE(SUM(amount), 0) as used
            FROM transactions
            WHERE user_id = $1
                AND category_id = $2
                AND transaction_type = 'expense'
                AND EXTRACT(MONTH FROM date) = $3
                AND EXTRACT(YEAR FROM date) = $4
            "#
        )
        .bind(user_id)
        .bind(category_id)
        .bind(budget.month)
        .bind(budget.year)
        .fetch_optional(&state.db)
        .await?;

        (used.map(|u| u.0).unwrap_or(0.0), category.map(|c| c.0))
    } else {
        let used: Option<(f64,)> = sqlx::query_as(
            r#"
            SELECT COALESCE(SUM(amount), 0) as used
            FROM transactions
            WHERE user_id = $1
                AND transaction_type = 'expense'
                AND EXTRACT(MONTH FROM date) = $2
                AND EXTRACT(YEAR FROM date) = $3
            "#
        )
        .bind(user_id)
        .bind(budget.month)
        .bind(budget.year)
        .fetch_optional(&state.db)
        .await?;

        (used.map(|u| u.0).unwrap_or(0.0), None)
    };

    let remaining_amount = budget.amount - used_amount;
    let usage_percentage = if budget.amount > 0.0 {
        (used_amount / budget.amount) * 100.0
    } else {
        0.0
    };
    let is_over_budget = used_amount > budget.amount;
    let should_alert = budget
        .alert_threshold
        .map(|threshold| usage_percentage >= threshold as f64)
        .unwrap_or(false);

    Ok(Json(json!({
        "success": true,
        "data": BudgetResponse {
            id: budget.id,
            category_id: budget.category_id,
            category_name,
            amount: budget.amount,
            month: budget.month,
            year: budget.year,
            is_active: budget.is_active,
            alert_threshold: budget.alert_threshold,
            used_amount: Some(used_amount),
            remaining_amount: Some(remaining_amount),
            usage_percentage: Some(usage_percentage),
            is_over_budget: Some(is_over_budget),
            should_alert: Some(should_alert),
            created_at: budget.created_at,
            updated_at: budget.updated_at,
        }
    })))
}

pub async fn update_budget(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateBudgetRequest>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    if let Some(amount) = payload.amount {
        if amount <= 0.0 {
            return Err(AppError::ValidationError(
                "Amount harus lebih besar dari 0".to_string(),
            ));
        }
    }

    if let Some(month) = payload.month {
        if month < 1 || month > 12 {
            return Err(AppError::ValidationError(
                "Month harus antara 1-12".to_string(),
            ));
        }
    }

    if let Some(year) = payload.year {
        if year < 2000 || year > 3000 {
            return Err(AppError::ValidationError(
                "Year harus valid".to_string(),
            ));
        }
    }

    // Check if budget exists
    let budget = db::get_budget_by_id(&state.db, id, user_id)
        .await?
        .ok_or(AppError::NotFound("Budget".to_string()))?;

    // Determine new values
    let new_category_id = payload.category_id.or(budget.category_id);
    let new_month = payload.month.unwrap_or(budget.month);
    let new_year = payload.year.unwrap_or(budget.year);

    // Check for conflicts if category, month, or year changed
    if new_category_id != budget.category_id || new_month != budget.month || new_year != budget.year {
        let existing: Option<(Uuid,)> = sqlx::query_as(
            r#"
            SELECT id FROM budgets
            WHERE user_id = $1
                AND id != $2
                AND (category_id IS NULL AND $3::uuid IS NULL OR category_id = $3)
                AND month = $4
                AND year = $5
                AND deleted_at IS NULL
            "#
        )
        .bind(user_id)
        .bind(id)
        .bind(&new_category_id)
        .bind(new_month)
        .bind(new_year)
        .fetch_optional(&state.db)
        .await?;

        if existing.is_some() {
            return Err(AppError::ValidationError(
                "Budget untuk kategori dan periode ini sudah ada".to_string(),
            ));
        }
    }

    let updated_budget = sqlx::query_as::<_, Budget>(
        r#"
        UPDATE budgets SET
            category_id = COALESCE($1, category_id),
            amount = COALESCE($2, amount),
            month = COALESCE($3, month),
            year = COALESCE($4, year),
            is_active = COALESCE($5, is_active),
            alert_threshold = COALESCE($6, alert_threshold),
            updated_at = NOW()
        WHERE id = $7 AND user_id = $8 AND deleted_at IS NULL
        RETURNING id, user_id, category_id, amount, month, year, is_active, alert_threshold, created_at, updated_at, deleted_at
        "#
    )
    .bind(&new_category_id)
    .bind(payload.amount)
    .bind(payload.month)
    .bind(payload.year)
    .bind(payload.is_active)
    .bind(payload.alert_threshold)
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(json!({
        "success": true,
        "message": "Budget berhasil diupdate!",
        "data": BudgetResponse {
            id: updated_budget.id,
            category_id: updated_budget.category_id,
            category_name: None,
            amount: updated_budget.amount,
            month: updated_budget.month,
            year: updated_budget.year,
            is_active: updated_budget.is_active,
            alert_threshold: updated_budget.alert_threshold,
            used_amount: None,
            remaining_amount: None,
            usage_percentage: None,
            is_over_budget: None,
            should_alert: None,
            created_at: updated_budget.created_at,
            updated_at: updated_budget.updated_at,
        }
    })))
}

pub async fn delete_budget(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, AppError> {
    let user_id = get_user_id(&state, &headers).await?;

    // Verify budget exists and is not already deleted
    let budget_exists: bool = sqlx::query_scalar(
        r#"SELECT EXISTS(SELECT 1 FROM budgets WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL)"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    if !budget_exists {
        return Err(AppError::NotFound("Budget".to_string()));
    }

    // Soft delete: set deleted_at timestamp
    let result = sqlx::query(
        r#"UPDATE budgets SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL"#
    )
    .bind(id)
    .bind(user_id)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Budget".to_string()));
    }

    Ok(Json(json!({
        "success": true,
        "message": "Budget berhasil dihapus!"
    })))
}

pub async fn copy_budget(
    State(state): State<AppState>,
    headers: HeaderMap,
    payload: Result<Json<CopyBudgetRequest>, JsonRejection>,
) -> Result<Json<Value>, AppError> {
    let payload = payload.map_err(|e| AppError::from(e))?;
    let payload = payload.0;
    
    let user_id = get_user_id(&state, &headers).await?;

    // Validate manually
    if payload.source_month < 1 || payload.source_month > 12 {
        return Err(AppError::ValidationError(
            "Source month harus antara 1-12".to_string(),
        ));
    }
    if payload.target_month < 1 || payload.target_month > 12 {
        return Err(AppError::ValidationError(
            "Target month harus antara 1-12".to_string(),
        ));
    }
    if payload.source_year < 2000 || payload.source_year > 3000 {
        return Err(AppError::ValidationError(
            "Source year harus valid (2000-3000)".to_string(),
        ));
    }
    if payload.target_year < 2000 || payload.target_year > 3000 {
        return Err(AppError::ValidationError(
            "Target year harus valid (2000-3000)".to_string(),
        ));
    }

    // Get all budgets from source month/year
    let source_budgets = db::get_user_budgets(
        &state.db,
        user_id,
        Some(payload.source_month),
        Some(payload.source_year),
    )
    .await?;

    if source_budgets.is_empty() {
        return Err(AppError::NotFound(
            format!(
                "Tidak ada budget untuk bulan {}/{}",
                payload.source_month, payload.source_year
            )
            .to_string(),
        ));
    }

    // Check if target month/year already has budgets
    let existing_budgets = db::get_user_budgets(
        &state.db,
        user_id,
        Some(payload.target_month),
        Some(payload.target_year),
    )
    .await?;

    if !existing_budgets.is_empty() {
        return Err(AppError::ValidationError(
            format!(
                "Budget untuk bulan {}/{} sudah ada. Hapus budget yang ada terlebih dahulu atau gunakan update.",
                payload.target_month, payload.target_year
            )
            .to_string(),
        ));
    }

    // Copy each budget
    let mut copied_budgets = Vec::new();
    for source_budget in source_budgets {
        let new_budget_id = Uuid::new_v4();
        let copied_budget = sqlx::query_as::<_, Budget>(
            r#"
            INSERT INTO budgets (id, user_id, category_id, amount, month, year, is_active, alert_threshold)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, user_id, category_id, amount, month, year, is_active, alert_threshold, created_at, updated_at, deleted_at
            "#
        )
        .bind(new_budget_id)
        .bind(user_id)
        .bind(&source_budget.category_id)
        .bind(source_budget.amount)
        .bind(payload.target_month)
        .bind(payload.target_year)
        .bind(source_budget.is_active)
        .bind(source_budget.alert_threshold)
        .fetch_one(&state.db)
        .await?;

        copied_budgets.push(BudgetResponse {
            id: copied_budget.id,
            category_id: copied_budget.category_id,
            category_name: None,
            amount: copied_budget.amount,
            month: copied_budget.month,
            year: copied_budget.year,
            is_active: copied_budget.is_active,
            alert_threshold: copied_budget.alert_threshold,
            used_amount: Some(0.0),
            remaining_amount: Some(copied_budget.amount),
            usage_percentage: Some(0.0),
            is_over_budget: Some(false),
            should_alert: Some(false),
            created_at: copied_budget.created_at,
            updated_at: copied_budget.updated_at,
        });
    }

    Ok(Json(json!({
        "success": true,
        "message": format!(
            "Budget berhasil di-copy dari {}/{} ke {}/{}!",
            payload.source_month,
            payload.source_year,
            payload.target_month,
            payload.target_year
        ),
        "data": copied_budgets
    })))
}

