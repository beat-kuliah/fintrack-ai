# 🔍 Analisis: Soft Delete vs Hard Delete & Category Sharing Model

## 📊 Pertanyaan 1: Soft Delete vs Hard Delete dengan SET NULL?

### Opsi A: Soft Delete (Seperti Wallets)

**Cara Kerja:**
- Tambahkan kolom `deleted_at TIMESTAMPTZ`
- Saat delete, set `deleted_at = NOW()` (tidak benar-benar hapus)
- Query filter: `WHERE deleted_at IS NULL`
- Category tetap ada di database, hanya tidak ditampilkan

**Keuntungan:**
- ✅ **Data recovery**: Bisa restore category yang terhapus
- ✅ **Audit trail**: Bisa track kapan category dihapus
- ✅ **Data integrity**: Category tetap ada, FK tetap valid
- ✅ **Consistency**: Sama dengan wallets (sudah pakai soft delete)
- ✅ **No orphaned data**: Transactions dan budgets tetap punya valid FK

**Kekurangan:**
- ❌ Database lebih besar (data tidak benar-benar dihapus)
- ❌ Query lebih kompleks (perlu filter `deleted_at IS NULL`)
- ❌ Perlu cleanup strategy untuk data lama

### Opsi B: Hard Delete dengan SET NULL

**Cara Kerja:**
- Hapus category dari database (benar-benar hapus)
- FK di transactions: `ON DELETE SET NULL` → `category_id` menjadi NULL
- FK di budgets: `ON DELETE SET NULL` → `category_id` menjadi NULL
- Data tetap ada, tapi kehilangan referensi

**Keuntungan:**
- ✅ Database lebih bersih (data benar-benar dihapus)
- ✅ Query lebih sederhana (tidak perlu filter deleted_at)
- ✅ Tidak perlu cleanup

**Kekurangan:**
- ❌ **Tidak bisa recover**: Category yang dihapus hilang selamanya
- ❌ **Orphaned data**: Transactions dan budgets punya `category_id = NULL`
- ❌ **Data integrity issue**: FK menjadi NULL, data kehilangan konteks
- ❌ **Inconsistency**: Wallets pakai soft delete, categories pakai hard delete

---

## 🎯 Rekomendasi: **Soft Delete** ✅

### Alasan:

1. **Consistency dengan Wallets**
   - Wallets sudah pakai soft delete (`deleted_at`)
   - Categories sebaiknya konsisten dengan pattern yang sama
   - User experience lebih konsisten

2. **Data Recovery**
   - User bisa restore category yang terhapus
   - Tidak kehilangan data historis
   - Lebih aman untuk user

3. **Data Integrity**
   - FK tetap valid (tidak menjadi NULL)
   - Transactions dan budgets tetap punya valid category reference
   - Tidak ada orphaned data

4. **Audit Trail**
   - Bisa track kapan category dihapus
   - Bisa analisis pattern (category mana yang sering dihapus)
   - Berguna untuk debugging

5. **User Experience**
   - User bisa "undo" delete
   - Tidak perlu khawatir kehilangan data
   - Lebih user-friendly

### Implementation:

```sql
-- Migration: Add soft delete to categories
ALTER TABLE categories 
ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NULL;
```

```rust
// Delete handler dengan soft delete
pub async fn delete_category(...) {
    // Check usage first
    let transaction_count = ...;
    let budget_count = ...;
    
    if transaction_count > 0 || budget_count > 0 {
        return Err(AppError::Conflict("Category masih digunakan..."));
    }
    
    // Soft delete
    sqlx::query(
        r#"UPDATE categories SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL"#
    )
    .bind(id)
    .bind(user_id)
    .execute(&state.db)
    .await?;
}

// Query dengan filter deleted_at
pub async fn get_user_categories(...) {
    sqlx::query_as::<_, Category>(
        r#"SELECT ... FROM categories 
           WHERE (user_id = $1 OR user_id IS NULL) 
           AND deleted_at IS NULL 
           ORDER BY name"#
    )
}
```

---

## 📊 Pertanyaan 2: Category Tiap User Berbeda atau Sama?

### Status Saat Ini:

**Setiap User Punya Categories Sendiri:**
- Saat registrasi, setiap user membuat categories sendiri (`user_id = user.id`)
- Tidak ada shared categories (`user_id = NULL`)
- Query: `WHERE user_id = $1 OR user_id IS NULL` (tapi tidak ada yang NULL)

**Dari Code:**
```rust
async fn create_default_categories(pool: &PgPool, user_id: Uuid) {
    // Setiap user membuat categories sendiri
    sqlx::query("INSERT INTO categories (id, user_id, name, ...) VALUES ($1, $2, ...)")
        .bind(Uuid::new_v4())  // UUID baru untuk setiap user
        .bind(user_id)         // user_id spesifik untuk user ini
        .execute(pool)
        .await?;
}
```

### Opsi A: Per User (Saat Ini) ✅

**Cara Kerja:**
- Setiap user punya categories sendiri
- `user_id = user.id` untuk semua categories user
- Tidak ada shared categories

**Keuntungan:**
- ✅ **Privacy**: User tidak melihat categories user lain
- ✅ **Customization**: User bisa customize tanpa mempengaruhi user lain
- ✅ **Isolation**: Data terisolasi per user
- ✅ **Flexibility**: User bisa hapus/edit categories tanpa masalah

