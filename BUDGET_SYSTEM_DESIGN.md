# 💰 Budget System Design

Rekomendasi desain sistem budget untuk FinTrack dengan fokus pada category expense.

## 🎯 Konsep Budget

Budget digunakan untuk:
- **Batas pengeluaran bulanan** per category
- **Tracking penggunaan** vs limit yang ditetapkan
- **Alert/notification** saat budget hampir habis atau melebihi
- **Planning** pengeluaran bulanan

## 📊 Rekomendasi Struktur

### Opsi 1: Budget per Category (RECOMMENDED ✅)

**Konsep**: Setiap category expense punya budget sendiri per bulan.

**Keuntungan**:
- ✅ Lebih detail dan akurat
- ✅ User bisa kontrol budget per kategori (makanan, transport, dll)
- ✅ Mudah tracking mana yang over budget
- ✅ Fleksibel - bisa set budget untuk category tertentu saja

**Contoh**:
- Category "Makanan": Budget Rp 2.000.000/bulan
- Category "Transport": Budget Rp 1.000.000/bulan
- Category "Hiburan": Budget Rp 500.000/bulan

### Opsi 2: Total Budget Bulanan

**Konsep**: Satu budget total untuk semua expense bulanan.

**Keuntungan**:
- ✅ Lebih sederhana
- ✅ Cocok untuk user yang tidak ingin detail per category

**Kekurangan**:
- ❌ Kurang detail
- ❌ Sulit tracking category mana yang over

### Opsi 3: Hybrid (Budget Total + Per Category)

**Konsep**: Kombinasi total budget + budget per category.

**Keuntungan**:
- ✅ Fleksibel - bisa pakai salah satu atau keduanya
- ✅ Total budget sebagai safety net
- ✅ Category budget untuk detail tracking

## 🏗️ Database Schema Design

### Tabel: `budgets`

```sql
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    -- category_id NULL = total budget bulanan
    amount FLOAT8 NOT NULL CHECK (amount > 0),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    -- Optional: bisa set budget untuk beberapa bulan ke depan
    is_active BOOLEAN NOT NULL DEFAULT true,
    alert_threshold INTEGER DEFAULT 80, -- Alert saat 80% terpakai
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: satu budget per category per bulan per user
    UNIQUE(user_id, category_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(year, month);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active) WHERE is_active = true;
```

### Penjelasan Field

- **category_id**: 
  - `NULL` = Total budget bulanan (untuk semua expense)
  - `UUID` = Budget untuk category tertentu
- **month, year**: Periode budget (1-12 untuk month, 2024 untuk year)
- **amount**: Jumlah budget (dalam Rupiah)
- **alert_threshold**: Persentase untuk trigger alert (default 80%)
- **is_active**: Untuk enable/disable budget tertentu

## 📈 Budget Tracking & Calculation

### Query: Get Budget Usage

```sql
-- Get budget dengan usage per category
SELECT 
    b.id,
    b.category_id,
    c.name as category_name,
    b.amount as budget_amount,
    b.month,
    b.year,
    COALESCE(SUM(t.amount), 0) as used_amount,
    b.amount - COALESCE(SUM(t.amount), 0) as remaining_amount,
    (COALESCE(SUM(t.amount), 0) / b.amount * 100) as usage_percentage,
    CASE 
        WHEN COALESCE(SUM(t.amount), 0) > b.amount THEN true
        ELSE false
    END as is_over_budget,
    CASE
        WHEN (COALESCE(SUM(t.amount), 0) / b.amount * 100) >= b.alert_threshold THEN true
        ELSE false
    END as should_alert
FROM budgets b
LEFT JOIN categories c ON b.category_id = c.id
LEFT JOIN transactions t ON 
    t.category_id = b.category_id 
    AND t.user_id = b.user_id
    AND t.transaction_type = 'expense'
    AND EXTRACT(MONTH FROM t.date) = b.month
    AND EXTRACT(YEAR FROM t.date) = b.year
WHERE b.user_id = $1 
    AND b.year = $2 
    AND b.month = $3
    AND b.is_active = true
GROUP BY b.id, b.category_id, c.name, b.amount, b.month, b.year, b.alert_threshold;
```

### Query: Total Budget Usage (untuk total budget)

```sql
-- Get total budget usage
SELECT 
    b.id,
    b.amount as budget_amount,
    b.month,
    b.year,
    COALESCE(SUM(t.amount), 0) as used_amount,
    b.amount - COALESCE(SUM(t.amount), 0) as remaining_amount,
    (COALESCE(SUM(t.amount), 0) / b.amount * 100) as usage_percentage
FROM budgets b
LEFT JOIN transactions t ON 
    t.user_id = b.user_id
    AND t.transaction_type = 'expense'
    AND EXTRACT(MONTH FROM t.date) = b.month
    AND EXTRACT(YEAR FROM t.date) = b.year
WHERE b.user_id = $1 
    AND b.year = $2 
    AND b.month = $3
    AND b.category_id IS NULL
    AND b.is_active = true
GROUP BY b.id, b.amount, b.month, b.year;
```

