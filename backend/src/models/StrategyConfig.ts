import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('strategy_configs')
export class StrategyConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  strategyType!: 'rsi' | 'macd' | 'moving_average' | 'candlestick' | 'last_digit' | 'martingale' | 'anti_martingale' | 'custom';

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json' })
  parameters!: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  backTestResults?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageWinRate!: number;

  @Column({ type: 'integer', default: 0 })
  totalBacktests!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
