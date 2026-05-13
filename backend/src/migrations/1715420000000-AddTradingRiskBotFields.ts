import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTradingRiskBotFields1715420000000 implements MigrationInterface {
  name = 'AddTradingRiskBotFields1715420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "bots"
      ADD COLUMN IF NOT EXISTS "initialCapital" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "currentCapital" numeric(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "maxOpenTrades" integer NOT NULL DEFAULT 5,
      ADD COLUMN IF NOT EXISTS "winTrades" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lossTrades" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "totalPnL" numeric(15,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "trades"
      ADD COLUMN IF NOT EXISTS "botId" uuid,
      ADD COLUMN IF NOT EXISTS "pnl" numeric(10,2),
      ADD COLUMN IF NOT EXISTS "openedAt" timestamp,
      ADD COLUMN IF NOT EXISTS "closedAt" timestamp,
      ADD COLUMN IF NOT EXISTS "derivResponse" json
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "risk_settings"
      ADD COLUMN IF NOT EXISTS "enableStopLoss" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "enableTakeProfit" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "customRules" json NOT NULL DEFAULT '{}'::json
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bots_user_status" ON "bots" ("userId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_trades_account_status" ON "trades" ("derivAccountId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_trades_bot_status" ON "trades" ("botId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_risk_settings_user" ON "risk_settings" ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_risk_settings_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_trades_bot_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_trades_account_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_bots_user_status"`);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "risk_settings"
      DROP COLUMN IF EXISTS "customRules",
      DROP COLUMN IF EXISTS "enableTakeProfit",
      DROP COLUMN IF EXISTS "enableStopLoss"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "trades"
      DROP COLUMN IF EXISTS "derivResponse",
      DROP COLUMN IF EXISTS "closedAt",
      DROP COLUMN IF EXISTS "openedAt",
      DROP COLUMN IF EXISTS "pnl",
      DROP COLUMN IF EXISTS "botId"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS "bots"
      DROP COLUMN IF EXISTS "totalPnL",
      DROP COLUMN IF EXISTS "lossTrades",
      DROP COLUMN IF EXISTS "winTrades",
      DROP COLUMN IF EXISTS "maxOpenTrades",
      DROP COLUMN IF EXISTS "currentCapital",
      DROP COLUMN IF EXISTS "initialCapital"
    `);
  }
}