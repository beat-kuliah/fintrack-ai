# 📱 WhatsApp Service

WhatsApp Service menggunakan Baileys untuk mengirim pesan WhatsApp melalui API REST.

## 🚀 Fitur

- ✅ Mengirim pesan WhatsApp (single & bulk)
- ✅ Template system dengan variable replacement
- ✅ Queue system dengan retry mechanism
- ✅ Rate limiting
- ✅ JWT & API Key authentication
- ✅ Connection management dengan auto-reconnect
- ✅ QR Code untuk koneksi WhatsApp
- ✅ Comprehensive logging

## 📋 Prerequisites

- Node.js >= 18.x
- Redis (untuk queue system)
- PostgreSQL (untuk database)
- npm atau yarn

## 🛠️ Installation

1. Clone repository:
```bash
git clone <repository-url>
cd wa-service
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

Edit `.env` file dengan konfigurasi yang sesuai.

4. Setup database:
```bash
# Pastikan DATABASE_URL sudah di-set di .env file
# Format: postgresql://user:password@localhost:5432/wa_service?schema=public

# Generate Prisma client
npx prisma generate

# Run migrations (akan membuat database jika belum ada)
npx prisma migrate dev --name init
```

**Note:** Pastikan PostgreSQL sudah running dan database sudah dibuat sebelum menjalankan migrate.

5. Build project:
```bash
npm run build
```

6. Start server:
```bash
npm start
```

Untuk development dengan hot reload:
```bash
npm run dev
```

## ⚙️ Configuration

Environment variables yang diperlukan (lihat `.env.example`):

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# API Key
API_KEY=your-api-key-change-in-production

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# Logging
LOG_LEVEL=info
```

## 📚 API Documentation

Lihat [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) untuk dokumentasi lengkap API.

## 🔌 WhatsApp Connection

1. Start server
2. Server akan otomatis generate QR code saat pertama kali connect
3. Scan QR code dengan WhatsApp mobile app
4. Setelah terhubung, QR code tidak akan muncul lagi

Untuk mendapatkan QR code via API:
```bash
curl -X GET http://localhost:3000/api/whatsapp/qr \
  -H "X-API-Key: your-api-key"
```

## 📝 Usage Examples

### Send Message

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

### Get WhatsApp Status

```bash
curl -X GET http://localhost:3000/api/whatsapp/status
```

Lihat [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) untuk contoh lengkap.

## 🏗️ Project Structure

```
wa-service/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   │   ├── whatsapp/      # WhatsApp service (Baileys)
│   │   ├── queue/         # Message queue
│   │   └── trigger/       # Trigger system
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utilities
│   ├── app.ts             # Express app setup
│   ├── config.ts          # Configuration
│   ├── types.ts           # TypeScript types
│   └── index.ts           # Entry point
├── data/
│   └── auth/              # Baileys auth data (auto-generated)
├── API_DOCUMENTATION.md   # API documentation
└── README.md              # This file
```

## 🔒 Security

- JWT authentication untuk user endpoints
- API Key authentication untuk service-to-service
- Helmet untuk security headers
- CORS enabled
- Input validation

## 🧪 Testing

```bash
# Run linter
npm run lint

# Format code
npm run format
```

## 📦 Dependencies

### Core
- **@whiskeysockets/baileys** - WhatsApp Web API
- **express** - Web framework
- **bullmq** - Queue system
- **ioredis** - Redis client
- **@prisma/client** - Database ORM

### Utilities
- **pino** - Logging
- **jsonwebtoken** - JWT authentication
- **helmet** - Security headers
- **cors** - CORS middleware

## 🐛 Troubleshooting

### Prisma Schema Error
Jika mendapatkan error "Could not find Prisma Schema":
```bash
# Pastikan file prisma/schema.prisma sudah ada
# Jika belum, buat folder prisma dan file schema.prisma
mkdir -p prisma
# File schema.prisma sudah dibuat di repository
```

### Prisma Client Error
Jika mendapatkan error "@prisma/client did not initialize yet":
```bash
# Generate Prisma client
npx prisma generate
```

### Database Connection Error
1. Pastikan PostgreSQL sudah running
2. Check DATABASE_URL di `.env` file
3. Pastikan database sudah dibuat:
```bash
createdb wa_service  # atau gunakan psql
```

### WhatsApp tidak terhubung
1. Pastikan QR code sudah di-scan
2. Check log untuk error messages
3. Coba reconnect via API: `POST /api/whatsapp/reconnect`

### Message tidak terkirim
1. Check WhatsApp connection status: `GET /api/whatsapp/status`
2. Check message status: `GET /api/messages/status/:id`
3. Check Redis connection
4. Check logs untuk error details

### Redis connection error
1. Pastikan Redis server running
2. Check Redis host/port di `.env`
3. Jika Redis tidak menggunakan password, pastikan `REDIS_PASSWORD` di `.env` kosong atau tidak di-set
4. Jika Redis menggunakan password, pastikan `REDIS_PASSWORD` di `.env` sesuai

**Error "NOAUTH Authentication required":**
- Jika Redis tidak memerlukan password, pastikan `REDIS_PASSWORD` tidak di-set atau kosong di `.env`
- Jika Redis memerlukan password, pastikan `REDIS_PASSWORD` di-set dengan benar

### Port already in use error
Jika mendapatkan error "EADDRINUSE: address already in use":
```bash
# Kill process di port 3000
lsof -ti:3000 | xargs kill -9

# Atau gunakan port lain dengan mengubah PORT di .env
PORT=3001
```

### ES Module Warning (Baileys)
Warning tentang ES Module dengan Baileys adalah normal dan tidak akan menghentikan aplikasi. Ini karena Baileys menggunakan ES Modules sementara project menggunakan CommonJS. Warning ini tidak mempengaruhi fungsionalitas aplikasi.

## 📄 License

ISC

## 🤝 Contributing

Pull requests are welcome. Untuk perubahan besar, silakan buat issue terlebih dahulu.

## 📞 Support

Untuk pertanyaan atau issue, silakan buat issue di repository.

---

**Made with ❤️ using Baileys**

