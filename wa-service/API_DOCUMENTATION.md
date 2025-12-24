# 📚 WhatsApp Service API Documentation

API dokumentasi lengkap untuk WhatsApp Service menggunakan Baileys.

## 📋 Daftar Isi

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [WhatsApp Status](#whatsapp-status)
  - [Messages](#messages)
  - [Templates](#templates)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Base URL

```
http://localhost:3000/api
```

---

## Authentication

Service ini menggunakan dua jenis autentikasi:

### 1. JWT Token (untuk user endpoints)

**Header:**
```
Authorization: Bearer <jwt_token>
```

### 2. API Key (untuk service-to-service)

**Header:**
```
X-API-Key: <api_key>
```

---

## Endpoints

### WhatsApp Status

#### Get WhatsApp Connection Status

Mendapatkan status koneksi WhatsApp.

**Endpoint:** `GET /api/whatsapp/status`

**Authentication:** Tidak diperlukan

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "state": "connected",
    "hasQR": false
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Internal server error

---

#### Get QR Code

Mendapatkan QR code untuk koneksi WhatsApp (jika belum terhubung).

**Endpoint:** `GET /api/whatsapp/qr`

**Authentication:** API Key required

**Headers:**
```
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "expiresIn": 60
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid API key)
- `404` - QR code not available (already connected)
- `500` - Internal server error

---

#### Reconnect WhatsApp

Memaksa reconnect WhatsApp secara manual.

**Endpoint:** `POST /api/whatsapp/reconnect`

**Authentication:** API Key required

**Headers:**
```
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "message": "Reconnection initiated"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error

---

### Messages

#### Send Single Message

Mengirim pesan WhatsApp tunggal.

**Endpoint:** `POST /api/messages/send`

**Authentication:** JWT Token required

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "phoneNumber": "081234567890",
  "message": "Hello, this is a test message",
  "userId": "user-123",
  "templateId": "template-123"
}
```

**Parameters:**
- `phoneNumber` (required) - Nomor telepon penerima (format: 081234567890 atau +6281234567890)
- `message` (required) - Isi pesan yang akan dikirim
- `userId` (optional) - ID user pengirim
- `templateId` (optional) - ID template yang digunakan

**Response:**
```json
{
  "success": true,
  "message": "Message queued for sending",
  "data": {
    "id": "msg-123",
    "status": "PENDING"
  }
}
```

**Status Codes:**
- `202` - Accepted (message queued)
- `400` - Bad request (missing required fields)
- `401` - Unauthorized
- `500` - Internal server error

---

#### Send Bulk Messages

Mengirim pesan WhatsApp dalam jumlah banyak.

**Endpoint:** `POST /api/messages/send-bulk`

**Authentication:** JWT Token required

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "messages": [
    {
      "phoneNumber": "081234567890",
      "message": "Hello User 1",
      "userId": "user-123",
      "templateId": "template-123"
    },
    {
      "phoneNumber": "081987654321",
      "message": "Hello User 2",
      "userId": "user-123"
    }
  ]
}
```

**Parameters:**
- `messages` (required) - Array of message objects
  - `phoneNumber` (required) - Nomor telepon penerima
  - `message` (required) - Isi pesan
  - `userId` (optional) - ID user pengirim
  - `templateId` (optional) - ID template

**Response:**
```json
{
  "success": true,
  "message": "Bulk messages queued",
  "data": [
    {
      "phoneNumber": "081234567890",
      "success": true,
      "messageId": "msg-123"
    },
    {
      "phoneNumber": "081987654321",
      "success": true,
      "messageId": "msg-124"
    }
  ]
}
```

**Status Codes:**
- `202` - Accepted
- `400` - Bad request
- `401` - Unauthorized
- `500` - Internal server error

---

#### Get Message Status

Mendapatkan status dan detail pesan.

**Endpoint:** `GET /api/messages/status/:id`

**Authentication:** Tidak diperlukan

**Parameters:**
- `id` (path parameter) - ID pesan

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg-123",
    "userId": "user-123",
    "phoneNumber": "081234567890",
    "message": "Hello, this is a test message",
    "status": "SENT",
    "sentAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:29:55.000Z",
    "logs": [
      {
        "id": "log-123",
        "status": "SENT",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Message not found
- `500` - Internal server error

---

### Templates

#### Create Template

Membuat template pesan baru.

**Endpoint:** `POST /api/templates`

**Authentication:** JWT Token required

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "welcome-message",
  "content": "Hello {{name}}, welcome to our service! Your balance is {{balance}}.",
  "variables": ["name", "balance"],
  "description": "Welcome message template"
}
```

**Parameters:**
- `name` (required) - Nama template (unique)
- `content` (required) - Konten template dengan variable placeholders (format: `{{variableName}}`)
- `variables` (required) - Array nama variable yang digunakan
- `description` (optional) - Deskripsi template

**Response:**
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": {
    "id": "template-123",
    "name": "welcome-message",
    "content": "Hello {{name}}, welcome to our service! Your balance is {{balance}}.",
    "variables": ["name", "balance"],
    "description": "Welcome message template",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `409` - Conflict (template name already exists)
- `500` - Internal server error

---

#### Get All Templates

Mendapatkan daftar semua template.

**Endpoint:** `GET /api/templates`

**Authentication:** Tidak diperlukan

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "template-123",
      "name": "welcome-message",
      "content": "Hello {{name}}, welcome!",
      "variables": ["name"],
      "description": "Welcome message",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - Internal server error

---

#### Get Template by ID

Mendapatkan detail template berdasarkan ID.

**Endpoint:** `GET /api/templates/:id`

**Authentication:** Tidak diperlukan

**Parameters:**
- `id` (path parameter) - ID template

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "template-123",
    "name": "welcome-message",
    "content": "Hello {{name}}, welcome!",
    "variables": ["name"],
    "description": "Welcome message",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `404` - Template not found
- `500` - Internal server error

---

#### Update Template

Mengupdate template yang sudah ada.

**Endpoint:** `PUT /api/templates/:id`

**Authentication:** JWT Token required

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Parameters:**
- `id` (path parameter) - ID template

**Request Body:**
```json
{
  "name": "welcome-message-v2",
  "content": "Hello {{name}}, welcome to our service!",
  "variables": ["name"],
  "description": "Updated welcome message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template updated successfully",
  "data": {
    "id": "template-123",
    "name": "welcome-message-v2",
    "content": "Hello {{name}}, welcome to our service!",
    "variables": ["name"],
    "description": "Updated welcome message",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `404` - Template not found
- `500` - Internal server error

---

#### Delete Template

Menghapus template.

**Endpoint:** `DELETE /api/templates/:id`

**Authentication:** JWT Token required

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Parameters:**
- `id` (path parameter) - ID template

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `404` - Template not found
- `500` - Internal server error

---

## Error Handling

Semua error response mengikuti format berikut:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Common Error Codes

- `400` - Bad Request: Request body tidak valid atau missing required fields
- `401` - Unauthorized: Token atau API key tidak valid
- `404` - Not Found: Resource tidak ditemukan
- `409` - Conflict: Resource sudah ada (misalnya template name duplicate)
- `500` - Internal Server Error: Server error

---

## Examples

### Example 1: Send Message dengan cURL

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "081234567890",
    "message": "Hello from WhatsApp Service!",
    "userId": "user-123"
  }'
```

### Example 2: Send Bulk Messages dengan cURL

```bash
curl -X POST http://localhost:3000/api/messages/send-bulk \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "phoneNumber": "081234567890",
        "message": "Hello User 1"
      },
      {
        "phoneNumber": "081987654321",
        "message": "Hello User 2"
      }
    ]
  }'
```

### Example 3: Create Template dengan cURL

```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "transaction-notification",
    "content": "Transaction {{type}} of {{amount}} on {{date}}",
    "variables": ["type", "amount", "date"],
    "description": "Transaction notification template"
  }'
