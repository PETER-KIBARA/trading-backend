import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixBotSchemaForTemplates1700000130000 implements MigrationInterface {
  name = 'FixBotSchemaForTemplates1700000130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('[MIGRATION] Starting bot schema fix for templates...');

    // Step 1: Check and add isTemplate column if missing
    const tableColumns = await queryRunner.getTable('bots');
    const hasIsTemplateColumn = tableColumns?.columns.some(col => col.name === 'isTemplate');

    if (!hasIsTemplateColumn) {
      console.log('[MIGRATION] Adding isTemplate column...');
      await queryRunner.query(`
        ALTER TABLE "bots"
        ADD COLUMN "isTemplate" boolean NOT NULL DEFAULT false
      `);
    } else {
      console.log('[MIGRATION] isTemplate column already exists');
    }

    // Step 2: Make userId nullable
    console.log('[MIGRATION] Making userId nullable...');
    await queryRunner.query(`
      ALTER TABLE "bots"
      ALTER COLUMN "userId" DROP NOT NULL
    `);

    // Step 3: Make derivAccountId nullable
    console.log('[MIGRATION] Making derivAccountId nullable...');
    await queryRunner.query(`
      ALTER TABLE "bots"
      ALTER COLUMN "derivAccountId" DROP NOT NULL
    `);

    // Step 4: Create index on isTemplate
    console.log('[MIGRATION] Creating index on isTemplate...');
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_bots_template" ON "bots" ("isTemplate")
    `);

    console.log('[MIGRATION] Bot schema fix completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('[MIGRATION] Rolling back bot schema fix...');

    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bots_template"`);

    // Make fields not nullable
    await queryRunner.query(`
      ALTER TABLE "bots"
      ALTER COLUMN "userId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "bots"
      ALTER COLUMN "derivAccountId" SET NOT NULL
    `);

    // Drop isTemplate column
    const table = await queryRunner.getTable('bots');
    if (table?.columns.some(col => col.name === 'isTemplate')) {
      await queryRunner.query(`
        ALTER TABLE "bots"
        DROP COLUMN "isTemplate"
      `);
    }

    console.log('[MIGRATION] Rollback completed');
  }
}
