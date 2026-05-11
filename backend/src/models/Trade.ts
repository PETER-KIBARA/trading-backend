import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DerivAccount } from './DerivAccount.js';

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  derivAccountId!: string;

  @Column({ type: 'uuid', nullable: true })
  botId?: string; // Reference to bot if trade was executed by a bot

  @Column({ type: 'varchar', length: 255, unique: true })
  contractId!: string; // Deriv contract ID

  @Column({ type: 'varchar', length: 100 })
  marketType!: 'volatility' | 'boom_crash' | 'forex' | 'synthetic';

  @Column({ type: 'varchar', length: 100, nullable: true })
  symbol?: string;

  @Column({ type: 'varchar', length: 50 })
  contractType!: string; // CALL, PUT, EVEN, ODD, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  stake!: number;

  @Column({ type: 'varchar', length: 50 })
  tradeType!: 'manual' | 'bot' | 'ai_suggestion';

  @Column({ type: 'varchar', length: 50, default: 'open' })
  status!: 'open' | 'closed' | 'won' | 'lost' | 'cancelled';

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  entryPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  exitPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  profit?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pnl?: number; // Profit/Loss

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  profitPercentage?: number;

  @Column({ type: 'integer', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'timestamp' })
  openTime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  openedAt?: Date; // Alias for openTime

  @Column({ type: 'timestamp', nullable: true })
  closeTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date; // Alias for closeTime

  @Column({ type: 'json', nullable: true })
  derivResponse?: Record<string, any>; // Response from Deriv API

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => DerivAccount, (account) => account.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'derivAccountId' })
  derivAccount!: DerivAccount;
}
