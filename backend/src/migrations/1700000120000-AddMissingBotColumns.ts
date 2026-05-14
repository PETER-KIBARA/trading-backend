import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingBotColumns1700000120000 implements MigrationInterface {
  name = 'AddMissingBotColumns1700000120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if isTemplate column exists, if not add it
    const hasIsTemplate = await queryRunner.hasColumn('bots', 'isTemplate');
    if (!hasIsTemplate) {
      await queryRunner.query(`
        ALTER TABLE "bots"
        ADD COLUMN "isTemplate" boolean NOT NULL DEFAULT false
      `);
      console.log('[MIGRATION] Added isTemplate column to bots table');
    }

    // Check if userId column is nullable (should be for templates)
    const userIdColumn = await queryRunner.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bots' AND column_name = 'userId'
    `);

    if (userIdColumn.length > 0 && userIdColumn[0].is_nullable === 'NO') {
      await queryRunner.query(`
        ALTER TABLE "bots"
        ALTER COLUMN "userId" DROP NOT NULL
      `);
      console.log('[MIGRATION] Made userId nullable in bots table');
    }

    // Check if derivAccountId column is nullable (should be for templates)
    const derivAccountIdColumn = await queryRunner.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bots' AND column_name = 'derivAccountId'
    `);

    if (derivAccountIdColumn.length > 0 && derivAccountIdColumn[0].is_nullable === 'NO') {
      await queryRunner.query(`
        ALTER TABLE "bots"
        ALTER COLUMN "derivAccountId" DROP NOT NULL
      `);
      console.log('[MIGRATION] Made derivAccountId nullable in bots table');
    }

    // Create index on isTemplate if it doesn't exist
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_bots_template" ON "bots" ("isTemplate")
    `);

    console.log('[MIGRATION] Template support migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bots_template"`);

    // Remove isTemplate column
    const hasIsTemplate = await queryRunner.hasColumn('bots', 'isTemplate');
    if (hasIsTemplate) {
      await queryRunner.query(`
        ALTER TABLE "bots"
        DROP COLUMN "isTemplate"
      `);
    }

    // Make userId not nullable again
    await queryRunner.query(`
      ALTER TABLE "bots"
      ALTER COLUMN "userId" SET NOT NULL
    `);

    // Make derivAccountId not nullable again
    await queryRunner.query(`
      ALTER TABLE "bots"
      ALTER COLUMN "derivAccountId" SET NOT NULL
    `);
  }
}
