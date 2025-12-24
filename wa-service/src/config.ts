import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  apiKey: {
    key: process.env.API_KEY || 'your-api-key-change-in-production',
  },
  rateLimit: {
    perMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60', 10),
  },
  whatsapp: {
    authPath: process.env.WHATSAPP_AUTH_PATH || './data/auth',
  },
  cursor: {
    apiKey: process.env.CURSOR_API_KEY || '',
    apiUrl: process.env.CURSOR_API_URL || 'https://api.cursor.sh/v1',
  },
  backend: {
    apiUrl: process.env.BACKEND_API_URL || 'http://localhost:7000',
    apiKey: process.env.BACKEND_API_KEY || undefined,
  },
};

