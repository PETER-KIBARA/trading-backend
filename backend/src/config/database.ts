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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'trading_platform',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