```

### Example 4: Get WhatsApp Status dengan cURL

```bash
curl -X GET http://localhost:3000/api/whatsapp/status
```

### Example 5: Get QR Code dengan cURL

```bash
curl -X GET http://localhost:3000/api/whatsapp/qr \
  -H "X-API-Key: your-api-key"
```

### Example 6: JavaScript/TypeScript (Fetch API)

```typescript
// Send message
const sendMessage = async () => {
  const response = await fetch('http://localhost:3000/api/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-jwt-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phoneNumber: '081234567890',
      message: 'Hello from WhatsApp Service!',
      userId: 'user-123',
    }),
  });

  const data = await response.json();
  console.log(data);
};

// Get WhatsApp status
const getStatus = async () => {
  const response = await fetch('http://localhost:3000/api/whatsapp/status');
  const data = await response.json();
  console.log(data);
};
```

### Example 7: Python (requests)

```python
import requests

# Send message
def send_message():
    url = "http://localhost:3000/api/messages/send"
    headers = {
        "Authorization": "Bearer your-jwt-token",
        "Content-Type": "application/json"
    }
    data = {
        "phoneNumber": "081234567890",
        "message": "Hello from WhatsApp Service!",
        "userId": "user-123"
    }
    
    response = requests.post(url, json=data, headers=headers)
    print(response.json())

# Get WhatsApp status
def get_status():
    url = "http://localhost:3000/api/whatsapp/status"
    response = requests.get(url)
    print(response.json())
```

---

## Notes

1. **Phone Number Format**: 
   - Format yang diterima: `081234567890`, `+6281234567890`, atau `6281234567890`
   - Service akan otomatis format ke format WhatsApp (62XXXXXXXXXX)

2. **Message Queue**: 
   - Pesan dikirim melalui queue system dengan retry mechanism
   - Status pesan: `PENDING` → `QUEUED` → `SENT` atau `FAILED`

3. **Rate Limiting**: 
   - Default: 60 pesan per menit
   - Dapat dikonfigurasi melalui environment variable `RATE_LIMIT_PER_MINUTE`

4. **Template Variables**: 
   - Format: `{{variableName}}`
   - Variable akan diganti dengan nilai dari data yang dikirim

5. **WhatsApp Connection**: 
   - QR code akan muncul saat pertama kali connect
   - Scan QR code dengan WhatsApp mobile app
   - Setelah terhubung, QR code tidak akan muncul lagi

---

## Support

Untuk pertanyaan atau issue, silakan hubungi tim development.

---

**Last Updated:** 2024-01-15

