use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub user_id: Uuid,
    pub wallet_id: Uuid,
    pub category_id: Option<Uuid>,
    pub transaction_type: String,
    pub amount: f64,
    pub description: Option<String>,
    pub date: NaiveDate,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTransactionRequest {
    pub wallet_id: Option<Uuid>, // Optional, will create default wallet if not provided
    pub category_id: Option<Uuid>, // Optional, can use category_name instead
    pub category_name: Option<String>, // Category name as string (will create if not exists)
    #[validate(length(min = 1, message = "Tipe transaksi wajib diisi"))]
    pub transaction_type: String,
    #[validate(range(min = 0.01, message = "Jumlah harus lebih dari 0"))]
    pub amount: f64,
    pub description: Option<String>,
    pub date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTransactionRequest {
    pub wallet_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub transaction_type: Option<String>,
    pub amount: Option<f64>,
    pub description: Option<String>,
    pub date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct TransactionQuery {
    pub wallet_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub transaction_type: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    pub wallet_id: Uuid,
    pub category_id: Option<Uuid>,
    pub category_name: Option<String>,
    pub transaction_type: String,
    pub amount: f64,
    pub description: Option<String>,
    pub date: NaiveDate,
    pub created_at: DateTime<Utc>,
}

impl TransactionResponse {
    pub async fn from_with_category(
        tx: Transaction,
        db: &sqlx::PgPool,
    ) -> Result<Self, sqlx::Error> {
        let category_name = if let Some(cat_id) = tx.category_id {
            sqlx::query_scalar::<_, Option<String>>(
                r#"SELECT name FROM categories WHERE id = $1 AND deleted_at IS NULL"#
            )
            .bind(cat_id)
            .fetch_optional(db)
            .await?
            .flatten()
        } else {
            None
        };

        Ok(TransactionResponse {
            id: tx.id,
            wallet_id: tx.wallet_id,
            category_id: tx.category_id,
            category_name,
            transaction_type: tx.transaction_type,
            amount: tx.amount,
            description: tx.description,
            date: tx.date,
            created_at: tx.created_at,
        })
    }
}
