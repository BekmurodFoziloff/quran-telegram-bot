import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { I18nTelegrafResolver } from './i18n.telegraf.resolver';

@Module({
  imports: [
    ConfigModule,
    I18nModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        fallbackLanguage: configService.get<string>('DEFAULT_LANGUAGE') || 'uz',
        loaderOptions: {
          path: path.resolve(
            process.env.NODE_ENV === 'production'
              ? path.join(__dirname, '..', 'i18n', 'locales')
              : path.join(process.cwd(), 'src', 'i18n', 'locales'),
          ),
          watch: process.env.NODE_ENV !== 'production',
        },
        resolvers: [
          I18nTelegrafResolver,
          AcceptLanguageResolver,
          { use: QueryResolver, options: ['lang'] },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [I18nModule],
})
export class AppI18nModule {}
