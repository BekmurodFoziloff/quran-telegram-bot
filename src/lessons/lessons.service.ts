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
    return this.lessonsRepository.findOne({ where: { id } });
  }

  async createLessonIfNotExists(
    telegramId: string,
  ): Promise<Lesson | undefined> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return;

    const lastLesson = await this.getLastLesson(user.id);

    // If no lesson exists, create the first one
    if (!lastLesson) {
      const firstLesson = this.lessonsRepository.create({
        user,
        lessonNumber: 1,
      });
      return this.lessonsRepository.save(firstLesson);
    }

    // If last lesson is not completed, return it
    if (!lastLesson.isCompleted) return lastLesson;

    // If last lesson is completed, create a new one with +1 lessonNumber
    const newLesson = this.lessonsRepository.create({
      user,
      lessonNumber: lastLesson.lessonNumber + 1,
    });
    return this.lessonsRepository.save(newLesson);
  }

  async updateLesson(telegramId: string): Promise<void> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return;

    const lastLesson = await this.getLastLesson(user.id);
    if (!lastLesson) return;

    await this.lessonsRepository.update(
      { id: lastLesson.id },
      {
        updatedAt: () => 'CURRENT_TIMESTAMP',
      },
    );
  }

  async getLastLesson(userId: number) {
    return this.lessonsRepository.findOne({
      where: { user: { id: userId } },
      order: {
        lessonNumber: 'DESC',
      },
    });
  }
}
