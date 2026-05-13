import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profileImage?: string;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role!: 'user' | 'admin' | 'premium_user';

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires?: Date;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  kycStatus?: 'pending' | 'verified' | 'rejected';

  @Column({ type: 'text', nullable: true })
  kycDocuments?: string;

  @Column({ type: 'json', default: () => "'{}'" })
  preferences!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  // Relations (string-based to avoid circular dependencies)
  @OneToMany('DerivAccount', (account: any) => account.user, { cascade: true })
  derivAccounts!: any[];

  @OneToMany('Subscription', (sub: any) => sub.user, { cascade: true })
  subscriptions!: any[];

  @OneToMany('Notification', (notif: any) => notif.user, { cascade: true })
  notifications!: any[];

  @OneToMany('RiskSettings', (risk: any) => risk.user, { cascade: true })
  riskSettings!: any[];
}
