# Cara Install sqlx-cli dan Menjalankan Migration

## Masalah: Error saat install sqlx-cli

Jika Anda mendapat error seperti:
```
Could not find openssl via pkg-config
Could not find directory of OpenSSL installation
```

Ini berarti sistem Anda belum memiliki dependencies yang diperlukan.

## Solusi 1: Install Dependencies (Recommended)

Jalankan perintah berikut untuk install dependencies yang diperlukan:

```bash
sudo apt update
sudo apt install -y pkg-config libssl-dev
```

Setelah itu, coba install sqlx-cli lagi:

```bash
cargo install sqlx-cli --features postgres
```

## Solusi 2: Menggunakan Vendored OpenSSL

Jika tidak bisa install dependencies sistem, Anda bisa menggunakan vendored OpenSSL (akan compile OpenSSL dari source):

```bash
# Set environment variable untuk menggunakan vendored OpenSSL
export OPENSSL_STATIC=1
export OPENSSL_VENDORED=1

# Install sqlx-cli
cargo install sqlx-cli --features postgres
```

**Catatan:** Cara ini akan lebih lama karena perlu compile OpenSSL dari source.

## Solusi 3: Menggunakan Docker (Alternatif)

Jika tidak ingin install dependencies, Anda bisa menggunakan Docker:

```bash
# Pull image yang sudah ada sqlx-cli
docker pull ghcr.io/launchbadge/sqlx-cli:latest

# Atau gunakan dengan docker run
docker run --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  -e DATABASE_URL="postgres://postgres:Admin123@host.docker.internal:5432/fintrack" \
  ghcr.io/launchbadge/sqlx-cli:latest \
  migrate run
```

## Solusi 4: Menjalankan Migration dari Kode Rust

Alternatif lain adalah menjalankan migration langsung dari aplikasi Rust. Tambahkan dependency di `Cargo.toml`:

```toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono", "migrate"] }
```

Kemudian tambahkan kode di `main.rs` sebelum menjalankan server:

```rust
// Di main.rs, sebelum start server
sqlx::migrate!("./migrations")
    .run(&pool)
    .await
    .expect("Failed to run migrations");
```

## Verifikasi Install

Setelah berhasil install, verifikasi dengan:

```bash
sqlx --version
```

## Menjalankan Migration

Setelah sqlx-cli terinstall, jalankan migration:

```bash
cd backend

# Pastikan .env sudah ada dan DATABASE_URL sudah benar
cp env.example .env
# Edit .env sesuai kebutuhan

# Jalankan migration
sqlx migrate run

# Cek status
sqlx migrate info
```

## Troubleshooting

### Error: "database does not exist"
```bash
# Buat database terlebih dahulu
createdb -U postgres fintrack
# atau
psql -U postgres -c "CREATE DATABASE fintrack;"
```

### Error: "connection refused"
- Pastikan PostgreSQL service sudah running
- Cek `DATABASE_URL` di file `.env`
- Pastikan host dan port benar

### Error: "password authentication failed"
- Pastikan username dan password di `DATABASE_URL` benar
- Cek konfigurasi PostgreSQL

