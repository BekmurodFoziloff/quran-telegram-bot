import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import Lesson from '../lessons/lesson.entity';
import UserProgress from '../userProgresses/userProgresses.entity';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, type: 'bigint' })
  public telegramId: string;

  @Column()
  public isBot: boolean;

  @Column({ nullable: true })
  public firstName?: string;

  @Column({ nullable: true })
  public lastName?: string;

  @Column({ nullable: true })
  public username?: string;

  @OneToMany(() => Lesson, (lesson) => lesson.user)
  @JoinColumn()
  public lessons: Lesson[];

  @OneToMany(() => UserProgress, (userProgress) => userProgress.user)
  @JoinColumn()
  public userProgresses: UserProgress[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  public updatedAt?: Date;
}

export default User;
