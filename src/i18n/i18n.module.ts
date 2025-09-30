import { Module } from '@nestjs/common';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        fallbackLanguage: configService.get<string>('DEFAULT_LANGUAGE') || 'uz',
        loaderOptions: {
          path:
            process.env.NODE_ENV === 'production'
              ? path.join(__dirname, '..', 'i18n', 'locales')
              : path.join(process.cwd(), 'src', 'i18n', 'locales'),
          watch: process.env.NODE_ENV !== 'production',
        },
        resolvers: [
          { use: QueryResolver, options: ['lang'] },
          AcceptLanguageResolver,
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [I18nModule],
})
export class AppI18nModule {}
