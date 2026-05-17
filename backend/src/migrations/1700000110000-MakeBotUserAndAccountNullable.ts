import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeBotUserAndAccountNullable1700000110000 implements MigrationInterface {
  name = 'MakeBotUserAndAccountNullable1700000110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure all required columns exist
    const table = await queryRunner.getTable('bots');
    
    // Ensure columns exist before modifying
    const requiredColumns = ['initialCapital', 'currentCapital', 'maxOpenTrades', 'winTrades', 'lossTrades', 'totalPnL'];
    for (const colName of requiredColumns) {
      if (!table?.columns.some(col => col.name === colName)) {
        console.log(`[MIGRATION] Adding missing column: ${colName}`);
        try {
          if (colName === 'initialCapital' || colName === 'currentCapital' || colName === 'totalPnL') {
            await queryRunner.addColumn('bots', new TableColumn({
              name: colName,
              type: 'numeric',
              precision: colName === 'totalPnL' ? 15 : 10,
              scale: 2,
              default: 0,
              isNullable: true,
            }));
          } else {
            await queryRunner.addColumn('bots', new TableColumn({
              name: colName,
              type: 'integer',
              default: 0,
              isNullable: true,
            }));
          }
        } catch (e) {
          console.log(`[MIGRATION] Column ${colName} add failed (might already exist)`);
        }
      }
    }

    // Modify userId column to be nullable
    try {
      await queryRunner.changeColumn(
        'bots',
        'userId',
        new TableColumn({
          name: 'userId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    } catch (e) {
      console.log('[MIGRATION] userId changeColumn failed (might already be nullable)');
    }

    // Modify derivAccountId column to be nullable
    try {
      await queryRunner.changeColumn(
        'bots',
        'derivAccountId',
        new TableColumn({
          name: 'derivAccountId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    } catch (e) {
      console.log('[MIGRATION] derivAccountId changeColumn failed (might already be nullable)');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert userId to not nullable
    await queryRunner.changeColumn(
      'bots',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Revert derivAccountId to not nullable
    await queryRunner.changeColumn(
      'bots',
      'derivAccountId',
      new TableColumn({
        name: 'derivAccountId',
        type: 'uuid',
        isNullable: false,
      }),
    );
  }
}
