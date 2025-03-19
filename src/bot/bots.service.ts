import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as cron from 'node-cron';
import { Telegraf, Markup } from 'telegraf';
import * as fs from 'fs';

@Injectable()
export class BotsService implements OnModuleInit {
  private readonly bot = new Telegraf('7273242765:AAHLxiSvfZd3XHimjtYam7Zgn70qYzc81hk');
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
    /*this.bot.action('next', async (ctx) => {
      await this.sendSurah(ctx.chat.id);
      await ctx.answerCbQuery();
    });*/

    this.bot.action('current', async (ctx) => {
      const currentSurah = this.getCurrentSurah();
      const response = await axios.get(
        `https://api.quranenc.com/v1/translation/sura/uzbek_mansour/${currentSurah}`
      );
      const surahData = response.data;
      await ctx.reply(`📖 Hozirgi sura: *${surahData.sura_name}* (${currentSurah})`, { parse_mode: 'Markdown' });
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
        `https://api.quranenc.com/v1/translation/sura/uzbek_mansour/${currentSurah}`
      );
      const surahData = response.data;

      let message = `📖 *${surahData.sura_name}* \n\n`;

      surahData.ayahs.forEach((ayah: any) => {
        message += `${ayah.ayah} - ${ayah.text}\n`;
      });

      const chunks = this.splitMessage(message, 4000);

      for (const chunk of chunks) {
        await this.bot.telegram.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
      }

      this.incrementSurah();
    } catch (err) {
      console.error('Xatolik yuz berdi: ', err.message);
      await this.bot.telegram.sendMessage(chatId, '❌ Kechirasiz, sura olishda muammo yuz berdi.');
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
