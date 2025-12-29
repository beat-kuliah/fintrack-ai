use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: Uuid,
    pub user_id: Option<Uuid>, // NULL for default categories
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub category_type: String, // income, expense
    pub created_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateCategoryRequest {
    #[validate(length(min = 1, message = "Nama kategori wajib diisi"))]
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    #[validate(length(min = 1, message = "Tipe kategori wajib diisi"))]
    pub category_type: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateCategoryRequest {
    #[validate(length(min = 1, message = "Nama kategori wajib diisi"))]
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    #[validate(length(min = 1, message = "Tipe kategori wajib diisi"))]
    pub category_type: String,
}

#[derive(Debug, Serialize)]
pub struct CategoryResponse {
    pub id: Uuid,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub category_type: String,
    pub is_default: bool,
}

impl From<Category> for CategoryResponse {
    fn from(cat: Category) -> Self {
        CategoryResponse {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            category_type: cat.category_type,
            is_default: cat.user_id.is_none(),
        }
    }
}

