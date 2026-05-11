import { DataSource } from 'typeorm';

// Lazy load entities to avoid circular import issues in ESM
let entities: any[] | null = null;

async function getEntities() {
  if (entities) return entities;

  const [
    { User },
    { DerivAccount },
    { Bot },
    { Trade },
    { Subscription },
    { Transaction },
    { Notification },
    { RiskSettings },
    { StrategyConfig },
    { AnalyticsLog },
  ] = await Promise.all([
    import('../models/User.js'),
    import('../models/DerivAccount.js'),
    import('../models/Bot.js'),
    import('../models/Trade.js'),
    import('../models/Subscription.js'),
    import('../models/Transaction.js'),
    import('../models/Notification.js'),
    import('../models/RiskSettings.js'),
    import('../models/StrategyConfig.js'),
    import('../models/AnalyticsLog.js'),
  ]);

  entities = [
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
  ];

  return entities;
}

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
  entities: [],
  migrations: ['dist/migrations/**/*.js'],
  subscribers: [],
});

// Initialize entities after DataSource is created
export async function initializeEntities() {
  const loadedEntities = await getEntities();
  AppDataSource.setOptions({ entities: loadedEntities });
  return loadedEntities;
}
