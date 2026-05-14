import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'password', type: 'varchar', length: '255' },
          { name: 'firstName', type: 'varchar', length: '255' },
          { name: 'lastName', type: 'varchar', length: '255' },
          { name: 'phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'profileImage', type: 'varchar', length: '255', isNullable: true },
          { name: 'role', type: 'varchar', length: '50', default: "'user'" },
          { name: 'emailVerified', type: 'boolean', default: false },
          { name: 'emailVerificationToken', type: 'varchar', length: '255', isNullable: true },
          { name: 'passwordResetToken', type: 'varchar', length: '255', isNullable: true },
          { name: 'passwordResetExpires', type: 'timestamp', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'kycStatus', type: 'varchar', length: '50', isNullable: true },
          { name: 'kycDocuments', type: 'text', isNullable: true },
          { name: 'preferences', type: 'json', default: "'{}'" },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'lastLogin', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    // Deriv accounts table
    await queryRunner.createTable(
      new Table({
        name: 'deriv_accounts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'accountId', type: 'varchar', length: '255', isUnique: true },
          { name: 'accountName', type: 'varchar', length: '255' },
          { name: 'accountType', type: 'varchar', length: '100' },
          { name: 'encryptedToken', type: 'varchar', length: '255', isNullable: true },
          { name: 'currency', type: 'varchar', length: '20', isNullable: true },
          { name: 'balance', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'tradingExperience', type: 'varchar', length: '50', isNullable: true },
          { name: 'settings', type: 'json', default: "'{}'" },
          { name: 'isDefault', type: 'boolean', default: false },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'lastSyncedAt', type: 'timestamp', isNullable: true },
          { name: 'connectionStatus', type: 'varchar', length: '50', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Foreign key for deriv_accounts
    await queryRunner.createForeignKey(
      'deriv_accounts',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Subscriptions table
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'planType', type: 'varchar', length: '50' },
          { name: 'monthlyPrice', type: 'numeric', precision: 10, scale: 2, default: 0 },
          { name: 'status', type: 'varchar', length: '50', default: "'active'" },
          { name: 'startDate', type: 'timestamp' },
          { name: 'endDate', type: 'timestamp' },
          { name: 'stripeSubscriptionId', type: 'varchar', length: '255', isNullable: true },
          { name: 'mpesaTransactionId', type: 'varchar', length: '255', isNullable: true },
          { name: 'maxBots', type: 'integer', default: 0 },
          { name: 'maxLiveAccounts', type: 'integer', default: 0 },
          { name: 'hasAIFeatures', type: 'boolean', default: false },
          { name: 'hasTelegramIntegration', type: 'boolean', default: false },
          { name: 'backTestingCredits', type: 'integer', default: 0 },
          { name: 'featureAccess', type: 'json', default: "'{}'" },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Foreign key for subscriptions
    await queryRunner.createForeignKey(
      'subscriptions',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Transactions table
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'type', type: 'varchar', length: '50' },
          { name: 'amount', type: 'numeric', precision: 15, scale: 2 },
          { name: 'currency', type: 'varchar', length: '20' },
          { name: 'status', type: 'varchar', length: '50', default: "'pending'" },
          { name: 'paymentMethod', type: 'varchar', length: '255', isNullable: true },
          { name: 'transactionId', type: 'varchar', length: '255', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'metadata', type: 'json', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Foreign key for transactions
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Risk settings table
    await queryRunner.createTable(
      new Table({
        name: 'risk_settings',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'maxDailyLoss', type: 'numeric', precision: 10, scale: 2 },
          { name: 'maxConsecutiveLosses', type: 'numeric', precision: 10, scale: 2 },
          { name: 'maxStake', type: 'numeric', precision: 10, scale: 2 },
          { name: 'minStake', type: 'numeric', precision: 10, scale: 2 },
          { name: 'stopLossPercentage', type: 'numeric', precision: 5, scale: 2 },
          { name: 'takeProfitPercentage', type: 'numeric', precision: 5, scale: 2 },
          { name: 'maxTradesPerDay', type: 'integer' },
          { name: 'sessionTimeoutMinutes', type: 'integer', isNullable: true },
          { name: 'maxDrawdownPercentage', type: 'numeric', precision: 5, scale: 2 },
          { name: 'enableStopLoss', type: 'boolean', default: true },
          { name: 'enableTakeProfit', type: 'boolean', default: true },
          { name: 'customRules', type: 'json', default: "'{}'" },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Foreign key for risk_settings
    await queryRunner.createForeignKey(
      'risk_settings',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'type', type: 'varchar', length: '100' },
          { name: 'title', type: 'varchar', length: '255' },
          { name: 'message', type: 'text' },
          { name: 'isRead', type: 'boolean', default: false },
          { name: 'priority', type: 'varchar', length: '50', isNullable: true },
          { name: 'data', type: 'json', isNullable: true },
          { name: 'sentToTelegram', type: 'boolean', default: false },
          { name: 'sentToEmail', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Foreign key for notifications
    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Strategy configs table (no foreign keys)
    await queryRunner.createTable(
      new Table({
        name: 'strategy_configs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'strategyType', type: 'varchar', length: '100' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'parameters', type: 'json' },
          { name: 'backTestResults', type: 'json', isNullable: true },
          { name: 'isPublic', type: 'boolean', default: false },
          { name: 'averageWinRate', type: 'numeric', precision: 5, scale: 2, default: 0 },
          { name: 'totalBacktests', type: 'integer', default: 0 },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Analytics logs table (no foreign keys)
    await queryRunner.createTable(
      new Table({
        name: 'analytics_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'varchar', length: '255', isNullable: true },
          { name: 'eventType', type: 'varchar', length: '100' },
          { name: 'action', type: 'varchar', length: '100' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'metadata', type: 'json', isNullable: true },
          { name: 'status', type: 'varchar', length: '50', isNullable: true },
          { name: 'errorMessage', type: 'text', isNullable: true },
          { name: 'ipAddress', type: 'varchar', length: '50', isNullable: true },
          { name: 'userAgent', type: 'varchar', length: '255', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Bots table (depends on users and deriv_accounts)
    await queryRunner.createTable(
      new Table({
        name: 'bots',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'userId', type: 'uuid' },
          { name: 'derivAccountId', type: 'uuid' },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'status', type: 'varchar', length: '50', default: "'inactive'" },
          { name: 'strategyType', type: 'varchar', length: '100' },
          { name: 'strategyConfig', type: 'json' },
          { name: 'marketType', type: 'varchar', length: '100' },
          { name: 'symbol', type: 'varchar', length: '100', isNullable: true },
          { name: 'initialStake', type: 'numeric', precision: 10, scale: 2 },
          { name: 'initialCapital', type: 'numeric', precision: 10, scale: 2, default: 0 },
          { name: 'currentCapital', type: 'numeric', precision: 10, scale: 2, default: 0 },
          { name: 'maxDailyLoss', type: 'numeric', precision: 10, scale: 2 },
          { name: 'maxConsecutiveLoss', type: 'numeric', precision: 10, scale: 2 },
          { name: 'maxOpenTrades', type: 'integer', default: 5 },
          { name: 'consecutiveLosses', type: 'integer', default: 0 },
          { name: 'totalTrades', type: 'integer', default: 0 },
          { name: 'winTrades', type: 'integer', default: 0 },
          { name: 'lossTrades', type: 'integer', default: 0 },
          { name: 'totalPnL', type: 'numeric', precision: 15, scale: 2, default: 0 },
          { name: 'winRate', type: 'numeric', precision: 5, scale: 2, default: 0 },
          { name: 'isPaperTradingMode', type: 'boolean', default: false },
          { name: 'isAutoRestart', type: 'boolean', default: true },
          { name: 'maxRunTimeMinutes', type: 'integer', default: 5 },
          { name: 'startTime', type: 'timestamp', isNullable: true },
          { name: 'endTime', type: 'timestamp', isNullable: true },
          { name: 'riskSettings', type: 'json', default: "'{}'" },
          { name: 'logs', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Foreign keys for bots
    await queryRunner.createForeignKey(
      'bots',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'bots',
      new TableForeignKey({
        columnNames: ['derivAccountId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'deriv_accounts',
        onDelete: 'CASCADE',
      }),
    );

    // Create index for bots
    await queryRunner.createIndex(
      'bots',
      new TableIndex({
        columnNames: ['userId', 'status'],
        name: 'idx_bots_user_status',
      }),
    );

    // Trades table (depends on deriv_accounts and bots)
    await queryRunner.createTable(
      new Table({
        name: 'trades',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'derivAccountId', type: 'uuid' },
          { name: 'botId', type: 'uuid', isNullable: true },
          { name: 'contractId', type: 'varchar', length: '255', isUnique: true },
          { name: 'marketType', type: 'varchar', length: '100' },
          { name: 'symbol', type: 'varchar', length: '100', isNullable: true },
          { name: 'contractType', type: 'varchar', length: '50' },
          { name: 'stake', type: 'numeric', precision: 10, scale: 2 },
          { name: 'tradeType', type: 'varchar', length: '50' },
          { name: 'status', type: 'varchar', length: '50', default: "'open'" },
          { name: 'entryPrice', type: 'numeric', precision: 10, scale: 2, isNullable: true },
          { name: 'exitPrice', type: 'numeric', precision: 10, scale: 2, isNullable: true },
          { name: 'profit', type: 'numeric', precision: 10, scale: 2, isNullable: true },
          { name: 'pnl', type: 'numeric', precision: 10, scale: 2, isNullable: true },
          { name: 'profitPercentage', type: 'numeric', precision: 5, scale: 2, isNullable: true },
          { name: 'durationMinutes', type: 'integer', isNullable: true },
          { name: 'openTime', type: 'timestamp' },
          { name: 'openedAt', type: 'timestamp', isNullable: true },
          { name: 'closeTime', type: 'timestamp', isNullable: true },
          { name: 'closedAt', type: 'timestamp', isNullable: true },
          { name: 'derivResponse', type: 'json', isNullable: true },
          { name: 'metadata', type: 'json', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Foreign key for trades
    await queryRunner.createForeignKey(
      'trades',
      new TableForeignKey({
        columnNames: ['derivAccountId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'deriv_accounts',
        onDelete: 'CASCADE',
      }),
    );

    // Create indices for trades
    await queryRunner.createIndex(
      'trades',
      new TableIndex({
        columnNames: ['derivAccountId', 'status'],
        name: 'idx_trades_account_status',
      }),
    );

    await queryRunner.createIndex(
      'trades',
      new TableIndex({
        columnNames: ['botId', 'status'],
        name: 'idx_trades_bot_status',
      }),
    );

    // Create index for risk_settings
    await queryRunner.createIndex(
      'risk_settings',
      new TableIndex({
        columnNames: ['userId'],
        name: 'idx_risk_settings_user',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all tables in reverse order of creation
    await queryRunner.dropIndex('risk_settings', 'idx_risk_settings_user');
    await queryRunner.dropIndex('trades', 'idx_trades_bot_status');
    await queryRunner.dropIndex('trades', 'idx_trades_account_status');
    await queryRunner.dropIndex('bots', 'idx_bots_user_status');
    
    await queryRunner.dropTable('trades');
    await queryRunner.dropTable('bots');
    await queryRunner.dropTable('analytics_logs');
    await queryRunner.dropTable('strategy_configs');
    await queryRunner.dropTable('notifications');
    await queryRunner.dropTable('risk_settings');
    await queryRunner.dropTable('transactions');
    await queryRunner.dropTable('subscriptions');
    await queryRunner.dropTable('deriv_accounts');
    await queryRunner.dropTable('users');
  }
}
