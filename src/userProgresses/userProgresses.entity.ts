import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import User from '../users/users.entity';
import Lesson from '../lessons/lesson.entity';

@Entity()
export class UserProgress {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, (user) => user.userProgresses)
  @JoinColumn()
  public user: User;

  @ManyToOne(() => Lesson, (lesson) => lesson.lessonNumber)
  @JoinColumn()
  public lesson: Lesson;

  @Column()
  public surahNumber: number;

  @Column()
  public ayahNumber: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public readAt: Date;
}

@Entity()
export class LastMessageId {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, type: 'bigint' })
  public telegramId: string;

  @Column()
  public messageId: number;
}

export default UserProgress;
