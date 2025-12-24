# 💰 Wallet Selection Design - WhatsApp Integration

Dokumen ini menjelaskan bagaimana sistem menangani pemilihan wallet saat user membuat transaksi via WhatsApp.

## 🎯 Tujuan

Memberikan UX yang baik untuk pemilihan wallet dengan beberapa strategi:
1. **Auto-select** jika hanya 1 wallet atau user specify di pesan
2. **Tanya user** jika ada multiple wallets (meskipun ada default wallet)
3. **Support user specify** wallet di pesan (contoh: "dari bank", "pakai cash")

**Important:** Default wallet hanya auto-select jika user hanya punya 1 wallet. Jika lebih dari 1 wallet, selalu tanya user untuk memilih.

---

## 📋 Flow Diagram

```
User kirim: "Beli makan 50rb"
    ↓
AI Extract: { type: EXPENSE, amount: 50000, description: "Beli makan" }
    ↓
Check Wallets:
    ├─ 1 wallet? → Auto-select ✅
    ├─ User specify wallet di pesan? → Match & use ✅
    ├─ Ada default wallet? → Use default ✅
    └─ Multiple wallets, no default? → Tanya user ❓
        ↓
User reply: "1" atau "bank"
    ↓
Create transaction dengan wallet yang dipilih ✅
```

---

## 🔄 Scenarios

### Scenario 1: Single Wallet
**User:** "Beli makan 50rb"
**System:** Auto-select wallet (hanya 1 wallet)
**Result:** ✅ Transaksi langsung dibuat

### Scenario 2: User Specify Wallet di Pesan
**User:** "Beli makan 50rb dari bank"
**System:** AI extract `walletName: "bank"` → Match dengan wallet "Bank BCA"
**Result:** ✅ Transaksi dibuat dengan wallet "Bank BCA"

### Scenario 3: Multiple Wallets, Ada Default
**User:** "Beli makan 50rb"
**System:** 
- Ada 3 wallets: Cash (default), Bank BCA, E-Wallet
- Meskipun ada default wallet, tetap tanya user untuk konfirmasi
**Bot:** 
```
💰 Pilih wallet untuk transaksi ini:

1. Cash (Default)
2. Bank BCA
3. E-Wallet

Balas dengan nomor (1, 2, 3...) atau nama wallet.
```
**User:** "1" atau "Cash"
**Result:** ✅ Transaksi dibuat dengan Cash

### Scenario 3 & 4: Multiple Wallets (Dengan atau Tanpa Default)
**User:** "Beli makan 50rb"
**System:**
- Ada 3 wallets: Cash (default), Bank BCA, E-Wallet
- Meskipun ada default wallet, tetap tanya user untuk pilih
**Bot:** 
```
💰 Pilih wallet untuk transaksi ini:

1. Cash (Default)
2. Bank BCA
3. E-Wallet

Balas dengan nomor (1, 2, 3...) atau nama wallet.
```

**User:** "1" atau "Cash"
**System:** ✅ Transaksi dibuat dengan Cash

**Note:** Default wallet hanya auto-select jika user hanya punya 1 wallet. Jika lebih dari 1 wallet, selalu tanya user untuk memilih (meskipun ada default wallet).

---

## 🛠️ Implementation

### 1. AI Extract Wallet Name

AI akan extract wallet name dari pesan jika disebutkan:

**Examples:**
- "Beli makan 50rb dari bank" → `walletName: "bank"`
- "Beli makan 50rb pakai cash" → `walletName: "cash"`
- "Beli makan 50rb dari e-wallet" → `walletName: "e-wallet"`

**System Prompt:**
```
Extract wallet name if mentioned (e.g., "dari bank", "dari cash", "pakai e-wallet", etc.)
```

### 2. Wallet Matching

Fuzzy matching untuk find wallet:
1. **Exact match:** "bank" → "Bank BCA" ✅
2. **Partial match:** "bank" → "Bank BCA" ✅
3. **Type match:** "cash" → wallet_type = "cash" ✅

