import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
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
export class UserButtonAction {
  @PrimaryGeneratedColumn()
  public id: number;

  @OneToOne(() => User, (user) => user.userButtonAction)
  @JoinColumn()
  public user: User;

  @Column()
  public messageId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  public updatedAt?: Date;
}

export default UserProgress;
