import { IsNumber } from 'class-validator';

export class SurahAyahDto {
  @IsNumber()
  surahNumber: number;

  @IsNumber()
  ayahNumber: number;
}

export default SurahAyahDto;
