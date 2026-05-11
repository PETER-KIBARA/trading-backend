import { createApp, initializeDatabase, startServer } from './app.js';
import { logger } from './utils/logger.js';

// Trading Platform v1.0.0
async function main(): Promise<void> {
  try {
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
