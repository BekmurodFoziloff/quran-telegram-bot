import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  telegramId: string;

  @IsBoolean()
  isBot: boolean;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export default CreateUserDto;
