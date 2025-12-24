# 📱 WhatsApp Integration Design - FinTrack AI

Dokumen ini menjelaskan arsitektur dan implementasi untuk integrasi WhatsApp dengan FinTrack AI, termasuk analisis pesan menggunakan Cursor Cloud Agent API.

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Autentikasi & Keamanan](#autentikasi--keamanan)
4. [Identifikasi User dari WhatsApp](#identifikasi-user-dari-whatsapp)
5. [Integrasi Cursor Cloud Agent API](#integrasi-cursor-cloud-agent-api)
6. [Flow Transaksi dari WhatsApp](#flow-transaksi-dari-whatsapp)
7. [Keamanan & Isolasi Data](#keamanan--isolasi-data)

---

## Overview

Sistem ini memungkinkan user untuk membuat transaksi income dan expense melalui WhatsApp. AI akan menganalisis pesan menggunakan Cursor Cloud Agent API untuk mengekstrak informasi transaksi.

### Fitur Utama:
- ✅ User dapat mengirim pesan transaksi via WhatsApp
- ✅ AI menganalisis pesan menggunakan Cursor Cloud Agent API
- ✅ Transaksi otomatis dibuat di sistem
- ✅ Isolasi data antar user (tidak ada kebocoran chat)

---

## Arsitektur Sistem

```
┌─────────────┐
│   WhatsApp  │
│    User     │
└──────┬──────┘
       │ Pesan: "Beli makan siang 50rb"
       ▼
┌─────────────────────────────────────┐
│      wa-service (Node.js)          │
│  ┌───────────────────────────────┐ │
│  │  WhatsApp Message Handler     │ │
│  │  - Terima pesan masuk         │ │
│  │  - Extract phone number       │ │
│  │  - Map phone → user_id        │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Cursor Cloud Agent Service   │ │
│  │  - Analisis pesan             │ │
│  │  - Extract transaction data   │ │
│  └───────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │ HTTP Request dengan JWT
               ▼
┌─────────────────────────────────────┐
│   Backend API (Rust/Axum)           │
│  ┌───────────────────────────────┐ │
│  │  JWT Verification             │ │
│  │  - Verify token dari backend  │ │
│  │  - Extract user_id           │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Transaction Handler           │ │
│  │  - Create transaction          │ │
│  │  - Update wallet balance      │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Autentikasi & Keamanan

### ❓ Pertanyaan 2: Token untuk wa-service

**Jawaban: Gunakan JWT yang sama dari backend**

#### Alasan:
1. **Single Source of Truth**: Satu JWT secret untuk semua service
2. **Konsistensi**: User yang login di frontend bisa langsung pakai token yang sama
3. **Keamanan**: Tidak perlu manage multiple token systems
4. **Simplifikasi**: Backend sudah punya JWT verification yang robust

#### Implementasi:

**wa-service** akan:
- Menggunakan `JWT_SECRET` yang sama dengan backend
- Verify JWT token dari backend
- Extract `user_id` dari JWT claims (field `sub`)

**Backend JWT Structure:**
```rust
Claims {
    sub: Uuid,      // user_id
    email: String,
    exp: i64,       // expiration
    iat: i64,       // issued at
}
```

**wa-service akan verify token:**
```typescript
// wa-service/src/middleware/auth.middleware.ts
const decoded = jwt.verify(token, config.jwt.secret) as { 
  sub: string,      // user_id (UUID)
  email: string,
  exp: number,
  iat: number
};
```

---

## Identifikasi User dari WhatsApp

### ❓ Pertanyaan 3: Bagaimana mengetahui chat dari user A?

**Solusi: Mapping Phone Number → User ID**

#### Database Schema:

Tambahkan tabel `user_whatsapp_mapping`:

```sql
CREATE TABLE user_whatsapp_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR(6),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_user_phone UNIQUE (user_id, phone_number)
);

CREATE INDEX idx_phone_number ON user_whatsapp_mappings(phone_number);
CREATE INDEX idx_user_id ON user_whatsapp_mappings(user_id);
```

#### Flow Verifikasi:

1. **User mendaftarkan nomor WhatsApp:**
   - User login di frontend
   - Input nomor WhatsApp
   - Backend generate verification code
   - Backend kirim code via WhatsApp (dari wa-service)

2. **User verifikasi:**
   - User kirim code via WhatsApp
   - wa-service terima code
   - Backend verify dan link phone → user_id

3. **Pesan masuk dari WhatsApp:**
   - wa-service terima pesan
   - Extract phone number dari `msg.key.remoteJid`
   - Query mapping: `phone_number → user_id`
   - Jika tidak ada mapping → ignore atau kirim instruksi verifikasi

#### Keamanan:

✅ **Isolasi Data:**
- Setiap pesan hanya diproses untuk user yang terverifikasi
- Query transaction selalu filter by `user_id`
- Tidak ada data leakage antar user

✅ **Validasi:**
- Hanya user yang terverifikasi bisa membuat transaksi
- Phone number harus unique per user
- Verifikasi code expired setelah 10 menit

---

## Integrasi Cursor Cloud Agent API

### ❓ Pertanyaan 1: Analisis pesan dengan Cursor Cloud Agent API

#### Flow:

1. **Pesan masuk dari WhatsApp:**
   ```
   User: "Beli makan siang 50rb di warung padang"
   ```

2. **wa-service memanggil Cursor Cloud Agent API:**
   ```typescript
   POST https://api.cursor.sh/v1/chat/completions
   Headers: {
     Authorization: "Bearer CURSOR_API_KEY",
     Content-Type: "application/json"
   }
   Body: {
     model: "gpt-4",
     messages: [
       {
         role: "system",
         content: "You are a financial transaction parser. Extract transaction details from user messages in Indonesian."
       },
       {
         role: "user",
         content: "Beli makan siang 50rb di warung padang"
       }
     ],
     functions: [transactionExtractionFunction]
   }
   ```

3. **AI Response:**
   ```json
   {
     "type": "EXPENSE",
     "amount": 50000,
     "category": "Food & Dining",
     "description": "Beli makan siang di warung padang",
     "date": "2024-01-15"
   }
   ```

4. **wa-service kirim ke Backend:**
   ```typescript
   POST /api/transactions
   Headers: {
     Authorization: "Bearer <JWT_TOKEN>"
   }
   Body: {
     type: "EXPENSE",
     amount: 50000,
     category_id: "...",
     description: "Beli makan siang di warung padang",
     wallet_id: "<default_wallet_id>"
   }
   ```

#### Implementation:

**wa-service/src/services/ai/cursor-agent.service.ts:**
```typescript
export class CursorAgentService {
  async analyzeTransaction(message: string): Promise<TransactionData> {
    // Call Cursor Cloud Agent API
    // Parse response
    // Return structured transaction data
  }
}
```

---

## Flow Transaksi dari WhatsApp

### Complete Flow:

```
1. User kirim pesan via WhatsApp
   ↓
2. wa-service terima pesan
   ↓
3. Extract phone number dari pesan
   ↓
4. Query user_whatsapp_mappings untuk mendapatkan user_id
   ↓
5. Jika user_id tidak ditemukan:
   → Kirim pesan: "Nomor WhatsApp belum terdaftar. Silakan verifikasi di aplikasi."
   → STOP
   ↓
6. Jika user_id ditemukan:
   → Panggil Cursor Cloud Agent API untuk analisis
   ↓
7. AI menganalisis pesan dan extract transaction data
   ↓
8. wa-service dapatkan JWT token untuk user tersebut
   (dari cache atau generate service token)
   ↓
9. wa-service kirim request ke Backend API:
   POST /api/transactions
   Headers: { Authorization: Bearer <JWT> }
   Body: { transaction data dari AI }
   ↓
10. Backend verify JWT dan create transaction
   ↓
11. Backend kirim response ke wa-service
   ↓
12. wa-service kirim konfirmasi ke user via WhatsApp:
    "✅ Transaksi berhasil dibuat:
     - Tipe: Expense
     - Jumlah: Rp 50.000
     - Kategori: Food & Dining
     - Deskripsi: Beli makan siang di warung padang"
```

---

## Keamanan & Isolasi Data

### ✅ Measures yang Diimplementasikan:

1. **JWT Verification:**
   - wa-service verify JWT dari backend
   - Token harus valid dan tidak expired
   - user_id di-extract dari JWT claims

2. **Phone Number Mapping:**
   - Phone number harus terverifikasi
   - Mapping phone → user_id di database
   - Tidak ada pesan yang diproses tanpa mapping

3. **Transaction Isolation:**
   - Setiap transaction selalu filter by user_id
   - Backend API verify user_id dari JWT
   - Tidak ada transaksi yang bisa dibuat untuk user lain

4. **Error Handling:**
   - Jika phone tidak terdaftar → ignore pesan
   - Jika AI gagal parse → kirim pesan error ke user
   - Jika backend error → log dan notify user

### 🔒 Security Checklist:

- [x] JWT verification di wa-service
- [x] Phone number verification required
- [x] User isolation di database queries
- [x] Rate limiting untuk prevent abuse
- [x] Input validation untuk semua data
- [x] Error messages tidak expose sensitive info

---

## Environment Variables

### Backend (.env):
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=postgres://...
```

### wa-service (.env):
```env
# JWT - harus sama dengan backend
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cursor Cloud Agent API
CURSOR_API_KEY=your-cursor-api-key
CURSOR_API_URL=https://api.cursor.sh/v1

# Backend API
BACKEND_API_URL=http://localhost:7000
BACKEND_API_KEY=optional-service-to-service-key

# Database (untuk query user_whatsapp_mappings)
DATABASE_URL=postgres://...
```

---

## Next Steps

1. ✅ Buat migration untuk `user_whatsapp_mappings` table
2. ✅ Update wa-service auth middleware untuk verify JWT dari backend
3. ✅ Implementasi phone number mapping service
4. ✅ Implementasi Cursor Cloud Agent API integration
5. ✅ Implementasi WhatsApp message handler untuk incoming messages
6. ✅ Implementasi transaction creation flow
7. ✅ Testing & Security audit

---

**Last Updated:** 2024-01-15

