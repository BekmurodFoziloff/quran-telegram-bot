import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import Users from '../users/users.entity';
import Lessons from '../lessons/lesson.entity';

@Entity()
export class SurahsAyahs {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (user) => user.surahsAyahs)
  @JoinColumn()
  userId: Users;

  @ManyToOne(() => Lessons, (lesson) => lesson.lessonNumber)
  @JoinColumn()
  lessonId: Lessons;

  @Column()
  surahNumber: number;

  @Column()
  ayahNumber: number;
}

export default SurahsAyahs;