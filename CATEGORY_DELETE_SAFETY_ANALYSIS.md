# 🔒 Analisis Keamanan Data Saat Category Dihapus

## 📊 Status Saat Ini

### Database Constraints:

#### 1. **Transactions** ✅ RELATIF AMAN
```sql
category_id UUID REFERENCES categories(id) ON DELETE SET NULL
```

**Behavior:**
- ✅ Jika category dihapus, `category_id` di transactions menjadi `NULL`
- ✅ **Transaction data TIDAK hilang** - semua data tetap ada
- ⚠️ Hanya kehilangan referensi ke category (category_id = NULL)
- ⚠️ Transaction masih bisa ditampilkan, tapi tanpa category name

#### 2. **Budgets** ❌ TIDAK AMAN
```sql
category_id UUID REFERENCES categories(id) ON DELETE CASCADE
```

**Behavior:**
- ❌ Jika category dihapus, **semua budgets yang menggunakan category tersebut akan DIHAPUS OTOMATIS**
- ❌ **Data budgets HILANG** tanpa warning
- ❌ User tidak diberitahu bahwa budgets akan terhapus
- ❌ Tidak ada cara untuk recover budgets yang terhapus

### Current Delete Handler:

```rust
pub async fn delete_category(...) {
    // TIDAK ada validation untuk cek usage
    // Langsung delete tanpa warning
    sqlx::query("DELETE FROM categories WHERE id = $1 AND user_id = $2")
    .execute(&state.db)
    .await?;
}
```

**Masalah:**
- ❌ Tidak cek apakah category digunakan di transactions
- ❌ Tidak cek apakah category digunakan di budgets
- ❌ Tidak ada warning sebelum delete
- ❌ Budgets terhapus otomatis tanpa user tahu

---

## 🚨 Skenario Masalah

### Skenario 1: User Hapus Category yang Punya Budget

**Timeline:**
1. User membuat category "Jajan"
2. User membuat budget "Jajan" untuk Januari 2024 (Rp 500.000)
3. User membuat beberapa transactions dengan category "Jajan"
4. User menghapus category "Jajan"

**Yang Terjadi:**
- ✅ Transactions tetap ada (category_id menjadi NULL)
- ❌ **Budget "Jajan" untuk Januari 2024 TERHAPUS** (CASCADE)
- ❌ User kehilangan data budget tanpa warning
- ❌ Tidak ada cara untuk recover

**Dampak:**
- User kehilangan rencana budget
- Data historis budget hilang
- User tidak tahu budget terhapus sampai cek halaman budgeting

### Skenario 2: User Hapus Category yang Punya Banyak Transactions

**Timeline:**
1. User membuat category "Makanan"
2. User membuat 100+ transactions dengan category "Makanan"
3. User menghapus category "Makanan"

**Yang Terjadi:**
- ✅ Transactions tetap ada (category_id menjadi NULL)
- ⚠️ Semua 100+ transactions kehilangan category name
- ⚠️ Reporting berdasarkan category menjadi tidak akurat
- ⚠️ User tidak bisa filter transactions berdasarkan category "Makanan"

**Dampak:**
- Data tetap ada tapi kehilangan konteks
- Reporting dan analisis menjadi tidak akurat
- User experience menurun

---

## ✅ Rekomendasi Perbaikan

### 1. **Ubah Budget Constraint** (PRIORITAS TINGGI)

**Dari:**
```sql
category_id UUID REFERENCES categories(id) ON DELETE CASCADE
```

**Ke:**
```sql
category_id UUID REFERENCES categories(id) ON DELETE SET NULL
```

**Alasan:**
- Budget tetap ada meskipun category dihapus
- User bisa recover dengan membuat category baru dan update budget
- Data historis budget tidak hilang

**Migration:**
```sql
-- Drop existing constraint
ALTER TABLE budgets 
DROP CONSTRAINT budgets_category_id_fkey;

-- Add new constraint with SET NULL
ALTER TABLE budgets 
ADD CONSTRAINT budgets_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES categories(id) 
ON DELETE SET NULL;
```

### 2. **Tambahkan Validation di Delete Handler**

**Sebelum delete, cek:**
- Berapa banyak transactions menggunakan category ini
- Berapa banyak budgets menggunakan category ini
- Tampilkan warning dengan detail usage