## 🎨 API Endpoints

### Budget Management

```
POST   /api/budgets              # Create budget
GET    /api/budgets              # List budgets (filter by month, year)
GET    /api/budgets/:id          # Get budget detail dengan usage
PUT    /api/budgets/:id          # Update budget
DELETE /api/budgets/:id          # Delete budget
```

### Budget Reports

```
GET    /api/budgets/current      # Get current month budgets dengan usage
GET    /api/budgets/summary      # Get budget summary (total, used, remaining)
GET    /api/budgets/alerts       # Get budgets yang perlu alert
```

## 🔔 Alert System

### Alert Conditions

1. **Budget Threshold Reached** (default 80%)
   - Saat penggunaan mencapai 80% dari budget
   - Trigger: `budget_alert` event

2. **Budget Exceeded**
   - Saat penggunaan melebihi budget
   - Trigger: `budget_exceeded` event

3. **Budget Almost Empty** (optional)
   - Saat remaining < 10% dari budget
   - Trigger: `budget_low` event

### Integration dengan WhatsApp Service

```rust
// Di transaction handler, setelah create expense
if transaction_type == "expense" {
    check_budget_and_alert(user_id, category_id, amount, date).await;
}
```

## 📝 Best Practices

### 1. Budget Setup

- **Set budget di awal bulan** untuk planning
- **Copy budget bulan sebelumnya** sebagai starting point
- **Review dan adjust** budget setiap bulan

### 2. Category Structure

Untuk expense categories, struktur yang baik:

```
Expense Categories:
├── Makanan & Minuman
│   ├── Makan Siang
│   ├── Makan Malam
│   └── Snack
├── Transport
│   ├── Bensin
│   ├── Parkir
│   └── Transport Online
├── Belanja
│   ├── Kebutuhan Rumah
│   └── Pakaian
├── Hiburan
│   ├── Film
│   └── Game
└── Lainnya
```

**Rekomendasi**: 
- Buat category yang cukup detail tapi tidak terlalu banyak
- 5-10 main categories sudah cukup
- Bisa buat sub-category jika perlu (atau pakai category name yang deskriptif)

### 3. Budget Amount

- **Realistic**: Set budget berdasarkan pengeluaran historis
- **Flexible**: Bisa adjust di tengah bulan jika perlu
- **Category Priority**: Set budget lebih besar untuk kebutuhan penting

### 4. Monthly Reset

- Budget otomatis untuk bulan tertentu (month + year)
- User bisa copy budget bulan sebelumnya
- Bisa set budget untuk beberapa bulan ke depan

## 🚀 Implementation Plan

### Phase 1: Database & Models
1. ✅ Create migration untuk tabel `budgets`
2. ✅ Create Budget model di Rust
3. ✅ Create Budget handlers

### Phase 2: API Endpoints
1. ✅ CRUD operations untuk budgets
2. ✅ Budget summary & usage calculation
3. ✅ Budget alerts

### Phase 3: Integration
1. ✅ Integrate dengan transaction creation
2. ✅ Budget check saat create expense
3. ✅ WhatsApp alerts untuk budget

### Phase 4: Frontend
1. ✅ Budget management UI
2. ✅ Budget tracking & visualization
3. ✅ Budget alerts display

## 📊 Example Use Cases

### Use Case 1: Set Budget untuk Bulan Ini

```json
POST /api/budgets
{
  "category_id": "uuid-category-makanan",
  "amount": 2000000,
  "month": 1,
  "year": 2024,
  "alert_threshold": 80
}
```

### Use Case 2: Check Budget Status

```json
GET /api/budgets/current

Response:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "category_id": "...",
      "category_name": "Makanan",
      "budget_amount": 2000000,
      "used_amount": 1500000,
      "remaining_amount": 500000,
      "usage_percentage": 75,
      "is_over_budget": false,
      "should_alert": false
    }
  ]
}
```

### Use Case 3: Budget Alert

Saat expense dibuat dan budget mencapai 80%:
- Trigger WhatsApp notification
- Show alert di frontend
- Email notification (optional)

## 🎯 Kesimpulan

**Rekomendasi**: Gunakan **Budget per Category** dengan opsi **Total Budget** sebagai fallback.

**Struktur Category**:
- Buat category expense yang cukup detail (5-10 main categories)
- Set budget per category per bulan
- Optional: Total budget bulanan sebagai safety net

**Benefits**:
- ✅ Detail tracking per category
- ✅ Mudah identify category yang over budget
- ✅ Better planning dan control
- ✅ Flexible untuk berbagai kebutuhan user


