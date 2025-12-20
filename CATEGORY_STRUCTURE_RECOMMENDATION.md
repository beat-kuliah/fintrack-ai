# 📁 Category Structure Recommendation untuk Expense dengan Budget System

Rekomendasi struktur category expense yang optimal untuk sistem budget.

## 🎯 Prinsip Dasar

### 1. Category Granularity

**Balance antara detail dan simplicity:**

- ✅ **Cukup detail** untuk tracking budget yang meaningful
- ✅ **Tidak terlalu banyak** agar mudah manage
- ✅ **Consistent naming** untuk kemudahan

### 2. Budget per Category

Setiap category expense sebaiknya punya budget sendiri karena:
- Lebih akurat tracking
- Mudah identify category mana yang over budget
- Better control pengeluaran

## 📊 Rekomendasi Struktur Category

### Struktur 1: Main Categories (Recommended untuk Start) ✅

**5-8 main categories** yang cover mayoritas expense:

```
Expense Categories:
├── 🍔 Makanan & Minuman
│   └── Budget: Rp 2.000.000/bulan
├── 🚗 Transport
│   └── Budget: Rp 1.500.000/bulan
├── 🏠 Kebutuhan Rumah
│   └── Budget: Rp 1.000.000/bulan
├── 🛒 Belanja
│   └── Budget: Rp 1.500.000/bulan
├── 🎮 Hiburan
│   └── Budget: Rp 500.000/bulan
├── 💊 Kesehatan
│   └── Budget: Rp 500.000/bulan
├── 📚 Pendidikan
│   └── Budget: Rp 1.000.000/bulan
└── 📝 Lainnya
    └── Budget: Rp 500.000/bulan (optional)
```

**Keuntungan:**
- ✅ Simple dan mudah di-manage
- ✅ Cukup untuk tracking budget utama
- ✅ Tidak overwhelming untuk user baru

### Struktur 2: Detailed Categories (Untuk User yang Lebih Detail)

**10-15 categories** dengan breakdown lebih detail:

```
Expense Categories:
├── 🍔 Makanan & Minuman
│   ├── Makan Siang
│   ├── Makan Malam
│   ├── Snack & Minuman
│   └── Groceries
├── 🚗 Transport
│   ├── Bensin
│   ├── Parkir
│   ├── Transport Online (Gojek/Grab)
│   └── Maintenance
├── 🏠 Kebutuhan Rumah
│   ├── Listrik & Air
│   ├── Internet & TV
│   ├── Perabotan
│   └── Perawatan Rumah
├── 🛒 Belanja
│   ├── Pakaian
│   ├── Elektronik
│   └── Kebutuhan Harian
├── 🎮 Hiburan
│   ├── Film & Streaming
│   ├── Game
│   └── Hobby
├── 💊 Kesehatan
│   ├── Obat-obatan
│   ├── Check-up
│   └── Gym/Fitness
├── 📚 Pendidikan
│   ├── Kursus
│   ├── Buku
│   └── Alat Tulis
└── 📝 Lainnya
    └── (untuk expense yang tidak masuk kategori)
```

**Keuntungan:**
- ✅ Lebih detail tracking
- ✅ Budget lebih spesifik
- ✅ Better insights

**Kekurangan:**
- ⚠️ Lebih banyak category untuk manage
- ⚠️ Bisa overwhelming untuk user baru

## 🎨 Best Practices untuk Category Naming

### 1. Gunakan Nama yang Jelas dan Deskriptif

✅ **Good:**
- "Makanan & Minuman"
- "Transport"
- "Kebutuhan Rumah"

❌ **Bad:**
- "Cat1"
- "Expense 1"
- "Misc"

### 2. Konsisten dengan Icon & Color

Setiap category sebaiknya punya:
- **Icon**: Untuk visual identification
- **Color**: Untuk consistency di UI

Contoh:
- 🍔 Makanan & Minuman (Orange)
- 🚗 Transport (Blue)
- 🏠 Kebutuhan Rumah (Green)

### 3. Hindari Overlap

Pastikan categories tidak overlap:
- ❌ "Makanan" dan "Makan Siang" (overlap)
- ✅ "Makanan & Minuman" dan "Transport" (clear separation)

## 💰 Budget Allocation Strategy

### 1. Start dengan Historical Data

Lihat pengeluaran 3 bulan terakhir untuk set budget yang realistic:

```sql
-- Query untuk melihat average expense per category
SELECT 
    c.name,
    AVG(monthly_total) as avg_monthly
FROM (
    SELECT 
        category_id,
        EXTRACT(MONTH FROM date) as month,
        EXTRACT(YEAR FROM date) as year,
        SUM(amount) as monthly_total
    FROM transactions
    WHERE user_id = $1 
        AND transaction_type = 'expense'
        AND date >= NOW() - INTERVAL '3 months'
    GROUP BY category_id, month, year
) monthly
JOIN categories c ON monthly.category_id = c.id
GROUP BY c.name;
```

