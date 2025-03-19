import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { BotsService } from './bots.service';
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
      useFactory: (configService: ConfigService) => ({
        token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
        telegram: {
          timeout: 60_000,
        },
        launchOptions: {
          dropPendingUpdates: true,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    LessonsModule,
    UserProgressesModule,
  ],
  providers: [BotsService],
  controllers: [],
})
export class BotsModule {}
