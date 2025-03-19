import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import User from '../../users/entities/users.entity';

@Entity()
export class LessonDraft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.lessonDraft, { onDelete: 'CASCADE' })
  @JoinColumn()
  public user: User;

  @Column({ type: 'varchar' })
  public translator: string;
}

export default LessonDraft;
