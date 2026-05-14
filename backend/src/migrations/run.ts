import { AppDataSource } from '../config/database.js';
import { logger } from '../utils/logger.js';

async function runMigrations(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const migrations = await AppDataSource.runMigrations({ transaction: 'all' });
    logger.info(`Migrations executed successfully`, { count: migrations.length });

    await AppDataSource.destroy();
  } catch (error) {
    logger.error('Migration execution failed', error);
    process.exit(1);
  }
}

// Only run migrations if this file is executed directly, not imported
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[MIGRATIONS] Running migrations directly...');
  runMigrations();
} else {
  console.log('[MIGRATIONS] This module is imported, not executing migrations');
}