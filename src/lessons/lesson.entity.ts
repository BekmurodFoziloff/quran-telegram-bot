import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import Users from '../users/users.entity';
import SurahsAyahs from '../surahsAyahs/surahsAyahs.entity';

@Entity()
export class Lessons {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lessonNumber: number;

  @ManyToOne(() => Users, user => user.lessons)
  @JoinColumn()
  userId: Users;

  @OneToMany(() => Users, user => user.surahsAyahs)
  @JoinColumn()
  surahAyahs: SurahsAyahs[];

  @Column({ default: false })
  isCompleted: boolean;
}

export default Lessons;
