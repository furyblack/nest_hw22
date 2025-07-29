import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  ip: string;

  @Column()
  title: string;

  @Column({ type: 'timestamptz' })
  last_active_date: Date;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  device_id: string;
}
