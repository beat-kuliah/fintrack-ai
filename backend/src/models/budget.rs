use chrono::{DateTime, Utc};
use serde::{Deserialize, Deserializer, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Budget {
    pub id: Uuid,
    pub user_id: Uuid,
    pub category_id: Option<Uuid>,
    pub amount: f64,
    pub month: i32,
    pub year: i32,
    pub is_active: bool,
    pub alert_threshold: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

// Custom deserializer untuk handle category_id yang bisa berupa:
// - null
// - string kosong ""
// - string "undefined" atau "null" (sebagai string literal)
// - UUID string valid
fn deserialize_optional_uuid<'de, D>(deserializer: D) -> Result<Option<Uuid>, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::{self, Visitor};
    use std::fmt;

    struct OptionalUuidVisitor;

    impl<'de> Visitor<'de> for OptionalUuidVisitor {
        type Value = Option<Uuid>;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a UUID string, null, or empty string")
        }

        fn visit_none<E>(self) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(None)
        }

        fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
        where
            D: Deserializer<'de>,
        {
            deserializer.deserialize_any(OptionalUuidVisitor)
        }

        fn visit_unit<E>(self) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            Ok(None)
        }

        fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            let trimmed = value.trim();
            if trimmed.is_empty() 
                || trimmed.eq_ignore_ascii_case("null") 
                || trimmed.eq_ignore_ascii_case("undefined") 
                || trimmed.eq_ignore_ascii_case("none") {
                Ok(None)
            } else {
                Uuid::parse_str(trimmed)
                    .map(Some)
                    .map_err(|_| de::Error::invalid_value(de::Unexpected::Str(value), &self))
            }
        }

        fn visit_string<E>(self, value: String) -> Result<Self::Value, E>
        where
            E: de::Error,
        {
            self.visit_str(&value)
        }
    }

    deserializer.deserialize_any(OptionalUuidVisitor)
}

#[derive(Debug, Deserialize)]
pub struct CreateBudgetRequest {
    #[serde(deserialize_with = "deserialize_optional_uuid", default, skip_serializing_if = "Option::is_none")]
    pub category_id: Option<Uuid>,
    pub amount: f64,
    pub month: i32,
    pub year: i32,
    pub is_active: Option<bool>,
    pub alert_threshold: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBudgetRequest {
    #[serde(deserialize_with = "deserialize_optional_uuid", default)]
    pub category_id: Option<Uuid>,
    pub amount: Option<f64>,
    pub month: Option<i32>,
    pub year: Option<i32>,
    pub is_active: Option<bool>,
    pub alert_threshold: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct BudgetResponse {
    pub id: Uuid,
    pub category_id: Option<Uuid>,
    pub category_name: Option<String>,
    pub amount: f64,
    pub month: i32,
    pub year: i32,
    pub is_active: bool,
    pub alert_threshold: Option<i32>,
    pub used_amount: Option<f64>,
    pub remaining_amount: Option<f64>,
    pub usage_percentage: Option<f64>,
    pub is_over_budget: Option<bool>,
    pub should_alert: Option<bool>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CopyBudgetRequest {
    pub source_month: i32,
    pub source_year: i32,
    pub target_month: i32,
    pub target_year: i32,
}

