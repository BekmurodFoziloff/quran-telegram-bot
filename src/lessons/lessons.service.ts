import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonsRepository: Repository<Lesson>,
    private readonly usersService: UsersService,
  ) {}

  async getLessonById(id: number) {
    const lesson = await this.lessonsRepository.findOne({ where: { id } });

    return lesson;
  }

  async createLessonIfNotExists(telegramId: string) {
    const user = await this.usersService.getUserByTelegramId(telegramId);

    if (user) {
      const lastLesson = await this.getLastLesson(user.id);

      if (!lastLesson) {
        const lesson = this.lessonsRepository.create({
          user,
          lessonNumber: 1,
        });
        return await this.lessonsRepository.save(lesson);
      }

      if (!lastLesson.isCompleted) {
        return lastLesson;
      }

      const newLesson = this.lessonsRepository.create({
        user,
        lessonNumber: lastLesson.lessonNumber + 1,
      });
      return await this.lessonsRepository.save(newLesson);
    }
  }

  async updateLesson(telegramId: string) {
    const user = await this.usersService.getUserByTelegramId(telegramId);

    if (user) {
      const lastLesson = await this.getLastLesson(user.id);

      if (lastLesson) {
        await this.lessonsRepository.update(
          { id: lastLesson.id },
          {
            updatedAt: () => 'CURRENT_TIMESTAMP',
          },
        );
      }
    }
  }

  async getLastLesson(userId: number) {
    const lastLesson = await this.lessonsRepository.findOne({
      where: { user: { id: userId } },
      order: {
        lessonNumber: 'DESC',
      },
    });

    return lastLesson;
  }
}
