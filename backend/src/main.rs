use axum::{
    routing::{get, post, put, delete},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod utils;

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "fintrack_api=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    dotenvy::dotenv().ok();
    let config = Config::from_env().expect("Failed to load configuration");

    // Create database pool
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    tracing::info!("✅ Database connected successfully");

    // Create app state
    let state = AppState {
        db: pool,
        config: Arc::new(config.clone()),
    };

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        // Health check
        .route("/health", get(handlers::health::health_check))
        // Auth routes
        .route("/api/auth/register", post(handlers::auth::register))
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/auth/me", get(handlers::auth::me))
        .route("/api/auth/logout", post(handlers::auth::logout))
        // Wallet routes
        .route("/api/wallets", get(handlers::wallet::list_wallets))
        .route("/api/wallets", post(handlers::wallet::create_wallet))
        .route("/api/wallets/:id", get(handlers::wallet::get_wallet))
        .route("/api/wallets/:id", put(handlers::wallet::update_wallet))
        .route("/api/wallets/:id", delete(handlers::wallet::delete_wallet))
        // Transaction routes
        .route("/api/transactions", get(handlers::transaction::list_transactions))
        .route("/api/transactions", post(handlers::transaction::create_transaction))
        .route("/api/transactions/:id", get(handlers::transaction::get_transaction))
        .route("/api/transactions/:id", put(handlers::transaction::update_transaction))
        .route("/api/transactions/:id", delete(handlers::transaction::delete_transaction))
        // Category routes
        .route("/api/categories", get(handlers::category::list_categories))
        .route("/api/categories", post(handlers::category::create_category))
        .route("/api/categories/:id", delete(handlers::category::delete_category))
        // Dashboard routes
        .route("/api/dashboard/summary", get(handlers::dashboard::get_summary))
        .route("/api/dashboard/monthly", get(handlers::dashboard::get_monthly_stats))
        .route("/api/dashboard/by-category", get(handlers::dashboard::get_by_category))
        // Add middleware
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    
    tracing::info!("🚀 FinTrack API running on http://{}", addr);
    
    axum::serve(listener, app).await.unwrap();
}
