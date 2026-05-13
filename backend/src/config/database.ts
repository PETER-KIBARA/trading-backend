import { DataSource } from 'typeorm';
import { User } from '../models/User.js';
import { DerivAccount } from '../models/DerivAccount.js';
import { Bot } from '../models/Bot.js';
import { Trade } from '../models/Trade.js';
import { Subscription } from '../models/Subscription.js';
import { Transaction } from '../models/Transaction.js';
import { Notification } from '../models/Notification.js';
import { RiskSettings } from '../models/RiskSettings.js';
import { StrategyConfig } from '../models/StrategyConfig.js';
import { AnalyticsLog } from '../models/AnalyticsLog.js';

const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const connectionOptions = process.env.DATABASE_URL
  ? {
      url: process.env.DATABASE_URL,
    }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
      username: process.env.DB_USER || process.env.PGUSER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'trading_platform',
    };

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connectionOptions,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    DerivAccount,
    Bot,
    Trade,
    Subscription,
    Transaction,
    Notification,
    RiskSettings,
    StrategyConfig,
    AnalyticsLog,
  ],
  migrations: ['dist/migrations/**/*.js'],
  subscribers: [],
});
