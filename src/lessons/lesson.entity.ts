import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import User from '../users/users.entity';
import UserProgress from '../userProgresses/userProgresses.entity';

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ default: 1 })
  public lessonNumber: number;

  @ManyToOne(() => User, (user) => user.lessons)
  @JoinColumn()
  public user: User;

  @OneToMany(() => User, (user) => user.userProgresses)
  @JoinColumn()
  public userProgresses: UserProgress[];

  @Column({ default: false })
  public isCompleted: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  public updatedAt?: Date;
}

export default Lesson;
