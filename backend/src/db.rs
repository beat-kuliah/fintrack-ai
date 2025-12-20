// Database utilities and queries
// This module contains reusable database functions

use sqlx::PgPool;
use uuid::Uuid;

use crate::models::user::User;
use crate::models::wallet::Wallet;
use crate::models::category::Category;

// User queries
pub async fn find_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"SELECT id, email, username, name, password_hash, created_at, updated_at FROM users WHERE email = $1"#
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn find_user_by_username(pool: &PgPool, username: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"SELECT id, email, username, name, password_hash, created_at, updated_at FROM users WHERE username = $1"#
    )
    .bind(username)
    .fetch_optional(pool)
    .await
}

pub async fn find_user_by_username_or_email(pool: &PgPool, username_or_email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"SELECT id, email, username, name, password_hash, created_at, updated_at FROM users WHERE username = $1 OR email = $1"#
    )
    .bind(username_or_email)
    .fetch_optional(pool)
    .await
}

pub async fn find_user_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"SELECT id, email, username, name, password_hash, created_at, updated_at FROM users WHERE id = $1"#
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

// Wallet queries
pub async fn get_user_wallets(pool: &PgPool, user_id: Uuid) -> Result<Vec<Wallet>, sqlx::Error> {
    sqlx::query_as::<_, Wallet>(
        r#"SELECT id, user_id, name, wallet_type, balance, icon, color, created_at, updated_at 
           FROM wallets WHERE user_id = $1 ORDER BY created_at DESC"#
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

pub async fn get_wallet_by_id(pool: &PgPool, id: Uuid, user_id: Uuid) -> Result<Option<Wallet>, sqlx::Error> {
    sqlx::query_as::<_, Wallet>(
        r#"SELECT id, user_id, name, wallet_type, balance, icon, color, created_at, updated_at 
           FROM wallets WHERE id = $1 AND user_id = $2"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await
}

// Category queries
pub async fn get_user_categories(pool: &PgPool, user_id: Uuid) -> Result<Vec<Category>, sqlx::Error> {
    sqlx::query_as::<_, Category>(
        r#"SELECT id, user_id, name, icon, color, category_type, created_at FROM categories 
           WHERE user_id = $1 OR user_id IS NULL ORDER BY name"#
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}
