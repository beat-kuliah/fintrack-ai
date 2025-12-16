# FinTrack API 🚀

High-performance REST API untuk FinTrack wallet tracking app, built dengan Rust + Axum.

## Tech Stack

- **Framework**: Axum (async web framework)
- **Runtime**: Tokio
- **Database**: PostgreSQL + SQLx
- **Auth**: JWT + Argon2 password hashing
- **Validation**: Validator crate

## Prerequisites

- Rust 1.75+ (install via [rustup](https://rustup.rs))
- PostgreSQL 14+
- Docker (optional, untuk database)

## Getting Started

### 1. Setup Database

Pastikan PostgreSQL sudah running dan buat database:
```sql
CREATE DATABASE fintrack;
```

### 2. Environment Variables

Buat file `.env` di root folder backend:
```env
# PostgreSQL
DATABASE_URL=postgres://postgres:Admin123@postgres.local:5432/fintrack

# Redis (untuk caching - optional)
REDIS_URL=redis://:Admin123@redis.local:6379

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
HOST=127.0.0.1
PORT=8080

# Logging
RUST_LOG=debug
```

### 3. Run Migrations

```bash
# Install sqlx-cli
cargo install sqlx-cli

# Run migrations
sqlx migrate run
```

### 4. Start Server

```bash
# Development
cargo run

# Production (optimized)
cargo run --release
```

Server akan berjalan di `http://localhost:8080`

## API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST /api/auth/register    - Register user baru
POST /api/auth/login       - Login user
GET  /api/auth/me          - Get current user info
POST /api/auth/logout      - Logout (client-side token removal)
```

### Wallets
```
GET    /api/wallets        - List semua wallet user
POST   /api/wallets        - Buat wallet baru
GET    /api/wallets/:id    - Get detail wallet
PUT    /api/wallets/:id    - Update wallet
DELETE /api/wallets/:id    - Hapus wallet
```

### Transactions
```
GET    /api/transactions        - List transaksi (dengan filter)
POST   /api/transactions        - Buat transaksi baru
GET    /api/transactions/:id    - Get detail transaksi
PUT    /api/transactions/:id    - Update transaksi
DELETE /api/transactions/:id    - Hapus transaksi
```

Query parameters untuk list transactions:
- `wallet_id` - Filter by wallet
- `category_id` - Filter by category
- `transaction_type` - Filter by type (income/expense)
- `start_date` - Filter dari tanggal
- `end_date` - Filter sampai tanggal
- `limit` - Jumlah data (default: 50)
- `offset` - Offset untuk pagination

### Categories
```
GET    /api/categories     - List semua kategori
POST   /api/categories     - Buat kategori baru
DELETE /api/categories/:id - Hapus kategori
```

### Dashboard
```
GET /api/dashboard/summary      - Summary keuangan
GET /api/dashboard/monthly      - Statistik bulanan (12 bulan terakhir)
GET /api/dashboard/by-category  - Pengeluaran per kategori bulan ini
```

## Request Examples

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Create Transaction (with auth)
```bash
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "wallet_id": "uuid-wallet-id",
    "category_id": "uuid-category-id",
    "transaction_type": "expense",
    "amount": 50000,
    "description": "Makan siang"
  }'
```

## Response Format

Semua response menggunakan format JSON:

### Success
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Error message"
}
```

## Performance

Benchmark menggunakan `wrk`:
- ~50,000+ requests/second (GET endpoints)
- ~30,000+ requests/second (POST endpoints with DB writes)

## Development

```bash
# Watch mode (auto-reload)
cargo watch -x run

# Run tests
cargo test

# Format code
cargo fmt

# Lint
cargo clippy
```

## Project Structure

```
backend/
├── src/
│   ├── main.rs           # Entry point & router setup
│   ├── config.rs         # Configuration
│   ├── error.rs          # Error handling
│   ├── db.rs             # Database utilities
│   ├── handlers/         # API handlers
│   │   ├── auth.rs
│   │   ├── wallet.rs
│   │   ├── transaction.rs
│   │   ├── category.rs
│   │   └── dashboard.rs
│   ├── middleware/       # Middleware (auth)
│   ├── models/           # Data models
│   └── utils/            # Utilities (JWT, password)
├── migrations/           # SQL migrations
├── Cargo.toml
└── README.md
```

## License

MIT License

