# 📋 Category & Budget Design Analysis

## 1. Category Management

### Status Saat Ini ✅

**Category sudah FLEXIBLE:**
- ✅ User bisa **menambah** category baru via `POST /api/categories`
- ✅ User bisa **menghapus** category mereka sendiri via `DELETE /api/categories/:id`
- ✅ Default categories dibuat saat registrasi
- ✅ User bisa membuat custom categories sesuai kebutuhan

**Keterbatasan:**
- ❌ User **TIDAK bisa** menghapus default categories (user_id = NULL)
- ❌ Tidak ada edit category (hanya create & delete)

### Rekomendasi Category Management

#### ✅ **Tetap Flexible (Saat Ini Sudah Baik)**

**Alasan:**
1. **Fleksibilitas tinggi**: User bisa customize categories sesuai kebutuhan
2. **User control**: User menentukan kategori yang relevan untuk mereka
3. **Scalable**: Tidak terbatas pada kategori default saja

**Yang Perlu Ditambahkan:**
- [ ] **Edit Category** endpoint (`PUT /api/categories/:id`)
- [ ] **Validation saat delete**: 
  - Cek apakah category digunakan di transactions
  - Cek apakah category digunakan di budgets
  - Tampilkan warning jika ada data terkait
- [ ] **Category usage stats**: Tampilkan berapa banyak transaction/budget menggunakan category ini

## 2. Budget Duplicate Prevention

### Status Saat Ini ✅

**Sistem sudah MENCEGAH duplicate budget:**

```sql
CONSTRAINT unique_budget_per_category_month 
    UNIQUE(user_id, category_id, month, year)
```

**Ini berarti:**
- ✅ **TIDAK BISA** membuat 2 budget untuk category yang sama di bulan/tahun yang sama
- ✅ Sistem akan return error: "Budget untuk kategori dan periode ini sudah ada"
- ✅ Database constraint mencegah duplicate di level database

### Contoh Skenario:

#### ✅ **Boleh (Berbeda Periode):**
- Budget "Jajan" untuk Januari 2024
- Budget "Jajan" untuk Februari 2024
- ✅ **Boleh** karena berbeda bulan

#### ✅ **Boleh (Berbeda Category):**
- Budget "Jajan" untuk Januari 2024
- Budget "Makanan" untuk Januari 2024
- ✅ **Boleh** karena berbeda category

#### ❌ **TIDAK Boleh (Duplicate):**
- Budget "Jajan" untuk Januari 2024 (Budget 1)
- Budget "Jajan" untuk Januari 2024 (Budget 2)
- ❌ **TIDAK BISA** - akan error karena constraint

### Implementasi di Backend:

```rust
// Check if budget already exists
let existing: Option<(Uuid,)> = sqlx::query_as(
    r#"
    SELECT id FROM budgets
    WHERE user_id = $1
        AND (category_id IS NULL AND $2::uuid IS NULL OR category_id = $2)
        AND month = $3
        AND year = $4
    "#
)
.bind(user_id)
.bind(&payload.category_id)
.bind(payload.month)
.bind(payload.year)
.fetch_optional(&state.db)
.await?;

if existing.is_some() {
    return Err(AppError::ValidationError(
        "Budget untuk kategori dan periode ini sudah ada".to_string(),
    ));
}
```

## 3. Budget Tracking Logic

### Bagaimana Budget Terisi Saat Transaction Dibuat?

**Skenario: User membuat transaction dengan category "Jajan"**

#### Jika Ada Budget untuk Category "Jajan":
1. Transaction dibuat dengan `category_id = "jajan-uuid"`
2. Sistem menghitung budget usage:
   ```sql
   SELECT COALESCE(SUM(amount), 0) as used
   FROM transactions
   WHERE user_id = $1
       AND category_id = $2  -- category "Jajan"
       AND transaction_type = 'expense'
       AND EXTRACT(MONTH FROM date) = $3
       AND EXTRACT(YEAR FROM date) = $4
   ```
3. Budget untuk "Jajan" akan terisi dengan amount transaction tersebut
4. ✅ **Hanya 1 budget yang terisi** (karena constraint mencegah duplicate)

#### Jika Ada 2 Budget untuk Category "Jajan" (TIDAK MUNGKIN):
- ❌ **Tidak akan terjadi** karena constraint database
- Jika somehow terjadi (bug), maka:
  - Query akan menghitung total expense untuk category tersebut
  - **Kedua budget akan menampilkan usage yang sama** (total expense)
  - Ini adalah bug yang perlu diperbaiki

### Current Implementation:

