import { createApp, initializeDatabase, startServer } from './app.js';
import { logger } from './utils/logger.js';
import { ENV } from './config/env.js';

// Trading Platform v1.0.0
async function main(): Promise<void> {
  try {
    console.log('[MAIN] Application starting...');
    console.log('[MAIN] NODE_ENV:', ENV.NODE_ENV);
    console.log('[MAIN] Database configuration loaded', {
      hasUrl: !!process.env.DATABASE_URL,
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      dbName: process.env.DB_NAME || process.env.PGDATABASE || 'trading_platform',
    });

    console.log('[MAIN] Step 1: Initialize database');
    // Initialize database
    await initializeDatabase();
    console.log('[MAIN] Step 1 COMPLETE: Database initialized');

    console.log('[MAIN] Step 2: Create Express app');
    // Create Express app
    const { app, server } = await createApp();
    console.log('[MAIN] Step 2 COMPLETE: Express app created');

    console.log('[MAIN] Step 3: Start server');
    // Start server
    await startServer(server);
    console.log('[MAIN] Step 3 COMPLETE: Server started');
  } catch (error) {
    console.error('[MAIN] FATAL ERROR:', error);
    logger.error('Application startup error', error);
    process.exit(1);
  }
}

console.log('[MAIN] Calling main()...');
main();
