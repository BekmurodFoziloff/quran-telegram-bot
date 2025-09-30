import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Lesson from './entities/lesson.entity';
import LessonDraft from './entities/lessonDraft.entity';
import { UsersService } from '../users/users.service';
import { LessonStatus } from '../common/enums/lessonStatus.enum';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonsRepository: Repository<Lesson>,
    @InjectRepository(LessonDraft)
    private lessonDraftsRepository: Repository<LessonDraft>,
    private readonly usersService: UsersService,
  ) {}

  async getLesson(telegramId: string): Promise<Lesson | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    return this.lessonsRepository.findOne({
      where: { user: { id: user.id } },
    });
  }

  async createLesson(telegramId: string): Promise<void> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return;

    const lastLesson = await this.getLastLesson(telegramId);

    if (!lastLesson || lastLesson.status !== LessonStatus.ACTIVE) {
      const lessonNumber = lastLesson ? lastLesson.lessonNumber + 1 : 1;
      const newLesson = this.lessonsRepository.create({ user, lessonNumber });
      await this.lessonsRepository.save(newLesson);
    }
  }

  async completeLesson(telegramId: string): Promise<void> {
    const lastLesson = await this.getLastLesson(telegramId);
    if (!lastLesson || lastLesson.status !== LessonStatus.ACTIVE) return;

    await this.lessonsRepository.update(
      { id: lastLesson.id },
      {
        status: LessonStatus.COMPLETED,
        updatedAt: () => 'CURRENT_TIMESTAMP',
      },
    );
  }

  async getLastLesson(telegramId: string): Promise<Lesson | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    return this.lessonsRepository.findOne({
      where: { user: { id: user.id } },
      order: {
        lessonNumber: 'DESC',
      },
    });
  }

  async getDraft(telegramId: string): Promise<LessonDraft | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    return this.lessonDraftsRepository.findOne({
      where: { user: { id: user.id } },
    });
  }

  async saveDraft(telegramId: string, translator: string): Promise<void> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return;

    await this.lessonDraftsRepository.save({ user, translator });
  }

  async confirmDraft(telegramId: string): Promise<Lesson | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    const draft = await this.lessonDraftsRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!draft) return null;

    // Get last lesson to set the correct lesson number
    const lastLesson = await this.getLastLesson(telegramId);

    const lesson = this.lessonsRepository.create({
      user,
      lessonNumber:
        lastLesson && lastLesson.status !== LessonStatus.ACTIVE
          ? lastLesson.lessonNumber + 1
          : 1,
      translator: draft.translator,
      status: LessonStatus.ACTIVE,
    });
    await this.lessonsRepository.save(lesson);

    // Delete draft after creating the lesson
    await this.lessonDraftsRepository.delete({ user: { id: user.id } });

    return lesson;
  }

  async cancelDraft(telegramId: string): Promise<LessonDraft | null> {
    const user = await this.usersService.getUserByTelegramId(telegramId);
    if (!user) return null;

    const draft = await this.lessonDraftsRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!draft) return null;

    await this.lessonDraftsRepository.delete({ user: { id: user.id } });

    return draft;
  }

  async cancelLesson(telegramId: string): Promise<Lesson | null> {
    const lastLesson = await this.getLastLesson(telegramId);
    if (!(lastLesson && lastLesson.status === LessonStatus.ACTIVE)) return null;

    await this.lessonsRepository.update(
      { id: lastLesson.id },
      { status: LessonStatus.CANCELED, updatedAt: () => 'CURRENT_TIMESTAMP' },
    );

    const lesson = await this.getLesson(telegramId);
    if (!lesson) return null;

    return lesson;
  }

  async getTranslator(telegramId: string): Promise<string | null> {
    const lastLesson = await this.getLastLesson(telegramId);
    if (!lastLesson || lastLesson.status !== LessonStatus.ACTIVE) {
      return null;
    }

    return lastLesson.translator;
  }
}