```rust
// Get used amount for this category
let used: Option<(f64,)> = sqlx::query_as(
    r#"
    SELECT COALESCE(SUM(amount), 0) as used
    FROM transactions
    WHERE user_id = $1
        AND category_id = $2
        AND transaction_type = 'expense'
        AND EXTRACT(MONTH FROM date) = $3
        AND EXTRACT(YEAR FROM date) = $4
    "#
)
.bind(user_id)
.bind(category_id)
.bind(budget.month)
.bind(budget.year)
.fetch_optional(&state.db)
.await?;
```

**Cara Kerja:**
- Query menghitung **total expense** untuk category di periode tertentu
- Setiap budget untuk category yang sama akan menampilkan **usage yang sama**
- Ini benar karena expense dihitung per category, bukan per budget

## 4. Edge Cases & Recommendations

### Edge Case 1: Category Dihapus

**Skenario:**
- User punya budget untuk category "Jajan"
- User menghapus category "Jajan"
- Budget masih ada tapi category sudah tidak ada

**Current Behavior:**
- Budget tetap ada (karena `ON DELETE CASCADE` hanya untuk user, bukan category)
- `category_id` di budget menjadi orphaned reference
- Budget tidak bisa ditampilkan dengan benar (category_name = NULL)

**Rekomendasi:**
- [ ] Saat delete category, **soft delete** atau **cascade delete budgets**
- [ ] Atau tampilkan warning: "Category ini digunakan di X budgets, hapus budgets terlebih dahulu?"

### Edge Case 2: Multiple Categories dengan Nama Sama

**Skenario:**
- User membuat category "Jajan" (custom)
- User juga punya default category "Jajan" (jika ada)
- User membuat budget untuk salah satu "Jajan"

**Current Behavior:**
- ✅ Tidak masalah karena menggunakan UUID, bukan nama
- Setiap category punya UUID unik
- Budget terikat ke UUID spesifik

**Rekomendasi:**
- [ ] Tampilkan UUID atau identifier unik di UI untuk membedakan
- [ ] Atau prevent duplicate category names (optional)

### Edge Case 3: Budget untuk Category yang Tidak Ada

**Skenario:**
- User membuat budget dengan `category_id` yang tidak valid
- Atau category dihapus setelah budget dibuat

**Current Behavior:**
- Budget dibuat dengan `category_id` yang tidak valid
- Saat ditampilkan, `category_name` akan NULL

**Rekomendasi:**
- [ ] Validate category exists saat create budget
- [ ] Tampilkan warning jika category tidak ditemukan

## 5. Kesimpulan & Rekomendasi

### ✅ Yang Sudah Baik:

1. **Category Management**: Flexible, user bisa add/delete
2. **Budget Constraint**: Mencegah duplicate budget untuk category yang sama di periode yang sama
3. **Budget Tracking**: Menghitung usage dengan benar berdasarkan category_id

### 🔧 Yang Perlu Ditingkatkan:

1. **Edit Category**: Tambahkan endpoint untuk edit category
2. **Delete Validation**: Cek usage sebelum delete category
3. **Budget Validation**: Validate category exists saat create budget
4. **Orphaned Budgets**: Handle budget yang category-nya sudah dihapus
5. **UI Feedback**: Tampilkan warning jika ada constraint violation

### 📝 Best Practices:

1. **Category Naming**: 
   - User bebas membuat category dengan nama apapun
   - Tidak perlu prevent duplicate names (karena menggunakan UUID)

2. **Budget Creation**:
   - Validate category exists
   - Check duplicate sebelum insert
   - Tampilkan error message yang jelas

3. **Budget Tracking**:
   - Query berdasarkan category_id (bukan nama)
   - Handle case dimana category sudah dihapus
   - Tampilkan "Unknown Category" jika category tidak ditemukan

## 6. FAQ

### Q: Apakah bisa membuat 2 budget untuk category "Jajan" di bulan yang sama?
**A: TIDAK.** Sistem mencegah ini dengan UNIQUE constraint. Akan error: "Budget untuk kategori dan periode ini sudah ada"

### Q: Jika transaction dibuat dengan category "Jajan", budget mana yang terisi?
**A: Budget yang sesuai dengan category_id transaction.** Karena constraint mencegah duplicate, hanya ada 1 budget untuk category tersebut di periode tersebut.

### Q: Apakah category bisa dihapus jika sudah digunakan di budget?
**A: BISA** (saat ini). Tapi ini akan membuat budget menjadi orphaned. **Rekomendasi**: Tambahkan validation untuk prevent delete jika category digunakan.

### Q: Apakah bisa membuat budget untuk category yang tidak ada?
**A: BISA** (saat ini). Tapi ini akan membuat budget tidak bisa ditampilkan dengan benar. **Rekomendasi**: Validate category exists saat create budget.

