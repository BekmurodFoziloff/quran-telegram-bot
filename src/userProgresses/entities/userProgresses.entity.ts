import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import User from '../../users/entities/users.entity';
import Lesson from '../../lessons/entities/lesson.entity';

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, (user) => user.userProgresses, { onDelete: 'CASCADE' })
  @JoinColumn()
  public user: User;

  @ManyToOne(() => Lesson, (lesson) => lesson.lessonNumber, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public lesson: Lesson;

  @Column()
  public surahNumber: number;

  @Column()
  public ayahNumber: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public readAt: Date;
}
export default UserProgress;
