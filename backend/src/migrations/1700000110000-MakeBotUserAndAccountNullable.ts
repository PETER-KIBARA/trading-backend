import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MakeBotUserAndAccountNullable1700000110000 implements MigrationInterface {
  name = 'MakeBotUserAndAccountNullable1700000110000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Modify userId column to be nullable
    await queryRunner.changeColumn(
      'bots',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Modify derivAccountId column to be nullable
    await queryRunner.changeColumn(
      'bots',
      'derivAccountId',
      new TableColumn({
        name: 'derivAccountId',
        type: 'uuid',
        isNullable: true,
      }),
    );
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
