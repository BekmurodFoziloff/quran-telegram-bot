import { OnModuleInit } from '@nestjs/common';
import { Update, Ctx, Start, Help, On, Hears, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import axios from 'axios';
import * as cron from 'node-cron';
import { Telegraf } from 'telegraf';
import * as fs from 'fs';
import { User } from 'telegraf/typings/core/types/typegram';
import { UsersService } from '../users/users.service';

@Update()
export class BotsService implements OnModuleInit {
  private readonly bot = new Telegraf(
    '7273242765:AAHLxiSvfZd3XHimjtYam7Zgn70qYzc81hk',
  );
  private readonly chatId = '7273242765'; // kanal yoki admin chat ID

  async onModuleInit() {
    await this.bot.launch();

    // Inline buttonlarni yaratish
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Keyingi sura', 'next')],
      [Markup.button.callback('🔍 Hozirgi sura', 'current')],
      [Markup.button.callback('♻️ Reset', 'reset')],
    ]);

    // /start komandasi
    this.bot.start((ctx) => {
      ctx.reply(
        `Assalomu alaykum! Har kuni 19:00 da sura yuboraman.\n\nSiz quyidagi tugmalar orqali ham foydalanishingiz mumkin:`,
        buttons,
      );
    });

    // Callback handler (button bosilganda)
    this.bot.action('next', async (ctx) => {
      await this.sendSurah((ctx as any).chat.id);
      await ctx.answerCbQuery();
    });

    this.bot.action('current', async (ctx) => {
      const currentSurah = this.getCurrentSurah();
      const response = await axios.get(
        `https://api.quranenc.com/v1/translation/sura/uzbek_mansour/${currentSurah}`,
      );
      const surahData = response.data;
      await ctx.reply(
        `📖 Hozirgi sura: *${surahData.sura_name}* (${currentSurah})`,
        { parse_mode: 'Markdown' },
      );
      await ctx.answerCbQuery();
    });

    this.bot.action('reset', async (ctx) => {
      this.resetSurah();
      await ctx.reply('✅ Suralar 1-chi suraga (Fotiha) qayta tiklandi.');
      await ctx.answerCbQuery();
    });

    // Cron - har kuni 19:00 da avtomatik yuborish
    cron.schedule('0 19 * * *', () => {
      this.sendSurah(this.chatId);
    });

    console.log('Bot va cron tayyor!');
  }

  private async sendSurah(chatId: number | string) {
    const currentSurah = this.getCurrentSurah();

    try {
      const response = await axios.get(
        `https://api.quranenc.com/v1/translation/sura/uzbek_mansour/${currentSurah}`,
      );
      const surahData = response.data;

      let message = `📖 *${surahData.sura_name}* \n\n`;

      surahData.ayahs.forEach((ayah: any) => {
        message += `${ayah.ayah} - ${ayah.text}\n`;
      });

      const chunks = this.splitMessage(message, 4000);

      for (const chunk of chunks) {
        await this.bot.telegram.sendMessage(chatId, chunk, {
          parse_mode: 'Markdown',
        });
      }

      this.incrementSurah();
    } catch (err) {
      console.error('Xatolik yuz berdi: ', err.message);
      await this.bot.telegram.sendMessage(
        chatId,
        '❌ Kechirasiz, sura olishda muammo yuz berdi.',
      );
    }
  }

  private getCurrentSurah(): number {
    if (!fs.existsSync('surah.json')) {
      fs.writeFileSync('surah.json', JSON.stringify({ surah: 1 }));
      return 1;
    }
    const data = JSON.parse(fs.readFileSync('surah.json', 'utf-8'));
    return data.surah;
  }

  private incrementSurah() {
    const current = this.getCurrentSurah();
    const next = current >= 114 ? 1 : current + 1;
    fs.writeFileSync('surah.json', JSON.stringify({ surah: next }));
  }

  private resetSurah() {
    fs.writeFileSync('surah.json', JSON.stringify({ surah: 1 }));
  }

  private splitMessage(text: string, limit: number): string[] {
    const parts: string[] = [];
    while (text.length > 0) {
      parts.push(text.substring(0, limit));
      text = text.substring(limit);
    }
    return parts;
  }
}

@Update()
export class BotUpdate {
  constructor(private readonly usersService: UsersService) {}

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

    await this.usersService.findOrCreateUser({
      telegramId: telegramId.toString(),
      isBot,
      firstName,
      lastName,
      username,
    });

    //await ctx.reply('Quyidagi menyudan tanlang:', buttons);
    await ctx.reply('Darsni boshlash tugmasini bosing:', buttons);

    /*await ctx.reply('Asosiy menyu:', {
      reply_markup: {
        keyboard: [
          [{ text: '📖 Darsni boshlash' }],
          [{ text: '🕋 Tasbeh' }, { text: '📚 Ma’lumotlar' }],
          [{ text: '⚙️ Sozlamalar' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });*/
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

    const user = await this.usersService.getUserByTelegramId(telegramId.toString())
    await ctx.reply(`${user?.createdAt}`);
    /*if (user) {
      
    }*/

    /*await ctx.answerCbQuery();
    await ctx.reply(
      `📚 Siz Qur’on darslariga muvaffaqiyatli a'zo bo‘ldingiz!

        🌙 Endi har kuni soat 19:00 da sizga bitta sura yuboriladi. Bu sura:
        - Arab tilida matn bilan
        - O‘zbekcha tarjima yoki tafsir

        📖 Ilm olish yo‘lida harakat qilgan bandaga Alloh yengillik beradi. Siz ham bu yo‘ldasiz!

        🕋 Qur’on bilan qalbingizni tozalang, hayotingizni yoriting!`,
    );*/
  }

  @Help()
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
  }
}
