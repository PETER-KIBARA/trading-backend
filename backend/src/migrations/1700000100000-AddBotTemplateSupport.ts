import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBotTemplateSupport1700000100000 implements MigrationInterface {
  name = 'AddBotTemplateSupport1700000100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add template flag to bots table
    await queryRunner.addColumn(
      'bots',
      new TableColumn({
        name: 'isTemplate',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );

    // Add index for templates
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_bots_template" ON "bots" ("isTemplate")
    `);

    // Insert 10 template bots
    await queryRunner.query(`
      INSERT INTO "bots" (
        "userId", "derivAccountId", "name", "description", "status", "strategyType", 
        "strategyConfig", "marketType", "symbol", "initialStake", "maxDailyLoss", 
        "maxConsecutiveLoss", "maxOpenTrades", "isPaperTradingMode", "isTemplate", "createdAt", "updatedAt"
      ) VALUES
      -- RSI Strategy
      (NULL, NULL, 'RSI Breakout - Conservative', 'Conservative RSI-based strategy targeting overbought/oversold levels', 'inactive', 'rsi', 
       '{"period":14,"overbought":70,"oversold":30,"signal":"crossover"}', 'volatility', NULL, 5.00, 50.00, 30.00, 5, true, true, NOW(), NOW()),
      
      -- MACD Strategy
      (NULL, NULL, 'MACD Momentum', 'Fast-moving MACD strategy for trend following', 'inactive', 'macd', 
       '{"fastPeriod":12,"slowPeriod":26,"signalPeriod":9,"threshold":0.5}', 'volatility', NULL, 10.00, 75.00, 40.00, 7, true, true, NOW(), NOW()),
      
      -- Moving Average Crossover
      (NULL, NULL, 'MA Golden Cross', 'Classic moving average crossover strategy', 'inactive', 'ma-crossover', 
       '{"fastMA":20,"slowMA":50,"source":"close"}', 'boom_crash', NULL, 3.00, 30.00, 20.00, 3, true, true, NOW(), NOW()),
      
      -- Bollinger Bands
      (NULL, NULL, 'Bollinger Bounce', 'Mean reversion using Bollinger Bands', 'inactive', 'bollinger-bands', 
       '{"period":20,"stdDev":2,"strength":"medium"}', 'volatility', NULL, 7.50, 60.00, 35.00, 6, true, true, NOW(), NOW()),
      
      -- Candlestick Pattern
      (NULL, NULL, 'Candlestick Patterns', 'Based on reversal and continuation patterns', 'inactive', 'candlestick', 
       '{"patterns":["hammer","engulfing","doji"],"reliability":"medium"}', 'forex', NULL, 15.00, 100.00, 50.00, 8, true, true, NOW(), NOW()),
      
      -- Aggressive RSI
      (NULL, NULL, 'RSI Aggressive', 'Aggressive RSI with tight stops and frequent signals', 'inactive', 'rsi', 
       '{"period":14,"overbought":75,"oversold":25,"signal":"extreme"}', 'volatility', NULL, 15.00, 100.00, 60.00, 10, true, true, NOW(), NOW()),
      
      -- Safe MACD
      (NULL, NULL, 'MACD Conservative', 'Low-risk MACD with wider stop losses', 'inactive', 'macd', 
       '{"fastPeriod":12,"slowPeriod":26,"signalPeriod":9,"threshold":1.0}', 'synthetic', NULL, 2.50, 25.00, 15.00, 2, true, true, NOW(), NOW()),
      
      -- Fast MA
      (NULL, NULL, 'MA Scalper', 'Fast moving average strategy for quick trades', 'inactive', 'ma-crossover', 
       '{"fastMA":5,"slowMA":15,"source":"close"}', 'boom_crash', NULL, 1.00, 15.00, 10.00, 5, true, true, NOW(), NOW()),
      
      -- Volatility Play
      (NULL, NULL, 'Bollinger Squeeze', 'Capitalizes on volatility expansion after band squeeze', 'inactive', 'bollinger-bands', 
       '{"period":20,"stdDev":2.5,"strength":"high"}', 'volatility', NULL, 12.00, 80.00, 45.00, 8, true, true, NOW(), NOW()),
      
      -- Classic Candlestick
      (NULL, NULL, 'Reversal Patterns', 'Focus on reversal patterns with support/resistance', 'inactive', 'candlestick', 
       '{"patterns":["morningstar","eveningstar","pinbar"],"reliability":"high"}', 'forex', NULL, 20.00, 120.00, 70.00, 10, true, true, NOW(), NOW())
    `);
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
