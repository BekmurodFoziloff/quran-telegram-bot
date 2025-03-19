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

  async createLesson(telegramId: string) {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    let lesson;

    if (user) {
      const lastLesson = await this.getLastLesson(user.id);
      if (lastLesson && lastLesson.isCompleted === true) {
        lesson = this.lessonsRepository.create({
          user,
          lessonNumber: lastLesson.lessonNumber + 1,
        });
        await this.lessonsRepository.save(lesson);
      } else {
        lesson = this.lessonsRepository.create({ user });
        await this.lessonsRepository.save(lesson);
      }
    }

    return lesson;
  }

  async updateLesson(id: number) {
    await this.lessonsRepository.update(id, {
      updatedAt: () => 'CURRENT_TIMESTAMP',
    });
    const updatedLesson = await this.getLessonById(id);

    return updatedLesson;
  }

  async getLastLesson(userId: number) {
    const lesson = await this.lessonsRepository.findOne({
      where: { user: { id: userId } },
      order: {
        lessonNumber: 'DESC',
      },
    });

    return lesson;
  }
}
