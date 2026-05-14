import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('bots')
export class Bot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', nullable: true })
  derivAccountId?: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'inactive' })
  status!: 'active' | 'inactive' | 'paused' | 'error';

  @Column({ type: 'varchar', length: 100 })
  strategyType!: 'rsi' | 'macd' | 'ma-crossover' | 'bollinger-bands' | 'candlestick';

  @Column({ type: 'json' })
  strategyConfig!: Record<string, any>;

  @Column({ type: 'varchar', length: 100 })
  marketType!: 'volatility' | 'boom_crash' | 'forex' | 'synthetic';

  @Column({ type: 'varchar', length: 100, nullable: true })
  symbol?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  initialStake!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  initialCapital!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentCapital!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxDailyLoss!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxConsecutiveLoss!: number;

  @Column({ type: 'integer', default: 5 })
  maxOpenTrades!: number;

  @Column({ type: 'integer', default: 0 })
  consecutiveLosses!: number;

  @Column({ type: 'integer', default: 0 })
  totalTrades!: number;

  @Column({ type: 'integer', default: 0 })
  winTrades!: number;

  @Column({ type: 'integer', default: 0 })
  lossTrades!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPnL!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  winRate!: number;

  @Column({ type: 'boolean', default: false })
  isPaperTradingMode!: boolean;

  @Column({ type: 'boolean', default: false })
  isTemplate!: boolean;

  @Column({ type: 'boolean', default: true })
  isAutoRestart!: boolean;

  @Column({ type: 'integer', default: 5 })
  maxRunTimeMinutes!: number;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ type: 'json', default: () => "'{}'" })
  riskSettings!: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  logs?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations (using string targets to avoid circular dependencies)
  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: any;

  @ManyToOne('DerivAccount', (account: any) => account.bots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'derivAccountId' })
  derivAccount!: any;
}
