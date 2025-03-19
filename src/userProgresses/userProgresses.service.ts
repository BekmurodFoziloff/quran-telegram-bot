import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress } from './userProgresses.entity';
import UserProgressDto from './dto/userProgress.dto';
import { UsersService } from '../users/users.service';
import { LessonsService } from '../lessons/lessons.service';

@Injectable()
export class UserProgressesService {
  constructor(
    @InjectRepository(UserProgress)
    private userProgressesRepository: Repository<UserProgress>,
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

  async getLastUserProgress(userId: number, lessonId: number) {
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

  async getUserPosition(telegramId: number) {
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
    
    if (user) {
      const lesson = this.lessonsService.getLastLesson(user.id)
      if (lesson) {
        
      }
    }
  }

  async updateUserPosition(userId: number, surah: number, ayah: number) {
    await this.userProgressesRepository.save({
      userId,
      surahNumber: surah,
      ayahNumber: ayah,
    });
  }
}
