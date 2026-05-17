import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBotTemplateSupport1700000100000 implements MigrationInterface {
  name = 'AddBotTemplateSupport1700000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add template flag to bots table
    const hasIsTemplate = await queryRunner.hasColumn('bots', 'isTemplate');
    if (!hasIsTemplate) {
      await queryRunner.addColumn(
        'bots',
        new TableColumn({
          name: 'isTemplate',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );
    }

    // Add index for templates
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_bots_template" ON "bots" ("isTemplate")
    `);

    // Note: Template bots will be inserted by InsertBotTemplates migration
    // after userId and derivAccountId columns are made nullable
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete template bots
    await queryRunner.query(`DELETE FROM "bots" WHERE "isTemplate" = true`);
    
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bots_template"`);
    
    // Remove template column
    await queryRunner.dropColumn('bots', 'isTemplate');
  }
}
