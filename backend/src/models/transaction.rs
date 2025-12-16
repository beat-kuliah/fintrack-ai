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
    pub wallet_id: Uuid,
    pub category_id: Option<Uuid>,
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
    pub transaction_type: String,
    pub amount: f64,
    pub description: Option<String>,
    pub date: NaiveDate,
    pub created_at: DateTime<Utc>,
}

impl From<Transaction> for TransactionResponse {
    fn from(tx: Transaction) -> Self {
        TransactionResponse {
            id: tx.id,
            wallet_id: tx.wallet_id,
            category_id: tx.category_id,
            transaction_type: tx.transaction_type,
            amount: tx.amount,
            description: tx.description,
            date: tx.date,
            created_at: tx.created_at,
        }
    }
}
