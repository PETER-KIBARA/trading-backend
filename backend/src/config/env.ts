import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  // Server
  PORT: parseInt(process.env.PORT || '5000'),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  API_URL: process.env.API_URL || 'http://localhost:5000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Database
  DB: {
    URL: process.env.DATABASE_URL,
    HOST: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
    NAME: process.env.DB_NAME || process.env.PGDATABASE || 'trading_platform',
    USER: process.env.DB_USER || process.env.PGUSER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
    SSL: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
  },

  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production',
    EXPIRY: process.env.JWT_EXPIRY || '7d',
    REFRESH_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your_super_secret_refresh_token_key',
    REFRESH_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '30d',
  },

  // Deriv API
  DERIV: {
    API_URL: process.env.DERIV_API_URL || 'wss://ws.derivws.com/websockets/v3',
    APP_ID: process.env.DERIV_APP_ID || 'your_deriv_app_id',
    CLIENT_ID: process.env.DERIV_CLIENT_ID || process.env.DERIV_APP_ID || 'your_deriv_app_id',
    CLIENT_SECRET: process.env.DERIV_CLIENT_SECRET || '',
    TOKEN_URL: process.env.DERIV_TOKEN_URL || 'https://auth.deriv.com/oauth2/token',
  },

  // Encryption
  ENCRYPTION: {
    KEY: process.env.ENCRYPTION_KEY || 'default32characterhexkeyforencrypt',
    IV: process.env.ENCRYPTION_IV || 'default16charhex',
  },

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'your_session_secret_key',

  // Third-party
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  
  // Email
  SMTP: {
    HOST: process.env.SMTP_HOST,
    PORT: parseInt(process.env.SMTP_PORT || '587'),
    USER: process.env.SMTP_USER,
    PASSWORD: process.env.SMTP_PASSWORD,
  },

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
