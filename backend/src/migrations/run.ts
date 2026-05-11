import { AppDataSource, initializeEntities } from '../config/database.js';
import { logger } from '../utils/logger.js';

async function runMigrations(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await initializeEntities();
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

runMigrations();