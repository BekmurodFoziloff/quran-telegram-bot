import { Module } from '@nestjs/common';
import { LessonssService } from './lessons.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson])],
  providers: [LessonssService],
  controllers: [],
})
export class LessonsModule {}
