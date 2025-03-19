import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bots.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { LessonsModule } from '../lessons/lessons.module';
import { UserProgressesModule } from '../userProgresses/userProgresses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        token: await configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
      }),
    }),
    UsersModule,
    LessonsModule,
    UserProgressesModule,
  ],
  providers: [BotUpdate],
  controllers: [],
})
export class BotsModule {}
