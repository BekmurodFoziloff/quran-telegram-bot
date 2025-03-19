import { Update, Ctx, Start, On, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Cron } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { User } from 'telegraf/typings/core/types/typegram';
import { UsersService } from '../users/users.service';
import { LessonsService } from 'src/lessons/lessons.service';
import { UserProgressesService } from '../userProgresses/userProgresses.service';

@Update()
export class BotsService {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly usersService: UsersService,
    private readonly lessonsService: LessonsService,
    private readonly userProgressesService: UserProgressesService,
  ) {}

  @Start()
  async onStartCommand(@Ctx() ctx: Context) {
    const {
      id: telegramId,
      is_bot: isBot,
      first_name: firstName,
      last_name: lastName,
      username: username,
    } = ctx.from as User;

    await this.usersService.createUserIfNotExists({
      telegramId: telegramId.toString(),
      isBot,
      firstName,
      lastName,
      username,
    });

    const replyMenu = Markup.keyboard([
      ['ℹ️ Bot haqida', '📖 Darsni boshlash'],
      ['📊 Statistika', '🇺🇿/🇷🇺 Tilni o‘zgartirish'],
    ])
      .resize()
      .oneTime(false);

    await ctx.replyWithHTML(
      `🕌 <b>Assalomu alaykum, hurmatli foydalanuvchi!</b>\n\n` +
        `Siz eng ulug‘ ne’mat — <b>Qur’oni karim</b> bilan bog‘landingiz.\n` +
        `Har bir oyat — qalbga nur, hayotga yo‘l, dilga taskindir.\n\n` +
        `Endi siz Qur’onni har kuni oz-ozdan, <i>arabcha matni, o‘qilishi va tarjimasi</i> bilan birga tushunarli tarzda o‘qishingiz mumkin.\n\n` +
        `➡️ Boshlash uchun “<b>📖 Darsni boshlash</b>” tugmasini bosing.\n\n` +
        `📿 <i>Alloh bu amalingizni qabul qilsin va savoblaringizni ziyoda qilsin!</i>`,
      replyMenu,
    );
  }

  @On('text')
  async onTextMessage(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const message =
      ctx.message && 'text' in ctx.message ? ctx.message.text : null;

    if (message === '📖 Darsni boshlash') {
      const replyMenu = Markup.keyboard([
        ['🎧 Tinglash', '📖 O‘qish'],
        ['⏹️ Asosiy menu', '⬅️ Orqaga'],
      ])
        .resize()
        .oneTime(false);

      await ctx.replyWithHTML(
        `🕌 <b>Assalomu alaykum, hurmatli foydalanuvchi!</b>\n\n` +
          `Siz eng ulug‘ ne’mat — <b>Qur’oni karim</b> bilan bog‘landingiz.\n` +
          `Har bir oyat — qalbga nur, hayotga yo‘l, dilga taskindir.\n\n` +
          `Endi siz Qur’onni har kuni oz-ozdan, <i>arabcha matni, o‘qilishi va tarjimasi</i> bilan birga tushunarli tarzda o‘qishingiz mumkin.\n\n` +
          `➡️ Boshlash uchun “<b>📖 Darsni boshlash</b>” tugmasini bosing.\n\n` +
          `📿 <i>Alloh bu amalingizni qabul qilsin va savoblaringizni ziyoda qilsin!</i>`,
        replyMenu,
      );
      /*const user = await this.usersService.getUserByTelegramId(
        telegramId.toString(),
      );

      if (user) {
        await this.lessonsService.createLessonIfNotExists(
          telegramId.toString(),
        );

        const progress = await this.userProgressesService.getUserPosition(
          telegramId.toString(),
        );

        if (progress) {
          const ayah = await this.userProgressesService.getAyah(
            progress.surahNumber,
            progress.ayahNumber,
          );

          await ctx.reply('Qur’on darsiga xush kelibsiz!');

          let replyText = `📖 ${progress.surahNumber}:${progress.ayahNumber}\n\n${ayah.result.arabic_text}\n\n🔍 Tarjima: ${ayah.result.translation}`;
          const buttons = Markup.inlineKeyboard([
            [Markup.button.callback('📖 Hozirgi', 'current')],
            [Markup.button.callback('➡️ Keyingi', 'next')],
          ]);

          if (ayah.result.footnotes) {
            replyText += `\n\n📝 Ma'nosi: ${ayah.result.footnotes}`;
          }

          const msg = await ctx.reply(replyText, buttons);

          if (msg?.message_id) {
            await this.userProgressesService.createUserButtonActionIfNotExists(
              telegramId.toString(),
              msg.message_id,
            );
          }
        }
      }*/
    } else if (message === 'ℹ️ Bot haqida') {
      await ctx.replyWithHTML(
        `<b>🟢 Bot haqida</b>\n\n` +
          `Bu bot sizni Qur’on bilan doimiy bog‘lab turadi.\n\n` +
          `Har kuni soat <b>19:00</b> da sizga Qur’onning <b>bitta oyatini</b> yuboradi — <i>arabcha matni, o‘qilishi va mashhur tarjimalari</i> bilan birga.\n\n` +
          `<b>📖 O‘qish Qur’onning boshidan boshlanadi</b> va har bir dars orqali siz:\n` +
          `– Oyatni <b>to‘g‘ri o‘qishni</b>,\n` +
          `– <b>Ma’nosini anglashni</b>,\n` +
          `– <b>Turli tarjimalar orqali tafakkur qilishni</b> o‘rganasiz.\n\n` +
          `Bu — Qur’on bilan yuragingizni uyg‘otuvchi sayohat.\n` +
          `<b>Har bir harf savob, har bir kun baraka!</b>`,
      );
    } else if (message === '📊 Statistika') {
      const stats = await this.userProgressesService.getUserStats(
        telegramId.toString(),
      );

      if (stats) {
        const { total, streak, dailyStats } = stats;
        const replyText = this.userProgressesService.formatStatsMessage(
          total,
          streak,
          dailyStats,
        );

        await ctx.replyWithHTML(replyText);
      }
    } else if (message === '🇺🇿/🇷🇺 Tilni o‘zgartirish') {
      const buttons = Markup.inlineKeyboard([
        [Markup.button.callback('🇺🇿 O‘zbek', 'lang_uz')],
        [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
      ]);

      await ctx.reply('Tilni tanlang:', buttons);
    } else if (message === '⏹️ Asosiy menu' || message === '⬅️ Orqaga') {
      const replyMenu = Markup.keyboard([
        ['ℹ️ Bot haqida', '📖 Darsni boshlash'],
        ['📊 Statistika', '🇺🇿/🇷🇺 Tilni o‘zgartirish'],
      ])
        .resize()
        .oneTime(false);

      await ctx.replyWithHTML(
        `🕌 <b>Assalomu alaykum, hurmatli foydalanuvchi!</b>\n\n` +
          `Siz eng ulug‘ ne’mat — <b>Qur’oni karim</b> bilan bog‘landingiz.\n` +
          `Har bir oyat — qalbga nur, hayotga yo‘l, dilga taskindir.\n\n` +
          `Endi siz Qur’onni har kuni oz-ozdan, <i>arabcha matni, o‘qilishi va tarjimasi</i> bilan birga tushunarli tarzda o‘qishingiz mumkin.\n\n` +
          `➡️ Boshlash uchun “<b>📖 Darsni boshlash</b>” tugmasini bosing.\n\n` +
          `📿 <i>Alloh bu amalingizni qabul qilsin va savoblaringizni ziyoda qilsin!</i>`,
        replyMenu,
      );
    } else {
      await ctx.reply('Iltimos, menyudan tanlang.');
    }
  }

  @Action('current')
  async onCurrent(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const progress = await this.userProgressesService.getUserPosition(
      telegramId.toString(),
    );

    if (progress) {
      const ayah = await this.userProgressesService.getAyah(
        progress.surahNumber,
        progress.ayahNumber,
      );

      await ctx.editMessageReplyMarkup(undefined);

      let replyText = `📖 ${progress.surahNumber}:${progress.ayahNumber}\n\n${ayah.result.arabic_text}\n\n🔍 Tarjima: ${ayah.result.translation}`;
      const buttons = Markup.inlineKeyboard([
        [Markup.button.callback('📖 Hozirgi', 'current')],
        [Markup.button.callback('➡️ Keyingi', 'next')],
      ]);

      if (ayah.result.footnotes) {
        replyText += `\n\n📝 Ma'nosi: ${ayah.result.footnotes}`;
      }

      const msg = await ctx.reply(replyText, buttons);

      if (msg?.message_id) {
        await this.userProgressesService.createUserButtonActionIfNotExists(
          telegramId.toString(),
          msg.message_id,
        );
      }
    }
  }

  @Action('next')
  async onNext(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const current = await this.userProgressesService.getUserPosition(
      telegramId.toString(),
    );
    // Qur’on oyat sonini tekshirib olish
    /*const ayah = await this.userProgressesService.getAyah(
      current.surahNumber,
      current.ayahNumber,
    );*/
    // API'da shu mavjud
    //const maxAyahs = ayah.aya_count;
    if (current) {
      const maxAyahs = await this.userProgressesService.getNumberOfAyahs(
        current.surahNumber,
      );

      let nextSurah = current.surahNumber;
      let nextAyah = current.ayahNumber + 1;

      if (nextAyah > maxAyahs) {
        nextSurah++;
        nextAyah = 1;
        await ctx.reply('📘 Bu suraning oxiriga yetdingiz.');
      }

      if (nextSurah > 114) {
        await this.lessonsService.updateLesson(telegramId.toString());
        await ctx.reply('✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!');
        return;
      }

      const nextAyahData = await this.userProgressesService.getAyah(
        nextSurah,
        nextAyah,
      );

      await this.userProgressesService.updateUserPosition(
        telegramId.toString(),
        nextSurah,
        nextAyah,
      );
      await ctx.editMessageReplyMarkup(undefined);

      let replyText = `📖 ${nextSurah}:${nextAyah}\n\n${nextAyahData.result.arabic_text}\n\n🔍 Tarjima: ${nextAyahData.result.translation}`;
      const buttons = Markup.inlineKeyboard([
        [Markup.button.callback('📖 Hozirgi', 'current')],
        [Markup.button.callback('➡️ Keyingi', 'next')],
      ]);

      if (nextAyahData.result.footnotes) {
        replyText += `\n\n📝 Ma'nosi: ${nextAyahData.result.footnotes}`;
      }

      const msg = await ctx.reply(replyText, buttons);

      if (msg?.message_id) {
        await this.userProgressesService.createUserButtonActionIfNotExists(
          telegramId.toString(),
          msg.message_id,
        );
      }
    }
  }

  @Cron('00 17 * * *') // Har kuni 19:00 da
  async sendDailyAyah() {
    const telegramIds = await this.usersService.getAllTelegramIds();

    for (const telegramId of telegramIds) {
      try {
        await this.lessonsService.createLessonIfNotExists(
          telegramId.toString(),
        );

        const userButtonAction =
          await this.userProgressesService.getUserButtonActionBy(
            telegramId.toString(),
          );

        if (userButtonAction) {
          await this.bot.telegram.editMessageReplyMarkup(
            telegramId,
            userButtonAction.messageId,
            undefined,
            undefined, // tugmalarni olib tashlash
          );
        }

        const current = await this.userProgressesService.getUserPosition(
          telegramId.toString(),
        );

        if (current) {
          // API'da shu mavjud
          const maxAyahs = await this.userProgressesService.getNumberOfAyahs(
            current.surahNumber,
          );

          let nextSurah = current.surahNumber;
          let nextAyah = current.ayahNumber;

          if (!(current.surahNumber === 1 && current.ayahNumber === 1)) {
            nextAyah = current.ayahNumber + 1;
          }

          if (nextAyah > maxAyahs) {
            nextSurah++;
            nextAyah = 1;
            await this.bot.telegram.sendMessage(
              telegramId,
              '📘 Bu suraning oxiriga yetdingiz.',
              {
                parse_mode: 'HTML',
              },
            );
          }

          if (nextSurah > 114) {
            await this.lessonsService.updateLesson(telegramId.toString());
            await this.bot.telegram.sendMessage(
              telegramId,
              '✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!',
              {
                parse_mode: 'HTML',
              },
            );
            return;
          }

          const nextAyahData = await this.userProgressesService.getAyah(
            nextSurah,
            nextAyah,
          );

          await this.userProgressesService.updateUserPosition(
            telegramId.toString(),
            nextSurah,
            nextAyah,
          );

          let replyText = `📖 ${nextSurah}:${nextAyah}\n\n${nextAyahData.result.arabic_text}\n\n🔍 Tarjima: ${nextAyahData.result.translation}`;
          const buttons = Markup.inlineKeyboard([
            [Markup.button.callback('📖 Hozirgi', 'current')],
            [Markup.button.callback('➡️ Keyingi', 'next')],
          ]).reply_markup;

          if (nextAyahData.result.footnotes) {
            replyText += `\n\n📝 Ma'nosi: ${nextAyahData.result.footnotes}`;
          }

          const msg = await this.bot.telegram.sendMessage(
            telegramId,
            replyText,
            {
              parse_mode: 'HTML',
              reply_markup: buttons,
            },
          );

          if (msg?.message_id) {
            await this.userProgressesService.createUserButtonActionIfNotExists(
              telegramId.toString(),
              msg.message_id,
            );
          }
        }
      } catch (err) {
        console.error(`Error: ${telegramId} =>`, err.message);
      }
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