### 2. 50/30/20 Rule (Optional)

Untuk total budget, bisa apply 50/30/20 rule:
- **50%**: Needs (Makanan, Transport, Kebutuhan Rumah)
- **30%**: Wants (Hiburan, Belanja)
- **20%**: Savings & Others

### 3. Priority-based Budget

Set budget lebih besar untuk:
- ✅ **Needs** (Makanan, Transport, Kebutuhan Rumah)
- ✅ **Important** (Kesehatan, Pendidikan)
- ⚠️ **Wants** (Hiburan) - bisa lebih kecil

## 🔄 Category Management Workflow

### 1. Initial Setup

Saat user pertama kali setup:
1. **Create default categories** (bisa dari system atau user create sendiri)
2. **Set initial budget** berdasarkan:
   - Historical data (jika ada)
   - User input
   - Recommended budget (optional)

### 2. Monthly Budget Setup

Setiap awal bulan:
1. **Review budget bulan sebelumnya**
2. **Adjust budget** jika perlu
3. **Copy budget** dari bulan sebelumnya (optional feature)

### 3. Category Adjustment

User bisa:
- ✅ Add new category
- ✅ Edit category name/icon/color
- ✅ Delete category (dengan handling untuk existing transactions)
- ✅ Merge categories (advanced feature)

## 📱 UI/UX Recommendations

### Category Selection

**Dropdown dengan grouping:**
```
Expense Categories:
├── 🍔 Makanan & Minuman
├── 🚗 Transport
├── 🏠 Kebutuhan Rumah
├── 🛒 Belanja
├── 🎮 Hiburan
├── 💊 Kesehatan
├── 📚 Pendidikan
└── 📝 Lainnya
```

### Budget Display

**Card per category dengan:**
- Category name & icon
- Budget amount
- Used amount
- Remaining amount
- Progress bar
- Alert indicator (jika over budget atau near threshold)

## 🚀 Implementation Recommendations

### 1. Default Categories

Saat user register, create default categories:

```rust
// Default expense categories
let default_categories = vec![
    ("Makanan & Minuman", "🍔", "orange", "expense"),
    ("Transport", "🚗", "blue", "expense"),
    ("Kebutuhan Rumah", "🏠", "green", "expense"),
    ("Belanja", "🛒", "purple", "expense"),
    ("Hiburan", "🎮", "pink", "expense"),
    ("Kesehatan", "💊", "red", "expense"),
    ("Pendidikan", "📚", "yellow", "expense"),
    ("Lainnya", "📝", "gray", "expense"),
];
```

### 2. Category Validation

Saat create transaction:
- ✅ Validate category exists
- ✅ Validate category type matches transaction type
- ✅ Suggest category based on description (future: AI/ML)

### 3. Budget Integration

Saat create expense transaction:
1. Check if budget exists for category
2. Calculate new usage
3. Check if over budget or near threshold
4. Trigger alert if needed

## 📊 Example Category Structure untuk Database

```sql
-- Default categories (user_id = NULL)
INSERT INTO categories (id, user_id, name, icon, color, category_type) VALUES
    (uuid_generate_v4(), NULL, 'Makanan & Minuman', '🍔', 'orange', 'expense'),
    (uuid_generate_v4(), NULL, 'Transport', '🚗', 'blue', 'expense'),
    (uuid_generate_v4(), NULL, 'Kebutuhan Rumah', '🏠', 'green', 'expense'),
    (uuid_generate_v4(), NULL, 'Belanja', '🛒', 'purple', 'expense'),
    (uuid_generate_v4(), NULL, 'Hiburan', '🎮', 'pink', 'expense'),
    (uuid_generate_v4(), NULL, 'Kesehatan', '💊', 'red', 'expense'),
    (uuid_generate_v4(), NULL, 'Pendidikan', '📚', 'yellow', 'expense'),
    (uuid_generate_v4(), NULL, 'Lainnya', '📝', 'gray', 'expense');
```

## 🎯 Kesimpulan & Rekomendasi

### Untuk Start (MVP):
✅ **5-8 main categories** sudah cukup
✅ **Budget per category** untuk tracking detail
✅ **Default categories** untuk kemudahan user

### Untuk Scale:
✅ User bisa **add custom categories**
✅ **Sub-categories** (optional, bisa via naming atau parent_id)
✅ **Category templates** untuk different use cases

### Struktur Category yang Recommended:

```
1. Makanan & Minuman (🍔)
2. Transport (🚗)
3. Kebutuhan Rumah (🏠)
4. Belanja (🛒)
5. Hiburan (🎮)
6. Kesehatan (💊)
7. Pendidikan (📚)
8. Lainnya (📝)
```

**Dengan budget per category**, user bisa:
- Track pengeluaran per kategori
- Set limit per kategori
- Get alerts saat budget hampir habis
- Better control pengeluaran