**Implementation:**
```rust
pub async fn delete_category(...) {
    // Check usage in transactions
    let transaction_count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM transactions WHERE category_id = $1 AND user_id = $2"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    // Check usage in budgets
    let budget_count: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM budgets WHERE category_id = $1 AND user_id = $2"#
    )
    .bind(id)
    .bind(user_id)
    .fetch_one(&state.db)
    .await?;

    if transaction_count.0 > 0 || budget_count.0 > 0 {
        return Err(AppError::Conflict(format!(
            "Category ini digunakan di {} transactions dan {} budgets. Hapus atau update data terkait terlebih dahulu.",
            transaction_count.0, budget_count.0
        )));
    }

    // Safe to delete
    sqlx::query("DELETE FROM categories WHERE id = $1 AND user_id = $2")
    .execute(&state.db)
    .await?;
}
```

### 3. **Soft Delete Option** (Alternatif)

**Jika user tetap ingin delete meskipun ada usage:**
- Tampilkan warning dengan detail
- Berikan opsi untuk:
  - Cancel delete
  - Delete anyway (soft delete - mark as deleted, tidak benar-benar hapus)
  - Atau hard delete dengan konfirmasi

### 4. **Handle Orphaned Data**

**Setelah category dihapus:**
- Budgets dengan `category_id = NULL` ditampilkan sebagai "Unknown Category"
- Transactions dengan `category_id = NULL` ditampilkan tanpa category
- Berikan opsi untuk reassign category

---

## 🔧 Implementation Plan

### Phase 1: Fix Database Constraint (URGENT)

1. ✅ Buat migration untuk ubah `ON DELETE CASCADE` ke `ON DELETE SET NULL` untuk budgets
2. ✅ Test bahwa budgets tidak terhapus saat category dihapus
3. ✅ Test bahwa budgets tetap bisa ditampilkan (dengan category_name = NULL)

### Phase 2: Add Validation

1. ✅ Update delete_category handler untuk cek usage
2. ✅ Return error jika category digunakan
3. ✅ Tampilkan detail usage (berapa transactions, berapa budgets)

### Phase 3: Improve UX

1. ✅ Tampilkan warning di frontend sebelum delete
2. ✅ Show usage stats di UI
3. ✅ Handle orphaned budgets (tampilkan "Unknown Category")
4. ✅ Berikan opsi untuk reassign category

---

## 📊 Comparison: Sebelum vs Sesudah

### Sebelum (Current - TIDAK AMAN):

| Data Type | Behavior | Status |
|-----------|----------|--------|
| Transactions | `category_id` menjadi NULL | ✅ Data aman, tapi kehilangan referensi |
| Budgets | **TERHAPUS OTOMATIS** | ❌ **Data hilang tanpa warning** |
| Validation | Tidak ada | ❌ Tidak ada warning |

### Sesudah (Recommended - AMAN):

| Data Type | Behavior | Status |
|-----------|----------|--------|
| Transactions | `category_id` menjadi NULL | ✅ Data aman, tapi kehilangan referensi |
| Budgets | `category_id` menjadi NULL | ✅ **Data aman, tidak hilang** |
| Validation | Cek usage sebelum delete | ✅ **Warning jika digunakan** |

---

## 🎯 Kesimpulan

### Status Saat Ini: ⚠️ **TIDAK AMAN**

**Masalah:**
- ❌ Budgets terhapus otomatis saat category dihapus (CASCADE)
- ❌ Tidak ada validation atau warning
- ❌ User kehilangan data tanpa tahu

### Rekomendasi: ✅ **PERBAIKI SEGERA**

**Solusi:**
1. ✅ Ubah constraint budgets dari CASCADE ke SET NULL
2. ✅ Tambahkan validation di delete handler
3. ✅ Tampilkan warning di frontend
4. ✅ Handle orphaned data dengan baik

**Hasil:**
- ✅ Data budgets tetap aman
- ✅ User mendapat warning sebelum delete
- ✅ Data historis tidak hilang
- ✅ User bisa recover dengan reassign category

---

## 🚀 Quick Fix (Migration)

```sql
-- Migration: Fix budget constraint
-- File: backend/migrations/20240108000000_fix_budget_category_constraint.sql

-- Drop existing constraint
ALTER TABLE budgets 
DROP CONSTRAINT IF EXISTS budgets_category_id_fkey;

-- Add new constraint with SET NULL (safer)
ALTER TABLE budgets 
ADD CONSTRAINT budgets_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES categories(id) 
ON DELETE SET NULL;

-- Add comment
COMMENT ON CONSTRAINT budgets_category_id_fkey ON budgets IS 
'Category reference with SET NULL on delete to preserve budget data';
```

**Ini akan:**
- ✅ Mencegah budgets terhapus saat category dihapus
- ✅ Budgets tetap ada dengan `category_id = NULL`
- ✅ User bisa recover dengan membuat category baru dan update budget

