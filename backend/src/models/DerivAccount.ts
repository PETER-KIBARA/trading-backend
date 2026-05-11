import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './User.js';
import { Trade } from './Trade.js';

@Entity('deriv_accounts')
export class DerivAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  accountId!: string; // Deriv account ID

  @Column({ type: 'varchar', length: 255 })
  accountName!: string;

  @Column({ type: 'varchar', length: 100 })
  accountType!: 'real' | 'demo';

  @Column({ type: 'varchar', length: 255, nullable: true })
  encryptedToken!: string; // Encrypted API token

  @Column({ type: 'varchar', length: 20, nullable: true })
  currency!: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tradingExperience?: string;

  @Column({ type: 'json', default: () => "'{}'" })
  settings!: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  connectionStatus!: 'connected' | 'disconnected' | 'error';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations (string-based to avoid circular dependencies)
  @ManyToOne(() => User, (user) => user.derivAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany('Bot', (bot: any) => bot.derivAccount, { cascade: true })
  bots!: any[];

  @OneToMany('Trade', (trade: any) => trade.derivAccount, { cascade: true })
  trades!: any[];
}
