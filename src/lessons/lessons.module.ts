import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './lesson.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson]), UsersModule],
  providers: [LessonsService],
  controllers: [],
  exports: [LessonsService],
})
export class LessonsModule {}
