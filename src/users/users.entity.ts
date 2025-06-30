import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import Lesson from '../lessons/lesson.entity';
import SurahAyah from '../surahsAyahs/surahsAyahs.entity';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: 'bigint' })
  telegramId: string;

  @Column()
  isBot: boolean;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  username: string;

  @OneToMany(() => Lesson, (lesson) => lesson.userId)
  @JoinColumn()
  lessons: Lesson;

  @OneToMany(() => SurahAyah, (surahAyah) => surahAyah.userId)
  @JoinColumn()
  surahAyah: SurahAyah[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}

export default User;
