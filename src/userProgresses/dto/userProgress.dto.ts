import { IsNumber } from 'class-validator';

export class UserProgressDto {
  @IsNumber()
  surahNumber: number;

  @IsNumber()
  ayahNumber: number;
}

export default UserProgressDto;
