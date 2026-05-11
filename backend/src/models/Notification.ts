import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.js';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 100 })
  type!: 'trade_alert' | 'bot_alert' | 'risk_alert' | 'system_alert' | 'subscription_alert';

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @Column({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  sentToTelegram!: boolean;

  @Column({ type: 'boolean', default: false })
  sentToEmail!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
