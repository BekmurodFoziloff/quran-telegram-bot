import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Lesson from './entities/lesson.entity';
import LessonDraft from './entities/lessonDraft.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson, LessonDraft]), UsersModule],
  providers: [LessonsService],
  controllers: [],
  exports: [LessonsService],
})
export class LessonsModule {}