**Kekurangan:**
- ❌ Duplikasi data (setiap user punya categories yang sama)
- ❌ Storage lebih besar
- ❌ Update default categories sulit (harus update semua user)

### Opsi B: Shared Default Categories

**Cara Kerja:**
- Default categories dibuat sekali (`user_id = NULL`)
- Semua user share default categories
- User bisa buat custom categories (`user_id = user.id`)

**Keuntungan:**
- ✅ **Storage efficient**: Default categories hanya sekali
- ✅ **Easy update**: Update sekali, semua user dapat update
- ✅ **Consistency**: Semua user punya default categories yang sama

**Kekurangan:**
- ❌ **Privacy issue**: Jika user bisa edit, mempengaruhi semua user
- ❌ **Complexity**: Perlu handle permission (siapa yang bisa edit default)
- ❌ **Migration complexity**: Perlu migrate existing data

---

## 🎯 Rekomendasi: **Tetap Per User (Saat Ini)** ✅

### Alasan:

1. **Privacy & Security**
   - User data terisolasi
   - Tidak ada risk data leak antar user
   - Lebih aman

2. **Customization**
   - User bebas customize tanpa mempengaruhi user lain
   - Tidak perlu permission system yang kompleks
   - Lebih fleksibel

3. **Simplicity**
   - Tidak perlu handle shared vs user-specific
   - Query lebih sederhana
   - Maintenance lebih mudah

4. **Storage Cost**
   - Categories tidak besar (hanya metadata)
   - Trade-off storage untuk simplicity dan privacy
   - Worth it untuk user experience

5. **Current Implementation**
   - Sudah bekerja dengan baik
   - Tidak perlu migration besar
   - User sudah familiar

### Jika Ingin Shared Categories (Future):

**Hybrid Approach:**
- Default categories: Shared (`user_id = NULL`) - read-only untuk user
- Custom categories: Per user (`user_id = user.id`) - bisa edit/delete
- Query: `WHERE (user_id = $1 OR user_id IS NULL) AND deleted_at IS NULL`

**Tapi ini memerlukan:**
- Migration untuk existing data
- Permission system untuk default categories
- UI untuk membedakan default vs custom
- Complexity yang lebih tinggi

**Rekomendasi: Jangan ubah sekarang, pertimbangkan di future jika benar-benar perlu.**

---

## 📝 Kesimpulan & Rekomendasi Final

### 1. Delete Strategy: **Soft Delete** ✅

**Implementation:**
- ✅ Tambahkan `deleted_at` column
- ✅ Update delete handler untuk soft delete
- ✅ Filter `deleted_at IS NULL` di semua queries
- ✅ Tambahkan validation sebelum delete (cek usage)
- ✅ Optional: Add restore functionality

**Benefits:**
- Consistency dengan wallets
- Data recovery
- Data integrity
- Better UX

### 2. Category Sharing: **Tetap Per User** ✅

**Status:**
- ✅ Saat ini sudah per user (baik)
- ✅ Tidak perlu diubah
- ✅ Privacy dan simplicity lebih penting

**Future Consideration:**
- Jika benar-benar perlu shared categories, bisa implement hybrid
- Tapi untuk sekarang, per user sudah cukup

---

## 🚀 Implementation Plan

### Phase 1: Add Soft Delete to Categories

1. ✅ Create migration untuk add `deleted_at` column
2. ✅ Update delete handler untuk soft delete
3. ✅ Update all queries untuk filter `deleted_at IS NULL`
4. ✅ Add validation sebelum delete (cek usage)

### Phase 2: Improve UX

1. ✅ Tampilkan warning sebelum delete
2. ✅ Show usage stats (berapa transactions, budgets)
3. ✅ Optional: Add restore functionality
4. ✅ Handle deleted categories di UI (jangan tampilkan)

### Phase 3: Optional Enhancements

1. ⚠️ Add cleanup job untuk permanently delete old deleted categories (optional)
2. ⚠️ Add restore category functionality (optional)
3. ⚠️ Add category archive view (optional)

---

## 📊 Comparison Table

| Aspek | Soft Delete | Hard Delete + SET NULL |
|-------|-------------|------------------------|
| **Data Recovery** | ✅ Bisa recover | ❌ Tidak bisa |
| **Data Integrity** | ✅ FK tetap valid | ❌ FK menjadi NULL |
| **Consistency** | ✅ Sama dengan wallets | ❌ Berbeda dengan wallets |
| **Orphaned Data** | ✅ Tidak ada | ❌ Ada (category_id = NULL) |
| **Database Size** | ⚠️ Lebih besar | ✅ Lebih kecil |
| **Query Complexity** | ⚠️ Perlu filter | ✅ Lebih sederhana |
| **User Experience** | ✅ Bisa undo | ❌ Tidak bisa undo |
| **Audit Trail** | ✅ Ada | ❌ Tidak ada |

**Verdict: Soft Delete menang di semua aspek penting.**

---

## 💡 Final Recommendation

### ✅ **Soft Delete untuk Categories**

**Alasan:**
- Consistency dengan wallets
- Data recovery
- Data integrity
- Better UX
- Audit trail

### ✅ **Tetap Per User Categories**

**Alasan:**
- Privacy & security
- Simplicity
- Flexibility
- Current implementation sudah baik
- Storage cost minimal

**Tidak perlu diubah ke shared categories kecuali ada kebutuhan spesifik di future.**

