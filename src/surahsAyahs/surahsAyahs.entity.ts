import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import User from '../users/users.entity';
import Lesson from '../lessons/lesson.entity';

@Entity()
export class SurahAyah {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.surahAyah)
  @JoinColumn()
  userId: User;

  @ManyToOne(() => Lesson, (lesson) => lesson.lessonNumber)
  @JoinColumn()
  lessonId: Lesson;

  @Column()
  surahNumber: number;

  @Column()
  ayahNumber: number;
}

export default SurahAyah;