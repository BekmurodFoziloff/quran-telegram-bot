import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import Lessons from '../lessons/lesson.entity';
import SurahsAyahs from '../surahsAyahs/surahsAyahs.entity';

@Entity()
class Users {
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

  @OneToMany(() => Lessons, (lesson) => lesson.userId)
  @JoinColumn()
  lessons: Lessons;

  @OneToMany(() => SurahsAyahs, (surahAyah) => surahAyah.userId)
  @JoinColumn()
  surahsAyahs: SurahsAyahs[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}

export default Users;
