import { Module } from '@nestjs/common';
import { SurahsAyahsService } from './surahsAyahs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurahAyah } from './surahsAyahs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SurahAyah])],
  providers: [SurahsAyahsService],
  controllers: [],
})
export class SurahsModule {}
