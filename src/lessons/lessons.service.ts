import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lessons } from './lesson.entity';

@Injectable()
export class LessonssService {
  constructor(
    @InjectRepository(Lessons)
    private lessonsRepository: Repository<Lessons>,
  ) {}
}