### 3. Wallet Selection State

Sistem menyimpan state sementara saat user memilih wallet:

```typescript
interface WalletSelectionState {
  userId: string;
  phoneNumber: string;
  transactionData: TransactionData;
  jwtToken: string;
  timestamp: number;
}
```

**Timeout:** 5 menit (auto cleanup)

### 4. User Response Parsing

User bisa reply dengan:
- **Number:** "1", "2", "3" → Select by index
- **Name:** "bank", "cash" → Match by name

---

## 📝 Code Structure

### Services

1. **`wallet-selection.service.ts`**
   - Check if user needs to select wallet
   - Store/retrieve pending selection state
   - Process user selection response
   - Format wallet list untuk display

2. **`transaction.service.ts`** (updated)
   - `getUserWallets()` - Get all wallets
   - `findWalletByName()` - Fuzzy match wallet
   - `createTransaction()` - Support wallet_id parameter

3. **`cursor-agent.service.ts`** (updated)
   - Extract `walletName` dari pesan
   - Return dalam `TransactionData`

### Flow in WhatsApp Service

```typescript
// 1. Check if user sedang memilih wallet
if (pendingSelection) {
  processWalletSelection();
  return;
}

// 2. Analyze message
const analysis = await ai.analyzeTransaction(message);

// 3. Check wallet selection
const walletCheck = await walletSelectionService.checkWalletSelection(...);

if (walletCheck.needsSelection) {
  // Store state & ask user
  walletSelectionService.storePendingSelection(...);
  sendMessage(formatWalletList(wallets));
  return;
}

// 4. Create transaction
createTransaction(..., walletCheck.selectedWalletId);
```

---

## 🎨 User Experience

### Best Case (No Interaction)
```
User: "Beli makan 50rb dari bank"
Bot: "✅ Transaksi berhasil dibuat! ..."
```

### Need Selection
```
User: "Beli makan 50rb"
Bot: "💰 Pilih wallet untuk transaksi ini:

1. Cash (Default)
2. Bank BCA
3. E-Wallet

Balas dengan nomor (1, 2, 3...) atau nama wallet."

User: "2"
Bot: "✅ Transaksi berhasil dibuat! ..."
```

### Error Handling
```
User: "Beli makan 50rb"
Bot: "💰 Pilih wallet..."

User: "5" (invalid)
Bot: "❌ Invalid wallet selection. Please choose a number or wallet name."
```

---

## 🔒 Security & Validation

1. **State Expiry:** 5 menit timeout
2. **User Validation:** Hanya user yang terverifikasi bisa pilih wallet
3. **Wallet Ownership:** Hanya wallet milik user yang bisa dipilih
4. **Input Validation:** Validate user response sebelum create transaction

---

## 📊 Decision Tree

```
User kirim pesan transaksi
    ↓
AI Extract transaction data
    ↓
Get user wallets
    ↓
┌─────────────────────────────────────┐
│ Wallets count?                      │
├─────────────────────────────────────┤
│ 0 → Error: No wallet                │
│ 1 → Auto-select ✅                  │
│ >1 → Continue...                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ User specify wallet di pesan?       │
├─────────────────────────────────────┤
│ Yes → Match & use ✅                 │
│ No → Ask user ❓                    │
└─────────────────────────────────────┘
```

**Note:** Default wallet hanya auto-select jika user hanya punya 1 wallet. Jika lebih dari 1 wallet, selalu tanya user untuk memilih (meskipun ada default wallet).

---

## 🚀 Future Enhancements

1. **Remember Last Wallet:** Cache wallet terakhir yang dipakai user
2. **Smart Default:** AI suggest wallet berdasarkan transaction type
3. **Quick Reply Buttons:** WhatsApp quick reply untuk pilih wallet
4. **Wallet Aliases:** User bisa set alias (contoh: "dompet" = "Cash")

---

**Last Updated:** 2024-01-15

