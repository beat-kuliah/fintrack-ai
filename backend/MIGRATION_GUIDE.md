# Panduan Migration SQLx

## 1. Install sqlx-cli

Install sqlx-cli menggunakan cargo:

```bash
cargo install sqlx-cli --features postgres
```

Atau jika sudah terinstall, pastikan versi terbaru:

```bash
cargo install sqlx-cli --features postgres --force
```

## 2. Setup Environment Variables

Pastikan file `.env` sudah ada di folder `backend/`. Jika belum, copy dari `env.example`:

```bash
cd backend
cp env.example .env
```

Edit file `.env` dan pastikan `DATABASE_URL` sudah benar:

```env
DATABASE_URL=postgres://postgres:Admin123@localhost:5432/fintrack
```

**Format DATABASE_URL:**
```
postgres://[user]:[password]@[host]:[port]/[database_name]
```

Contoh:
- User: `postgres`
- Password: `Admin123`
- Host: `localhost` (atau `127.0.0.1`)
- Port: `5432`
- Database: `fintrack`

## 3. Pastikan Database Sudah Dibuat

Sebelum menjalankan migration, pastikan database sudah dibuat:

```bash
# Masuk ke PostgreSQL
psql -U postgres

# Atau jika menggunakan password
PGPASSWORD=Admin123 psql -U postgres -h localhost

# Buat database jika belum ada
CREATE DATABASE fintrack;

# Keluar
\q
```

## 4. Menjalankan Migration

### Menjalankan semua migration yang belum dijalankan:

```bash
cd backend
sqlx migrate run
```

### Melihat status migration:

```bash
sqlx migrate info
```

### Revert migration terakhir:

```bash
sqlx migrate revert
```

### Membuat migration baru:

```bash
sqlx migrate add nama_migration
```

## 5. Verifikasi Migration

Setelah migration berhasil, verifikasi dengan:

```bash
# Masuk ke database
psql -U postgres -d fintrack

# Cek tabel users
\d users

# Cek apakah field username sudah ada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

# Keluar
\q
```

## Troubleshooting

### Error: "database does not exist"
- Pastikan database sudah dibuat (lihat langkah 3)

### Error: "connection refused" atau "could not connect"
- Pastikan PostgreSQL service sudah running
- Cek `DATABASE_URL` di file `.env`
- Cek firewall/network settings

### Error: "password authentication failed"
- Pastikan username dan password di `DATABASE_URL` benar
- Cek konfigurasi PostgreSQL untuk authentication

### Error: "relation already exists"
- Migration sudah pernah dijalankan sebelumnya
- Gunakan `sqlx migrate info` untuk melihat status
- Jika perlu reset, drop database dan buat lagi (hati-hati, ini akan menghapus semua data!)

## Contoh Lengkap

```bash
# 1. Install sqlx-cli
cargo install sqlx-cli --features postgres

# 2. Setup .env
cd backend
cp env.example .env
# Edit .env dan sesuaikan DATABASE_URL

# 3. Buat database (jika belum)
createdb -U postgres fintrack
# atau
psql -U postgres -c "CREATE DATABASE fintrack;"

# 4. Jalankan migration
sqlx migrate run

# 5. Verifikasi
sqlx migrate info
```

## Catatan Penting

- Migration dijalankan secara berurutan berdasarkan timestamp di nama file
- Setelah migration dijalankan, tidak bisa di-undo kecuali menggunakan `sqlx migrate revert`
- Selalu backup database sebelum menjalankan migration di production
- Pastikan `DATABASE_URL` di `.env` tidak di-commit ke git (gunakan `.gitignore`)

