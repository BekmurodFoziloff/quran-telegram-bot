import { OnModuleInit } from '@nestjs/common';
import { Update, Ctx, Start, Help, On, Hears, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import axios from 'axios';
import * as cron from 'node-cron';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import { User } from 'telegraf/typings/core/types/typegram';
import { UsersService } from '../users/users.service';
import { LessonsService } from '../lessons/lessons.service';
import { UserProgressesService } from '../userProgresses/userProgresses.service';

@Update()
export class BotUpdate {
  constructor(
    private readonly usersService: UsersService,
    private readonly lessonsService: LessonsService,
    private readonly progressesService: UserProgressesService,
  ) {}

  @Start()
  async onStartCommand(@Ctx() ctx: Context) {
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Darsni boshlash', 'begin_lesson')],
      //[Markup.button.callback('📖 Keyingi sura', 'next')],
      //[Markup.button.callback('🔍 Hozirgi sura', 'current')],
      //[Markup.button.callback('♻️ Reset', 'reset')],
    ]);

    const {
      id: telegramId,
      is_bot: isBot,
      first_name: firstName,
      last_name: lastName,
      username: username,
    } = ctx.from as User;

    await this.usersService.createUser({
      telegramId: telegramId.toString(),
      isBot,
      firstName,
      lastName,
      username,
    });

    await ctx.reply('Darsni boshlash tugmasini bosing:', buttons);
  }

  @Action('begin_lesson')
  async onBeginLessonCommand(@Ctx() ctx: Context) {
    const {
      id: telegramId,
      is_bot: isBot,
      first_name: firstName,
      last_name: lastName,
      username: username,
    } = ctx.from as User;

    const lesson = await this.lessonsService.createLesson(
      telegramId.toString(),
    );

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Hozirgi', 'current')],
      [Markup.button.callback('➡️ Keyingi', 'next')],
    ]);

    await ctx.reply('Qur’on darsiga xush kelibsiz!', buttons);
  }

  @Action('current')
  async onCurrent(@Ctx() ctx: Context) {
    const {
      id: telegramId,
      is_bot: isBot,
      first_name: firstName,
      last_name: lastName,
      username: username,
    } = ctx.from as User;

    const user = await this.usersService.getUserByTelegramId(
      telegramId.toString(),
    );
    if (user) {
      const progress = await this.progressesService.getUserPosition(user.id);
      const ayah = await this.progressesService.getAyah(
        progress.surahNumber,
        progress.ayahNumber,
      );

      await ctx.answerCbQuery();
      await ctx.reply(`📖 ${ayah.aya_text}\n\n🔍 Tarjima: ${ayah.translation}`);
    }
  }

  @Action('next')
  async onNext(@Ctx() ctx: Context) {
    const {
      id: telegramId,
      is_bot: isBot,
      first_name: firstName,
      last_name: lastName,
      username: username,
    } = ctx.from as User;

    const user = await this.usersService.getUserByTelegramId(
      telegramId.toString(),
    );

    if (user) {
      console.log(user.id)
      const current = await this.progressesService.getUserPosition(user.id);

      // Qur’on oyat sonini tekshirib olish
      const ayah = await this.progressesService.getAyah(
        current.surahNumber,
        current.ayahNumber,
      );
      const maxAyahs = ayah.aya_count; // API'da shu mavjud

      let nextSurah = current.surahNumber;
      let nextAyah = current.ayahNumber + 1;

      if (nextAyah > maxAyahs) {
        nextSurah++;
        nextAyah = 1;
      }

      if (nextSurah > 114) {
        await ctx.reply('✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!');
        return;
      }

      const nextAyahData = await this.progressesService.getAyah(
        nextSurah,
        nextAyah,
      );

      await this.progressesService.updateUserPosition(
        user?.id,
        nextSurah,
        nextAyah,
      );

      await ctx.answerCbQuery();
      await ctx.reply(
        `📖 ${nextAyahData.aya_text}\n\n🔍 Tarjima: ${nextAyahData.translation}`,
      );
    }
  }

  /*@Help()
  async helpCommand(@Ctx() ctx: Context) {
    await ctx.reply('Send me a message, and I will echo it back!');
  }

  @On('text')
  async onTextMessage(@Ctx() ctx: Context) {
    await ctx.reply(`You said: ${(ctx as any).message['text']}`);
  }

  @Hears('hello')
  async onHello(@Ctx() ctx: Context) {
    await ctx.reply('Hi there!');
  }

  @On('sticker')
  async onSticker(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }*/
}
