import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import User from '../users/users.entity';
import SurahAyah from '../surahsAyahs/surahsAyahs.entity';

@Entity()
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lessonNumber: number;

  @ManyToOne(() => User, user => user.lessons)
  @JoinColumn()
  userId: User;

  @OneToMany(() => User, user => user.surahAyah)
  @JoinColumn()
  suraAyah: SurahAyah[];

  @Column({ default: false })
  isCompleted: boolean;
}

export default Lesson;
