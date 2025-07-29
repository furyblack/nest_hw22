import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('likes')
export class Likes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'character varying', nullable: false })
  user_login: string;

  @Column({ type: 'uuid', nullable: false })
  entity_id: string;

  @Column({ type: 'character varying', nullable: false })
  entity_type: string;

  @Column({ type: 'character varying' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;
}
