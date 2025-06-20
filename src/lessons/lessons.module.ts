import { Module } from '@nestjs/common';
import { LessonssService } from './lessons.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lessons } from './lesson.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lessons])],
  providers: [LessonssService],
  controllers: [],
})
export class LessonsModule {}
