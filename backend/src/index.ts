import { createApp, initializeDatabase, startServer } from './app.js';
import { logger } from './utils/logger.js';
import { ENV } from './config/env.js';

// Trading Platform v1.0.0
async function main(): Promise<void> {
  try {
    // Validate critical environment variables
    if (!ENV.JWT.SECRET || ENV.JWT.SECRET.includes('your_super_secret')) {
      logger.warn('WARNING: JWT_SECRET not configured properly for production');
    }

    // Log database configuration (without passwords)
    logger.info('Database configuration loaded', {
      hasUrl: !!process.env.DATABASE_URL,
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      dbName: process.env.DB_NAME || process.env.PGDATABASE || 'trading_platform',
    });

    // Initialize database
    await initializeDatabase();

    // Create Express app
    const { app, server } = await createApp();

    // Start server
    await startServer(server);
  } catch (error) {
    logger.error('Application startup error', error);
    process.exit(1);
  }
}

main();
