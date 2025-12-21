use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Wallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub wallet_type: String,
    pub balance: f64,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credit_limit: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateWalletRequest {
    #[validate(length(min = 1, message = "Nama wallet wajib diisi"))]
    pub name: String,
    #[validate(length(min = 1, message = "Tipe wallet wajib diisi"))]
    pub wallet_type: String,
    pub balance: Option<f64>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credit_limit: Option<f64>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateWalletRequest {
    pub name: Option<String>,
    pub wallet_type: Option<String>,
    pub balance: Option<f64>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credit_limit: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct WalletResponse {
    pub id: Uuid,
    pub name: String,
    pub wallet_type: String,
    pub balance: f64,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub credit_limit: Option<f64>,
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<DateTime<Utc>>,
}

impl From<Wallet> for WalletResponse {
    fn from(wallet: Wallet) -> Self {
        WalletResponse {
            id: wallet.id,
            name: wallet.name,
            wallet_type: wallet.wallet_type,
            balance: wallet.balance,
            icon: wallet.icon,
            color: wallet.color,
            credit_limit: wallet.credit_limit,
            created_at: wallet.created_at,
            deleted_at: wallet.deleted_at,
        }
    }
}
