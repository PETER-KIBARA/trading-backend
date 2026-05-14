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

// DEBUG: Track module loads to detect duplication
console.log('[DATABASE MODULE] Loaded - timestamp:', new Date().toISOString());
(globalThis as any).__db_module_count = ((globalThis as any).__db_module_count || 0) + 1;
console.log('[DATABASE MODULE] Instance count:', (globalThis as any).__db_module_count);

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
  poolSize: 10,
} as any);

// Track DataSource instance creation
(globalThis as any).__app_data_sources = (globalThis as any).__app_data_sources || [];
(globalThis as any).__app_data_sources.push({
  id: (globalThis as any).__app_data_sources.length + 1,
  timestamp: new Date().toISOString(),
  instance: AppDataSource,
});

console.log('[DATABASE DATASOURCE] Created instance #' + (globalThis as any).__app_data_sources.length);
if ((globalThis as any).__app_data_sources.length > 1) {
  console.warn('[DATABASE DATASOURCE] WARNING: Multiple DataSource instances detected!');
  console.warn('[DATABASE DATASOURCE] Instance history:', (globalThis as any).__app_data_sources.map((ds: any) => ({ id: ds.id, timestamp: ds.timestamp })));
}
