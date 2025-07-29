import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../../posts/domain/post.entity';
import { User } from '../../../user-accounts/domain/user.entity';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  website: string;

  @Column({ default: false })
  isEmailConfirmed: boolean;

  /** 🔗 Blog → User */
  @ManyToOne(() => User, (user) => user.blogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  owner: User;

  @Column({ type: 'uuid', nullable: true })
  user_id: string;

  /** 🔗 Blog → Posts */
  @OneToMany(() => Post, (post) => post.blog)
  posts: Post[];
}
