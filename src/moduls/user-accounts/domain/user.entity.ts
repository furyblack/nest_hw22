import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Blog } from '../../blog-platform/blogs/domain/blog.enity';
import { Post } from '../../blog-platform/posts/domain/post.entity';
import { Comment } from '../../blog-platform/comments/domain/comment.entity';
import { Session } from './session.entity';

export enum DeletionStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  login: string;

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ name: 'is_email_confirmed', default: false })
  isEmailConfirmed: boolean;

  /** 🔗 User → Blogs */
  @OneToMany(() => Blog, (blog) => blog.owner)
  blogs: Blog[];

  /** 🔗 User → Posts */
  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  /** 🔗 User → Comments */
  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  /** 🔗 User → Sessions */
  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @Column({
    name: 'deletion_status',
    type: 'enum',
    enum: DeletionStatus,
    default: DeletionStatus.ACTIVE,
  })
  deletionStatus: DeletionStatus;

  @Column({ name: 'confirmation_code', nullable: true })
  confirmationCode: string | null;

  @Column({
    name: 'confirmation_code_expiration',
    type: 'timestamptz',
    nullable: true,
  })
  confirmationCodeExpiration: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
