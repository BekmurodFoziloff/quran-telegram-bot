import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurahsAyahs } from './surahsAyahs.entity';

@Injectable()
export class SurahsAyahsService {
  constructor(
    @InjectRepository(SurahsAyahs)
    private surahsAyahsRepository: Repository<SurahsAyahs>,
  ) {}
}
