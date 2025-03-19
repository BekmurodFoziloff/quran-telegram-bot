import { Module } from '@nestjs/common';
import { UserProgressesService } from './userProgresses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './userProgresses.entity';
import { UsersModule } from '../users/users.module';
import { LessonsModule } from '../lessons/lessons.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProgress]),
    UsersModule,
    LessonsModule,
    HttpModule,
  ],
  providers: [UserProgressesService],
  controllers: [],
  exports: [UserProgressesService],
})
export class UserProgressesModule {}
