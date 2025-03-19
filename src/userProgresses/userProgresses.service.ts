import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress, LastMessageId } from './userProgresses.entity';
import UserProgressDto from './dto/userProgress.dto';
import { UsersService } from '../users/users.service';
import { LessonsService } from '../lessons/lessons.service';

@Injectable()
export class UserProgressesService {
  constructor(
    @InjectRepository(UserProgress)
    private userProgressesRepository: Repository<UserProgress>,
    @InjectRepository(LastMessageId)
    private lastMessageIdRepository: Repository<LastMessageId>,
    private readonly usersService: UsersService,
    private readonly lessonsService: LessonsService,
    private readonly http: HttpService,
  ) {}

  async createUserProgress(
    userProgressData: UserProgressDto,
    telegramId: string,
  ) {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    let userProgress;

    if (user) {
      const lesson = await this.lessonsService.getLastLesson(user.id);
      if (lesson) {
        userProgress = this.userProgressesRepository.create({
          ...userProgressData,
          user,
          lesson,
        });
      }
    }

    await this.userProgressesRepository.save(userProgress);

    return userProgress;
  }

  async getLastUserPosition(userId: number, lessonId: number) {
    const userProgress = await this.userProgressesRepository.findOne({
      where: { user: { id: userId }, lesson: { id: lessonId } },
      order: {
        surahNumber: 'DESC',
        ayahNumber: 'DESC',
      },
    });

    return userProgress;
  }

  async getAyah(surah: number, ayah: number) {
    const response: AxiosResponse = await firstValueFrom(
      this.http.get(
        `https://quranenc.com/api/v1/translation/aya/uzbek_mansour/${surah}/${ayah}`,
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

  async getUserPosition(telegramId: string) {
    /*return (
      (await this.userProgressesRepository.findOne({
        where: { user: { id: userId } },
      })) ??
      this.userProgressesRepository.save({
        userId,
        surahNumber: 1,
        ayahNumber: 1,
      })
    );*/
    const user = await this.usersService.getUserByTelegramId(telegramId);
    let userPosition;

    if (user) {
      const lesson = await this.lessonsService.getLastLesson(user.id);
      if (lesson) {
        userPosition = await this.getLastUserPosition(user.id, lesson.id);

        if (!userPosition) {
          userPosition = this.userProgressesRepository.create({
            user,
            lesson,
            surahNumber: 1,
            ayahNumber: 1,
          });
          await this.userProgressesRepository.save(userPosition);
        }
      }
    }

    return userPosition;
  }

  async updateUserPosition(telegramId: string, surah: number, ayah: number) {
    /*await this.userProgressesRepository.save({
      surahNumber: surah,
      ayahNumber: ayah,
    });*/
    const user = await this.usersService.getUserByTelegramId(telegramId);
    let userPosition;

    if (user) {
      const lastLesson = await this.lessonsService.getLastLesson(user.id);
      if (lastLesson) {
        userPosition = this.userProgressesRepository.create({
          user,
          lesson: lastLesson,
          surahNumber: surah,
          ayahNumber: ayah,
        });
        await this.userProgressesRepository.save(userPosition);
      }
    }

    return userPosition;
  }

  async createUserIfNotExists(telegramId: string, messageId: number) {
    let message = await this.lastMessageIdRepository.findOne({
      where: { telegramId },
    });

    if (!message) {
      message = this.lastMessageIdRepository.create({
        telegramId,
        messageId
      });
      await this.lastMessageIdRepository.save(message);
    } else {
      
    }

    return message;
  }
}
