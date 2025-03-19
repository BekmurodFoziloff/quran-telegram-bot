import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { UserProgress } from './entities/userProgresses.entity';
import { UsersService } from '../users/users.service';
import { LessonsService } from '../lessons/lessons.service';
import { RedisService } from '../redis/redis.service';
import { ButtonActionCache } from '../common/interfaces/buttonAction.cache';
import { TEXTS } from '../common/constants/texts.constant';
import { LessonStatus } from '../common/enums/lessonStatus.enum';

@Injectable()
export class UserProgressesService {
  private readonly prefix = 'button_action:';

  constructor(
    @InjectRepository(UserProgress)
    private userProgressesRepository: Repository<UserProgress>,
    private readonly usersService: UsersService,
    private readonly lessonsService: LessonsService,
    private readonly redisService: RedisService,
    private readonly http: HttpService,
  ) {}

  async getUserPosition(
    telegramId: string,
    action?: string,
  ): Promise<UserProgress | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    const lastLesson = await this.lessonsService.getLastLesson(telegramId);
    if (!lastLesson || lastLesson.status !== LessonStatus.ACTIVE) {
      return null;
    }

    if (action === TEXTS.ACTIONS.CURRENT) {
      const userPosition = await this.userProgressesRepository.findOne({
        where: { user: { id: user.id }, lesson: { id: lastLesson.id } },
        /*order: {
          readAt: 'DESC',
        },*/
        relations: ['user', 'lesson'],
        order: {
          surahNumber: 'DESC',
          ayahNumber: 'DESC',
        },
      });
      if (userPosition) return userPosition;
    } else {
      const userPosition = await this.userProgressesRepository.findOne({
        where: { user: { id: user.id }, lesson: { id: lastLesson.id } },
        order: {
          readAt: 'DESC',
        },
        relations: ['user', 'lesson'],
        /*order: {
        surahNumber: 'DESC',
        ayahNumber: 'DESC',
      },*/
      });
      if (userPosition) return userPosition;
    }

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

    const lastLesson = await this.lessonsService.getLastLesson(telegramId);
    if (!lastLesson || lastLesson.status !== LessonStatus.ACTIVE) {
      return null;
    }

    const userPosition = this.userProgressesRepository.create({
      user,
      lesson: lastLesson,
      surahNumber: surah,
      ayahNumber: ayah,
    });

    return await this.userProgressesRepository.save(userPosition);
  }

  async fetchAyah(surah: number, ayah: number) {
    const response: AxiosResponse = await firstValueFrom(
      this.http.get(
        `https://quranenc.com/api/v1/translation/aya/uzbek_sadiq/${surah}/${ayah}`,
      ),
    );

    return response?.data;
  }

  async fetchNumberOfAyahs(surah: number) {
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

  async getButtonAction(telegramId: string): Promise<ButtonActionCache | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    const key = `${this.prefix}${user.id}`;
    const buttonAction = await this.redisService.get(key);
    if (!buttonAction) return null;

    const parsedButtonAction: ButtonActionCache = JSON.parse(buttonAction);

    return parsedButtonAction;
  }

  async createButtonAction(
    telegramId: string,
    messageId: number,
  ): Promise<void> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return;

    const key = `${this.prefix}${user.id}`;
    const buttonAction = await this.redisService.get(key);

    let newAction: ButtonActionCache;

    if (buttonAction) {
      const parsed: ButtonActionCache = JSON.parse(buttonAction);
      newAction = {
        ...parsed,
        messageId,
        updatedAt: new Date(),
      };
    } else {
      newAction = {
        userId: user.id,
        messageId,
        createdAt: new Date(),
      };
    }

    await this.redisService.set(key, JSON.stringify(newAction));
  }

  async deleteButtonAction(telegramId: string): Promise<void> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return;

    const key = `${this.prefix}${user.id}`;
    const buttonAction = await this.redisService.get(key);
    if (buttonAction) {
      await this.redisService.del(key);
    }
  }

  getAyah(surah: number, ayah: number, translator: string) {
    const quranFilePath = path.join(
      __dirname,
      '..',
      '..',
      'assets',
      'translations',
      `${translator}.txt`,
    );

    // Check if the Quran file exists
    if (!fs.existsSync(quranFilePath)) return null;

    // Read all lines from the file
    const lines = fs.readFileSync(quranFilePath, 'utf-8').split('\n');

    // Find the specific line that matches the given surah and ayah
    const line = lines.find((l) => {
      const [s, a] = l.split('|');
      return Number(s) === surah && Number(a) === ayah;
    });

    if (!line) {
      return null;
    }

    const parts = line.split('|');

    if (parts.length < 3) return null;

    // Extract ayah text starting from the 3rd column (sometimes includes footnotes or comments)
    const ayahTextWithFootnote = parts.slice(2).join('|').trim();

    let verseText = ayahTextWithFootnote;
    let verseFootnote: string | null = null;

    // If the ayah contains a footnote, separate it
    if (ayahTextWithFootnote.includes('|')) {
      const [ayahText, footnoteText] = ayahTextWithFootnote
        .split('|')
        .map((t) => t.trim());

      verseText = ayahText;
      verseFootnote = footnoteText || null;
    }

    return {
      surah,
      ayah,
      verseText,
      verseFootnote,
    };
  }

  getNumberOfAyahs(surah: number) {
    const quranFilePath = path.join(
      __dirname,
      '..',
      '..',
      'assets',
      'translations',
      'uz.mansour.txt',
    );

    // Check if the Quran file exists
    if (!fs.existsSync(quranFilePath)) return null;

    // Read all lines from the file
    const lines = fs.readFileSync(quranFilePath, 'utf-8').split('\n');

    // Count how many lines belong to this surah
    const ayahCount = lines.filter((l) => {
      const [s] = l.split('|');
      return Number(s) === surah;
    }).length;

    return ayahCount;
  }
}
