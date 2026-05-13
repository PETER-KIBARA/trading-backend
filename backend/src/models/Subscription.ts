import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  planType!: 'free' | 'premium' | 'pro' | 'enterprise';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyPrice!: number;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: 'active' | 'cancelled' | 'expired' | 'pending';

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  endDate!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mpesaTransactionId?: string;

  @Column({ type: 'integer', default: 0 })
  maxBots!: number;

  @Column({ type: 'integer', default: 0 })
  maxLiveAccounts!: number;

  @Column({ type: 'boolean', default: false })
  hasAIFeatures!: boolean;

  @Column({ type: 'boolean', default: false })
  hasTelegramIntegration!: boolean;

  @Column({ type: 'integer', default: 0 })
  backTestingCredits!: number;

  @Column({ type: 'json', default: () => "'{}'" })
  featureAccess!: Record<string, boolean>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne('User', (user: any) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: any;
}
