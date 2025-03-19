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
    const ayah = this.userProgressesService.getAyah1(1, 5);
    console.log(ayah);

    const replyMenu = Markup.keyboard([
      ['ℹ️ Bot haqida', '📖 Darsni boshlash'],
      ['🔍 Oyat qidirish'],
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
    const telegramIdStr = telegramId.toString();

    if (message === '📖 Darsni boshlash') {
      const replyMenu = Markup.keyboard([
        ['➡️ Davom etish', '🌐 Tarjimon tanlash'],
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
      /*const user = await this.usersService.getUserByTelegramId(telegramIdStr);

      if (!user) return;

      await this.lessonsService.createLessonIfNotExists(telegramIdStr);

      const progress =
        await this.userProgressesService.getUserPosition(telegramIdStr);
      if (!progress) return;

      const ayah = await this.userProgressesService.getAyah(
        progress.surahNumber,
        progress.ayahNumber,
      );

      await ctx.reply('Qur’on darsiga xush kelibsiz!');

      let replyText = `📖 ${progress.surahNumber}:${progress.ayahNumber}\n\n${ayah.result.arabic_text}\n\n🔍 Tarjima: ${ayah.result.translation}`;

      if (ayah.result.footnotes) {
        replyText += `\n\n📝 Ma'nosi: ${ayah.result.footnotes}`;
      }

      const buttons = Markup.inlineKeyboard([
        [Markup.button.callback('📖 Hozirgi', 'current')],
        [Markup.button.callback('➡️ Keyingi', 'next')],
      ]);

      const msg = await ctx.reply(replyText, buttons);

      if (msg?.message_id) {
        await this.userProgressesService.createUserButtonActionIfNotExists(
          telegramIdStr,
          msg.message_id,
        );
      }*/
    } else if (message === '➡️ Davom etish') {
      
    } else if (message === '🌐 Tarjimon tanlash') {

    } else if (message === '🔍 Oyat qidirish') {
      await ctx.replyWithHTML(
        '<b>📖 Oyat qidirish qo‘llanmasi</b>\n\n' +
          'Oyatni qidirish uchun quyidagi formatda yozing:\n' +
          '<code>Sura:Oyat</code>\n\n' +
          '✅ <b>Misollar:</b>\n' +
          '- <code>1:1</code> — 1-sura, 1-oyat\n' +
          '- <code>2:255</code> — 2-sura, 255-oyat\n\n' +
          '⚠️ <b>Eslatma:</b>\n' +
          '- Sura raqami <code>1</code> dan <code>114</code> gacha bo‘lishi kerak\n' +
          '- Oyat raqami shu suradagi maksimal oyatdan oshmasligi kerak\n' +
          '- Raqamlar orasida faqat <code>:</code> belgisi bo‘lishi lozim',
      );
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
      const stats =
        await this.userProgressesService.getUserStats(telegramIdStr);

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
        ['🔍 Oyat qidirish'],
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
    } else if (message && message.match(/^(\d{1,3}):(\d{1,3})$/)) {
      const match = message.match(/^(\d{1,3}):(\d{1,3})$/);

      if (!match) return;

      const surahNumber = parseInt(match[1], 10);
      const ayahNumber = parseInt(match[2], 10);

      if (surahNumber < 1 || surahNumber > 114) {
        await ctx.reply('📖 Sura raqami 1 dan 114 gacha bo‘lishi kerak.');
        return;
      }

      if (ayahNumber < 1) {
        await ctx.reply('📖 Oyat raqami 1 dan boshlanadi.');
        return;
      }

      const maxAyahs =
        await this.userProgressesService.getNumberOfAyahs(surahNumber);

      if (maxAyahs < ayahNumber) {
        await ctx.reply(
          '❌ Iltimos, suradagi mavjud oyatlar doirasida raqam kiriting.',
        );
        return;
      }

      const ayah = await this.userProgressesService.getAyah(
        surahNumber,
        ayahNumber,
      );

      if (!ayah?.result) {
        await ctx.reply('❌ Oyat yuklab bo‘lmadi. Keyinroq urinib ko‘ring.');
        return;
      }

      let replyText = `📖 ${surahNumber}:${ayahNumber}\n\n${ayah.result.arabic_text ?? ''}\n\n🔍 Tarjima: ${ayah.result.translation ?? ''}`;

      if (ayah.result.footnotes) {
        replyText += `\n\n📝 Ma'nosi: ${ayah.result.footnotes}`;
      }

      await ctx.reply(replyText);
    } else {
      await ctx.reply('Iltimos, menyudan tanlang.');
    }
  }

  @Action('current')
  async onCurrent(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const stringTelegramId = telegramId.toString();

    // 1. Foydalanuvchi progressini olish
    const progress =
      await this.userProgressesService.getUserPosition(stringTelegramId);
    if (!progress) {
      await ctx.reply(
        '📍 Sizning progress topilmadi. Iltimos, darsni boshlang.',
      );
      return;
    }

    // 2. Ajratilgan oyatni olish
    const ayah = await this.userProgressesService.getAyah(
      progress.surahNumber,
      progress.ayahNumber,
    );
    if (!ayah?.result) {
      await ctx.reply('❌ Oyat topilmadi. Keyinroq urinib ko‘ring.');
      return;
    }

    // 3. Reply markupni tozalash (eskisini o'chirish)
    await ctx.editMessageReplyMarkup(undefined);

    // 4. Oyat matnini tayyorlash
    const { arabic_text, translation, footnotes } = ayah.result;
    let replyText =
      `📖 <b>${progress.surahNumber}:${progress.ayahNumber}</b>\n\n` +
      `${arabic_text}\n\n` +
      `🔍 <b>Tarjima:</b> ${translation}`;

    if (footnotes) {
      replyText += `\n\n📝 <b>Ma'nosi:</b> ${footnotes}`;
    }

    // 5. Tugmalar
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Hozirgi', 'current')],
      [Markup.button.callback('➡️ Keyingi', 'next')],
    ]);

    // 6. Yuborish
    const msg = await ctx.replyWithHTML(replyText, buttons);

    // 7. User button actionni saqlash
    if (msg?.message_id) {
      await this.userProgressesService.createUserButtonActionIfNotExists(
        stringTelegramId,
        msg.message_id,
      );
    }
  }

  @Action('next')
  async onNext(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const stringTelegramId = telegramId.toString();

    // 1. Hozirgi progressni olish
    const current =
      await this.userProgressesService.getUserPosition(stringTelegramId);
    if (!current) {
      await ctx.reply('❗ Siz hali hech qanday darsni boshlamagansiz.');
      return;
    }

    // 2. Joriy suradagi oyatlar soni
    const maxAyahs = await this.userProgressesService.getNumberOfAyahs(
      current.surahNumber,
    );

    // 3. Keyingi oyatni hisoblash
    let nextSurah = current.surahNumber;
    let nextAyah = current.ayahNumber + 1;

    if (nextAyah > maxAyahs) {
      nextSurah++;
      nextAyah = 1;
      await ctx.reply('📘 Bu suraning oxiriga yetdingiz.');
    }

    if (nextSurah > 114) {
      await this.lessonsService.updateLesson(stringTelegramId);
      await ctx.reply('✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!');
      return;
    }

    // 4. Keyingi oyatni olish
    const nextAyahData = await this.userProgressesService.getAyah(
      nextSurah,
      nextAyah,
    );
    if (!nextAyahData?.result) {
      await ctx.reply('❌ Oyat yuklab bo‘lmadi. Keyinroq urinib ko‘ring.');
      return;
    }

    const { arabic_text, translation, footnotes } = nextAyahData.result;

    // 5. Foydalanuvchi progressini yangilash
    await this.userProgressesService.updateUserPosition(
      stringTelegramId,
      nextSurah,
      nextAyah,
    );

    // 6. Eski markupni o‘chirish
    await ctx.editMessageReplyMarkup(undefined);

    // 7. Matn tayyorlash
    let replyText =
      `📖 <b>${nextSurah}:${nextAyah}</b>\n\n` +
      `${arabic_text}\n\n` +
      `🔍 <b>Tarjima:</b> ${translation}`;

    if (footnotes) {
      replyText += `\n\n📝 <b>Ma'nosi:</b> ${footnotes}`;
    }

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Hozirgi', 'current')],
      [Markup.button.callback('➡️ Keyingi', 'next')],
    ]);

    // 8. Oyatni yuborish
    const msg = await ctx.replyWithHTML(replyText, buttons);

    // 9. Tugmani log qilish
    if (msg?.message_id) {
      await this.userProgressesService.createUserButtonActionIfNotExists(
        stringTelegramId,
        msg.message_id,
      );
    }
  }

  @Cron('00 17 * * *') // Har kuni soat 19:00 (server UTC+2 bo‘lsa)
  async sendDailyAyah() {
    const telegramIds = await this.usersService.getAllTelegramIds();

    for (const telegramId of telegramIds) {
      const stringId = telegramId.toString();

      try {
        // 1. Dars boshlanmagan bo‘lsa, yangi dars yaratish
        await this.lessonsService.createLessonIfNotExists(stringId);

        // 2. Avvalgi tugmalarni tozalash
        const lastAction =
          await this.userProgressesService.getUserButtonActionBy(stringId);
        if (lastAction) {
          await this.bot.telegram.editMessageReplyMarkup(
            telegramId,
            lastAction.messageId,
            undefined,
            undefined,
          );
        }

        // 3. Hozirgi pozitsiyani olish
        const current =
          await this.userProgressesService.getUserPosition(stringId);
        if (!current) {
          await this.bot.telegram.sendMessage(
            telegramId,
            '❗ Siz hali Qur’on o‘qishni boshlamagansiz.',
            { parse_mode: 'HTML' },
          );
          continue;
        }

        const maxAyahs = await this.userProgressesService.getNumberOfAyahs(
          current.surahNumber,
        );

        // 4. Keyingi oyatni hisoblash
        let nextSurah = current.surahNumber;
        let nextAyah = current.ayahNumber;

        if (!(current.surahNumber === 1 && current.ayahNumber === 1)) {
          nextAyah += 1;
        }

        if (nextAyah > maxAyahs) {
          nextSurah++;
          nextAyah = 1;
          await this.bot.telegram.sendMessage(
            telegramId,
            '📘 Bu suraning oxiriga yetdingiz.',
            { parse_mode: 'HTML' },
          );
        }

        if (nextSurah > 114) {
          await this.lessonsService.updateLesson(stringId);
          await this.bot.telegram.sendMessage(
            telegramId,
            '✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!',
            { parse_mode: 'HTML' },
          );
          continue;
        }

        // 5. Oyatni olish
        const nextAyahData = await this.userProgressesService.getAyah(
          nextSurah,
          nextAyah,
        );
        if (!nextAyahData?.result) {
          await this.bot.telegram.sendMessage(
            telegramId,
            '❌ Oyatni yuklab bo‘lmadi. Iltimos, keyinroq urinib ko‘ring.',
            { parse_mode: 'HTML' },
          );
          continue;
        }

        const { arabic_text, translation, footnotes } = nextAyahData.result;

        // 6. Foydalanuvchi pozitsiyasini yangilash
        await this.userProgressesService.updateUserPosition(
          stringId,
          nextSurah,
          nextAyah,
        );

        // 7. Matn va tugmalarni tayyorlash
        let replyText = `📖 <b>${nextSurah}:${nextAyah}</b>\n\n${arabic_text}\n\n🔍 <b>Tarjima:</b> ${translation}`;
        if (footnotes) {
          replyText += `\n\n📝 <b>Ma'nosi:</b> ${footnotes}`;
        }

        const buttons = Markup.inlineKeyboard([
          [Markup.button.callback('📖 Hozirgi', 'current')],
          [Markup.button.callback('➡️ Keyingi', 'next')],
        ]).reply_markup;

        // 8. Xabar yuborish
        const msg = await this.bot.telegram.sendMessage(telegramId, replyText, {
          parse_mode: 'HTML',
          reply_markup: buttons,
        });

        // 9. Tugma harakatini log qilish
        if (msg?.message_id) {
          await this.userProgressesService.createUserButtonActionIfNotExists(
            stringId,
            msg.message_id,
          );
        }
      } catch (error) {
        console.error(`❌ [${telegramId}] Error:`, error.message || error);
        await this.bot.telegram.sendMessage(
          telegramId,
          '⚠️ Xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.',
        );
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
