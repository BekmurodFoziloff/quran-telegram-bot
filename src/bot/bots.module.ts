import { Module } from '@nestjs/common';
import { BotsService } from './bots.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [BotsService],
  controllers: []
})
export class BotsModule {}