import { Module } from '@nestjs/common';
import { UserProgressesService } from './userProgresses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import UserProgress from './entities/userProgresses.entity';
import { UsersModule } from '../users/users.module';
import { LessonsModule } from '../lessons/lessons.module';

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
