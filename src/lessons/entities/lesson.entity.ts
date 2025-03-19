import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import User from '../../users/entities/users.entity';
import UserProgress from '../../userProgresses/entities/userProgresses.entity';
import { LessonStatus } from '../../common/enums/lessonStatus.enum';

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ default: 1 })
  public lessonNumber: number;

  @ManyToOne(() => User, (user) => user.lessons, { onDelete: 'CASCADE' })
  @JoinColumn()
  public user: User;

  @OneToMany(() => User, (user) => user.userProgresses, { onDelete: 'CASCADE' })
  @JoinColumn()
  public userProgresses: UserProgress[];

  @Column({ type: 'varchar' })
  public translator: string;

  @Column({
    type: 'enum',
    enum: LessonStatus,
    default: LessonStatus.ACTIVE,
  })
  public status: LessonStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  public updatedAt?: Date;
}

export default Lesson;
