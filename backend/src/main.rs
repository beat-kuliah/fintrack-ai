use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::Level;
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
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "fintrack_api=debug,tower_http=debug".into()),
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

    // Run migrations automatically
    tracing::info!("🔄 Running database migrations...");
    
    match sqlx::migrate!("./migrations").run(&pool).await {
        Ok(_) => {
            tracing::info!("✅ Migrations completed successfully");
        }
        Err(sqlx::migrate::MigrateError::VersionMissing(version)) => {
            tracing::error!("❌ Migration error: VersionMissing({})", version);
            tracing::error!("The database has a migration record for version {} that doesn't match the files.", version);
            tracing::error!("This usually happens when:");
            tracing::error!("  1. A migration was applied but the file was later removed or moved");
            tracing::error!("  2. The database was restored from a backup with different migration state");
            tracing::error!("");
            tracing::error!("Solutions:");
            tracing::error!("  Option 1: Remove the migration record from database:");
            tracing::error!("    DELETE FROM _sqlx_migrations WHERE version = {};", version);
            tracing::error!("  Option 2: Restore the missing migration file");
            tracing::error!("  Option 3: Check migration status: sqlx migrate info");
            panic!("Failed to run migrations: VersionMissing({})", version);
        }
        Err(e) => {
            tracing::error!("❌ Migration error: {:?}", e);
            panic!("Failed to run migrations: {}", e);
        }
    }

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
        .route(
            "/api/transactions",
            get(handlers::transaction::list_transactions),
        )
        .route(
            "/api/transactions",
            post(handlers::transaction::create_transaction),
        )
        .route(
            "/api/transactions/:id",
            get(handlers::transaction::get_transaction),
        )
        .route(
            "/api/transactions/:id",
            put(handlers::transaction::update_transaction),
        )
        .route(
            "/api/transactions/:id",
            delete(handlers::transaction::delete_transaction),
        )
        // Category routes
        .route("/api/categories", get(handlers::category::list_categories))
        .route("/api/categories", post(handlers::category::create_category))
        .route(
            "/api/categories/:id",
            axum::routing::put(handlers::category::update_category)
                .delete(handlers::category::delete_category),
        )
        // Dashboard routes
        .route(
            "/api/dashboard/summary",
            get(handlers::dashboard::get_summary),
        )
        .route(
            "/api/dashboard/monthly",
            get(handlers::dashboard::get_monthly_stats),
        )
        .route(
            "/api/dashboard/by-category",
            get(handlers::dashboard::get_by_category),
        )
        // Budget routes
        .route("/api/budgets", get(handlers::budget::list_budgets))
        .route("/api/budgets", post(handlers::budget::create_budget))
        .route("/api/budgets/copy", post(handlers::budget::copy_budget))
        .route("/api/budgets/:id", get(handlers::budget::get_budget))
        .route("/api/budgets/:id", put(handlers::budget::update_budget))
        .route("/api/budgets/:id", delete(handlers::budget::delete_budget))
        // Add middleware with request logging
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|request: &axum::http::Request<_>| {
                    tracing::span!(
                        Level::INFO,
                        "request",
                        method = %request.method(),
                        uri = %request.uri(),
                        version = ?request.version(),
                    )
                })
                .on_request(|_request: &axum::http::Request<_>, _span: &tracing::Span| {
                    tracing::info!(
                        "📥 Incoming request: {} {}",
                        _request.method(),
                        _request.uri()
                    );
                })
                .on_response(
                    |_response: &axum::http::Response<_>,
                     latency: std::time::Duration,
                     _span: &tracing::Span| {
                        tracing::info!(
                            "📤 Response: status={}, latency={:?}ms",
                            _response.status(),
                            latency.as_millis()
                        );
                    },
                ),
        )
        .layer(cors)
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    tracing::info!("🚀 FinTrack API running on http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
