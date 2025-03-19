import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { BotUpdate } from './bots.update';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { LessonsModule } from '../lessons/lessons.module';
import { UserProgressesModule } from '../userProgresses/userProgresses.module';
import { BotsService } from './bot.service';

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
    ScheduleModule.forRoot(),
    UsersModule,
    LessonsModule,
    UserProgressesModule,
  ],
  providers: [BotUpdate, BotsService],
  controllers: [],
})
export class BotsModule {}
