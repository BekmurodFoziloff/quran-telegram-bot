import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress, UserButtonAction } from './userProgresses.entity';
import { UsersService } from '../users/users.service';
import { LessonsService } from '../lessons/lessons.service';

@Injectable()
export class UserProgressesService {
  constructor(
    @InjectRepository(UserProgress)
    private userProgressesRepository: Repository<UserProgress>,
    @InjectRepository(UserButtonAction)
    private userButtonActionRepository: Repository<UserButtonAction>,
    private readonly usersService: UsersService,
    private readonly lessonsService: LessonsService,
    private readonly http: HttpService,
  ) {}

  async getLastUserPosition(userId: number, lessonId: number) {
    return this.userProgressesRepository.findOne({
      where: { user: { id: userId }, lesson: { id: lessonId } },
      order: {
        surahNumber: 'DESC',
        ayahNumber: 'DESC',
      },
    });
  }

  async getUserPosition(telegramId: string): Promise<UserProgress | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    const lastLesson = await this.lessonsService.getLastLesson(user.id);
    if (!lastLesson) return null;

    const existing = await this.getLastUserPosition(user.id, lastLesson.id);
    if (existing) return existing;

    const defaultPosition = this.userProgressesRepository.create({
      user,
      lesson: lastLesson,
      surahNumber: 1,
      ayahNumber: 1,
    });

    return this.userProgressesRepository.save(defaultPosition);
  }

  async updateUserPosition(
    telegramId: string,
    surah: number,
    ayah: number,
  ): Promise<UserProgress | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    const lastLesson = await this.lessonsService.getLastLesson(user.id);
    if (!lastLesson) return null;

    const userPosition = this.userProgressesRepository.create({
      user,
      lesson: lastLesson,
      surahNumber: surah,
      ayahNumber: ayah,
    });

    await this.userProgressesRepository.save(userPosition);
    return userPosition;
  }

  async getAyah(surah: number, ayah: number) {
    const response: AxiosResponse = await firstValueFrom(
      this.http.get(
        `https://quranenc.com/api/v1/translation/aya/uzbek_sadiq/${surah}/${ayah}`,
      ),
    );

    return response?.data;
  }

  async getNumberOfAyahs(surah: number) {
    const response: AxiosResponse = await firstValueFrom(
      this.http.get(
        `https://quranenc.com/api/v1/translation/sura/uzbek_sadiq/${surah}`,
      ),
    );

    return response?.data.result.length;
  }

  async getTotalAyahsRead(userId: number): Promise<number> {
    return this.userProgressesRepository.count({
      where: { user: { id: userId } },
    });
  }

  async getDailyStats(userId: number) {
    return this.userProgressesRepository
      .createQueryBuilder('progress')
      .select("DATE_TRUNC('day', progress.readAt)", 'readDay')
      .addSelect('COUNT(*)', 'ayahsRead')
      .where('progress.userId = :userId', { userId })
      .groupBy("DATE_TRUNC('day', progress.readAt)")
      .orderBy("DATE_TRUNC('day', progress.readAt)", 'DESC')
      .getRawMany();
  }

  async getReadingStreak(userId: number): Promise<number> {
    const rawDates = await this.userProgressesRepository
      .createQueryBuilder('progress')
      .select('DISTINCT DATE(progress."readAt")', 'readDate')
      .where('progress.userId = :userId', { userId })
      .orderBy('DATE(progress."readAt")', 'DESC')
      .getRawMany();

    const dates = rawDates.map((row) => new Date(row.readDate));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const date of dates) {
      const diff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 0 || diff === 1) {
        streak++;
        today.setDate(today.getDate() - 1);
      } else if (diff > 1) {
        break;
      }
    }

    return streak;
  }

  async getUserStats(telegramId: string): Promise<{
    total: number;
    streak: number;
    dailyStats: any;
  } | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    const [total, streak, dailyStats] = await Promise.all([
      this.getTotalAyahsRead(user.id),
      this.getReadingStreak(user.id),
      this.getDailyStats(user.id),
    ]);

    return { total, streak, dailyStats };
  }

  formatStatsMessage(
    total: number,
    streak: number,
    dailyStats: { readDay: string; ayahsRead: string }[],
  ): string {
    const formattedDays = dailyStats
      .slice(0, 5)
      .map((stat) => {
        const date = new Date(stat.readDay);
        const dayStr = date.toLocaleDateString('uz-UZ', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        return `📅 ${dayStr}: ${stat.ayahsRead} oyat`;
      })
      .join('\n');

    return (
      `<b>📊 Sizning Qur'on o'qish statistikangiz:</b>\n\n` +
      `<i>📖 Umumiy o'qilgan oyatlar: ${total}</i>\n` +
      `<i>🔥 Ketma-ket o'qish (streak): ${streak} kun</i>\n\n` +
      `<b>🗓 Oxirgi 5 kunlik faoliyat:</b>\n` +
      `${formattedDays || '<i>Maʼlumot topilmadi</i>'}`
    );
  }

  async getUserButtonActionBy(
    telegramId: string,
  ): Promise<UserButtonAction | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    return this.userButtonActionRepository.findOne({
      where: { user: { id: user.id } },
    });
  }

  async createUserButtonActionIfNotExists(
    telegramId: string,
    messageId: number,
  ): Promise<void> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return;

    const existingAction = await this.userButtonActionRepository.findOne({
      where: { user: { id: user.id } },
    });

    if (!existingAction) {
      const newAction = this.userButtonActionRepository.create({
        user,
        messageId,
      });
      await this.userButtonActionRepository.save(newAction);
      return;
    }

    await this.userButtonActionRepository.update(
      { user: { id: user.id } },
      {
        messageId,
        updatedAt: () => 'CURRENT_TIMESTAMP',
      },
    );
  }
}
