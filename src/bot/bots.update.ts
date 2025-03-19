import { Update, Ctx, Start, On, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Cron } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { User } from 'telegraf/typings/core/types/typegram';
import { UsersService } from '../users/users.service';
import { BotsService } from './bot.service';
import { LessonsService } from 'src/lessons/lessons.service';
import { UserProgressesService } from '../userProgresses/userProgresses.service';

@Update()
export class BotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    private readonly usersService: UsersService,
    private readonly botsService: BotsService,
    private readonly lessonsService: LessonsService,
    private readonly progressesService: UserProgressesService,
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
      ["ℹ️ Ma'lumot", '🇺🇿/🇷🇺 Tilni o‘zgartirish'],
    ])
      .resize()
      .oneTime(false);
    await ctx.replyWithHTML(
      `🕌 <b>Assalomu alaykum, hurmatli foydalanuvchi!</b>\n\n` +
        `Siz eng ulug‘ ne’mat — <b>Qur’oni karim</b> bilan bog‘landingiz.\n` +
        `Har bir oyat — qalbga nur, hayotga yo‘l, dilga taskindir.\n\n` +
        `Endi siz Qur’onni har kuni oz-ozdan, <i>arabcha matni, o‘qilishi va tarjimasi</i> bilan birga tushunarli tarzda o‘qishingiz mumkin.\n\n` +
        `➡️ Boshlash uchun “<b>Darsni boshlash</b>” tugmasini bosing.\n\n` +
        `📿 <i>Alloh bu amalingizni qabul qilsin va savoblaringizni ziyoda qilsin!</i>`,
      replyMenu,
    );
  }

  @On('text')
  async onTextMessage(@Ctx() ctx: Context) {
    const {
      id: telegramId,
      is_bot: isBot,
      first_name: firstName,
      last_name: lastName,
      username: username,
    } = ctx.from as User;
    const message =
      ctx.message && 'text' in ctx.message ? ctx.message.text : null;

    if (message === '📖 Darsni boshlash') {
      const user = await this.usersService.getUserByTelegramId(
        telegramId.toString(),
      );

      if (user) {
        const lesson = await this.lessonsService.createLesson(
          telegramId.toString(),
        );

        const progress = await this.progressesService.getUserPosition(
          telegramId.toString(),
        );
        const ayah = await this.progressesService.getAyah(
          progress.surahNumber,
          progress.ayahNumber,
        );
        const buttons = Markup.inlineKeyboard([
          [Markup.button.callback('📖 Hozirgi', 'current')],
          [Markup.button.callback('➡️ Keyingi', 'next')],
        ]);

        await ctx.reply('Qur’on darsiga xush kelibsiz!');

        if (ayah.result.footnotes) {
          //await ctx.answerCbQuery();
          await ctx.reply(
            `📖 ${progress.surahNumber}:${progress.ayahNumber}\n\n${ayah.result.arabic_text}\n\n🔍 Tarjima: ${ayah.result.translation}\n\n📝 Ma'nosi: ${ayah.result.footnotes}`,
            buttons,
          );
        } else {
          //await ctx.answerCbQuery();
          await ctx.reply(
            `📖 ${progress.surahNumber}:${progress.ayahNumber}\n\n${ayah.result.arabic_text}\n\n🔍 Tarjima: ${ayah.result.translation}`,
            buttons,
          );
        }
      }
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
    } else if (message === '🇺🇿/🇷🇺 Tilni o‘zgartirish') {
      const buttons = Markup.inlineKeyboard([
        [Markup.button.callback('🇺🇿 O‘zbek', 'lang_uz')],
        [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
        [Markup.button.callback('🇬🇧 English', 'lang_en')],
      ]);

      await ctx.reply('Tilni tanlang:', buttons);
    } else {
      await ctx.reply('Iltimos, menyudan tanlang.');
    }
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
      const progress = await this.progressesService.getUserPosition(
        telegramId.toString(),
      );
      const ayah = await this.progressesService.getAyah(
        progress.surahNumber,
        progress.ayahNumber,
      );

      await ctx.editMessageReplyMarkup(undefined);

      const buttons = Markup.inlineKeyboard([
        [Markup.button.callback('📖 Hozirgi', 'current')],
        [Markup.button.callback('➡️ Keyingi', 'next')],
      ]);

      if (ayah.result.footnotes) {
        await ctx.answerCbQuery();
        await ctx.reply(
          `📖 ${progress.surahNumber}:${progress.ayahNumber}\n\n${ayah.result.arabic_text}\n\n🔍 Tarjima: ${ayah.result.translation}\n\n📝 Ma'nosi: ${ayah.result.footnotes}`,
          buttons,
        );
      } else {
        await ctx.answerCbQuery();
        await ctx.reply(
          `📖 ${progress.surahNumber}:${progress.ayahNumber}\n\n${ayah.result.arabic_text}\n\n🔍 Tarjima: ${ayah.result.translation}`,
          buttons,
        );
      }
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

    const current = await this.progressesService.getUserPosition(
      telegramId.toString(),
    );

    // Qur’on oyat sonini tekshirib olish
    /*const ayah = await this.progressesService.getAyah(
      current.surahNumber,
      current.ayahNumber,
    );*/
    // API'da shu mavjud
    //const maxAyahs = ayah.aya_count;
    const maxAyahs = await this.progressesService.getNumberOfAyahs(
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
      await ctx.reply('✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!');
      return;
    }

    const nextAyahData = await this.progressesService.getAyah(
      nextSurah,
      nextAyah,
    );

    await this.progressesService.updateUserPosition(
      telegramId.toString(),
      nextSurah,
      nextAyah,
    );
    await ctx.editMessageReplyMarkup(undefined);

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Hozirgi', 'current')],
      [Markup.button.callback('➡️ Keyingi', 'next')],
    ]);

    if (nextAyahData.result.footnotes) {
      await ctx.answerCbQuery();
      const message = await ctx.reply(
        `📖 ${nextSurah}:${nextAyah}\n\n${nextAyahData.result.arabic_text}\n\n🔍 Tarjima: ${nextAyahData.result.translation}\n\n📝 Ma'nosi: ${nextAyahData.result.footnotes}`,
        buttons,
      );
      console.log(message.message_id);
    } else {
      await ctx.answerCbQuery();
      const message = await ctx.reply(
        `📖 ${nextSurah}:${nextAyah}\n\n${nextAyahData.result.arabic_text}\n\n🔍 Tarjima: ${nextAyahData.result.translation}`,
        buttons,
      );
      console.log(message.message_id);
    }
  }

  @Cron('49 14 * * *') // Har kuni 19:00 da
  async sendDailyAyah() {
    const telegramIds = await this.usersService.getAllTelegramIds();
    //const message = `📖 Bugungi oyatni o‘qidingizmi?\n\nBosing: 👉 /start`;

    for (const telegramId of telegramIds) {
      try {
        await this.bot.telegram.sendMessage(
          telegramId,
          '📖 Bugungi oyatni o‘qidingizmi?\n\n',
          {
            parse_mode: 'HTML',
            reply_markup: {
              remove_keyboard: true,
            },
          },
        );

        const current = await this.progressesService.getUserPosition(
          telegramId.toString(),
        );

        // API'da shu mavjud
        //const maxAyahs = ayah.aya_count;
        const maxAyahs = await this.progressesService.getNumberOfAyahs(
          current.surahNumber,
        );

        let nextSurah = current.surahNumber;
        let nextAyah = current.ayahNumber + 1;

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
          await this.bot.telegram.sendMessage(
            telegramId,
            '✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!',
            {
              parse_mode: 'HTML',
            },
          );
          return;
        }

        const nextAyahData = await this.progressesService.getAyah(
          nextSurah,
          nextAyah,
        );
        await this.progressesService.updateUserPosition(
          telegramId.toString(),
          nextSurah,
          nextAyah,
        );

        const buttons = Markup.inlineKeyboard([
          [Markup.button.callback('📖 Hozirgi', 'current')],
          [Markup.button.callback('➡️ Keyingi', 'next')],
        ]).reply_markup;

        if (nextAyahData.result.footnotes) {
          await this.bot.telegram.sendMessage(
            telegramId,
            `📖 ${nextSurah}:${nextAyah}\n\n${nextAyahData.result.arabic_text}\n\n🔍 Tarjima: ${nextAyahData.result.translation}\n\n📝 Ma'nosi: ${nextAyahData.result.footnotes}`,
            {
              parse_mode: 'HTML',
              reply_markup: buttons,
            },
          );
        } else {
          await this.bot.telegram.sendMessage(
            telegramId,
            `📖 ${nextSurah}:${nextAyah}\n\n${nextAyahData.result.arabic_text}\n\n🔍 Tarjima: ${nextAyahData.result.translation}`,
            {
              parse_mode: 'HTML',
              reply_markup: buttons,
            },
          );
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
