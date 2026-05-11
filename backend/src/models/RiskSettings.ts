import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.js';

@Entity('risk_settings')
export class RiskSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxDailyLoss!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxConsecutiveLosses!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maxStake!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  minStake!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  stopLossPercentage!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  takeProfitPercentage!: number;

  @Column({ type: 'integer' })
  maxTradesPerDay!: number;

  @Column({ type: 'integer', nullable: true })
  sessionTimeoutMinutes?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  maxDrawdownPercentage!: number;

  @Column({ type: 'boolean', default: true })
  enableStopLoss!: boolean;

  @Column({ type: 'boolean', default: true })
  enableTakeProfit!: boolean;

  @Column({ type: 'json', default: () => "'{}'" })
  customRules!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.riskSettings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
