import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurahAyah } from './surahsAyahs.entity';

@Injectable()
export class SurahsAyahsService {
  constructor(
    @InjectRepository(SurahAyah)
    private surahsAyahsRepository: Repository<SurahAyah>,
  ) {}
}
