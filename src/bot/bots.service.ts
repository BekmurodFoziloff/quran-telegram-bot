import { Update, Ctx, Start, Action, Hears } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Cron } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { User } from 'telegraf/typings/core/types/typegram';
import { Message } from 'telegraf/typings/core/types/typegram';
import { UsersService } from '../users/users.service';
import { LessonsService } from '../lessons/lessons.service';
import { UserProgressesService } from '../userProgresses/userProgresses.service';
import { LessonStatus } from '../common/enums/lessonStatus.enum';
import { TRANSLATIONS } from '../common/constants/translations.constant';
import { TEXTS } from '../common/constants/texts.constant';

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

    await this.usersService.createUser({
      telegramId: telegramId.toString(),
      isBot,
      firstName,
      lastName,
      username,
    });

    const replyMenu = Markup.keyboard([
      [TEXTS.COMMANDS.ABOUT, TEXTS.COMMANDS.START_LESSON],
      [TEXTS.COMMANDS.SEARCH_AYAH],
      [TEXTS.COMMANDS.STATS, TEXTS.COMMANDS.CHANGE_LANGUAGE],
    ])
      .resize()
      .oneTime(false);

    await ctx.replyWithHTML(TEXTS.START, replyMenu);
  }

  @Hears(TEXTS.COMMANDS.START_LESSON)
  async onStartLesson(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const lastLesson = await this.lessonsService.getLastLesson(telegramIdStr);
    const draftLesson = await this.lessonsService.getDraft(telegramIdStr);

    if (draftLesson) {
      const confirmButtons = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Darsni tasdiqlash', 'confirm_draft')],
        [Markup.button.callback('❌ Darsni bekor qilish', 'cancel_draft')],
      ]);

      switch (draftLesson.translator) {
        case TRANSLATIONS.UZBEK: {
          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇺🇿 O'zbekcha (Mansour)\n`,
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.RUSSIAN: {
          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇷🇺 Русский (Kuliev)\n`,
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.ENGLISH: {
          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇬🇧 English (Sahih)\n`,
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.TURKISH: {
          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇹🇷 Türkçe (Diyanet)\n`,
            confirmButtons,
          );
          break;
        }
      }
    } else if (lastLesson?.status === LessonStatus.ACTIVE) {
      const lessonControlButtons = Markup.inlineKeyboard([
        [Markup.button.callback('▶️ Davom etish', 'continue_lesson')],
        [Markup.button.callback('❌ Darsni bekor qilish', 'cancel_lesson')],
      ]);

      await ctx.reply(
        'Sizda davom etayotgan dars mavjud. Nima qilamiz?',
        lessonControlButtons,
      );
    } else {
      const translationKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🇺🇿 O'zbekcha (Mansour)",
            `translator:${TRANSLATIONS.UZBEK}`,
          ),
        ],
        [
          Markup.button.callback(
            '🇷🇺 Русский (Kuliev)',
            `translator:${TRANSLATIONS.RUSSIAN}`,
          ),
        ],
        [
          Markup.button.callback(
            '🇬🇧 English (Sahih)',
            `translator:${TRANSLATIONS.ENGLISH}`,
          ),
        ],
        [
          Markup.button.callback(
            '🇹🇷 Türkçe (Diyanet)',
            `translator:${TRANSLATIONS.TURKISH}`,
          ),
        ],
      ]);

      await ctx.reply('Tarjimonni tanlang:', translationKeyboard);
    }
  }

  @Hears(TEXTS.COMMANDS.SEARCH_AYAH)
  async onSearchAyah(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(TEXTS.SEARCH_AYAH);
  }

  @Hears(TEXTS.COMMANDS.ABOUT)
  async onAbout(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(TEXTS.ABOUT);
  }

  @Hears(TEXTS.COMMANDS.STATS)
  async onStats(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const stats = await this.userProgressesService.getUserStats(telegramIdStr);
    if (stats) {
      const { total, streak, dailyStats } = stats;
      const replyText = this.userProgressesService.formatStatsMessage(
        total,
        streak,
        dailyStats,
      );

      await ctx.replyWithHTML(replyText);
    }
  }

  @Hears(TEXTS.COMMANDS.CHANGE_LANGUAGE)
  async onChangeLanguage(@Ctx() ctx: Context) {
    const translateButtons = Markup.inlineKeyboard([
      [Markup.button.callback('🇺🇿 O‘zbek', 'lang_uz')],
      [Markup.button.callback('🇷🇺 Русский', 'lang_ru')],
      [Markup.button.callback('🇬🇧 English', 'lang_en')],
    ]);

    await ctx.reply('Tilni tanlang:', translateButtons);
  }

  @Hears(/^(\d{1,3}):(\d{1,3})$/)
  async onAyahInput(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const message =
      ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    const telegramIdStr = telegramId.toString();

    const match = message?.match(/^(\d{1,3}):(\d{1,3})$/);
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

    const maxAyahs = this.userProgressesService.getNumberOfAyahs(surahNumber);

    if (maxAyahs !== null && maxAyahs < ayahNumber) {
      await ctx.reply(
        '❌ Iltimos, suradagi mavjud oyatlar doirasida raqam kiriting.',
      );
      return;
    }

    const translator = await this.lessonsService.getTranslator(telegramIdStr);
    if (!translator) return;

    const arabicAyah = this.userProgressesService.getAyah(
      surahNumber,
      ayahNumber,
      TRANSLATIONS.ARABIC,
    );
    const translatedAyah = this.userProgressesService.getAyah(
      surahNumber,
      ayahNumber,
      translator,
    );

    if (!(arabicAyah && translatedAyah)) {
      await ctx.reply('❌ Oyat yuklab bo‘lmadi. Keyinroq urinib ko‘ring.');
      return;
    }

    let replyText = `📖 ${surahNumber}:${ayahNumber}\n\n${arabicAyah.verseText ?? ''}\n\n🔍 Tarjima: ${translatedAyah.verseText ?? ''}`;

    if (translatedAyah.verseFootnote) {
      replyText += `\n\n📝 Ma'nosi: ${translatedAyah.verseFootnote}`;
    }

    await ctx.reply(replyText);
  }

  @Action('current')
  async onCurrent(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    // 1. Get user progress
    const progress =
      await this.userProgressesService.getUserPosition(telegramIdStr);
    if (!progress) {
      await ctx.reply(
        '📍 Sizga tegishli jarayon topilmadi. Iltimos, darsni boshlang.',
      );
      return;
    }

    const translator = await this.lessonsService.getTranslator(telegramIdStr);
    if (!translator) return;

    // 2. Fetch the ayah at current position
    const arabicAyah = this.userProgressesService.getAyah(
      progress.surahNumber,
      progress.ayahNumber,
      TRANSLATIONS.ARABIC,
    );
    const translatedAyah = this.userProgressesService.getAyah(
      progress.surahNumber,
      progress.ayahNumber,
      translator,
    );

    if (!(arabicAyah && translatedAyah)) {
      await ctx.reply('❌ Oyat yuklab bo‘lmadi. Keyinroq urinib ko‘ring.');
      return;
    }

    // 3. Clear previous inline buttons (if any)
    const buttonAction =
      await this.userProgressesService.getButtonAction(telegramIdStr);
    if (buttonAction) {
      await this.bot.telegram.editMessageReplyMarkup(
        telegramId,
        buttonAction.messageId,
        undefined,
        undefined,
      );
    }

    // 4. Prepare ayah text
    let replyText =
      `📖 <b>${progress.surahNumber}:${progress.ayahNumber}</b>\n\n` +
      `${arabicAyah.verseText}\n\n` +
      `🔍 <b>Tarjima:</b> ${translatedAyah.verseText}`;

    if (translatedAyah.verseFootnote) {
      replyText += `\n\n📝 <b>Ma'nosi:</b> ${translatedAyah.verseFootnote}`;
    }

    // 5. Inline buttons
    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Hozirgi', 'current')],
      [Markup.button.callback('➡️ Keyingi', 'next')],
    ]);

    // 6. Send the message
    const msg = await ctx.replyWithHTML(replyText, buttons);

    // 7. Save user button action
    if (msg?.message_id) {
      await this.userProgressesService.createButtonAction(
        telegramIdStr,
        msg.message_id,
      );
    }
  }

  @Action('next')
  async onNext(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    // 1. Get current user progress
    const current =
      await this.userProgressesService.getUserPosition(telegramIdStr);
    if (!current) {
      await ctx.reply('❗ Siz hali hech qanday darsni boshlamagansiz.');
      return;
    }

    // 2. Get total ayahs of the current surah
    const maxAyahs = this.userProgressesService.getNumberOfAyahs(
      current.surahNumber,
    );

    // 3. Calculate the next ayah
    let nextSurah = current.surahNumber;
    let nextAyah = current.ayahNumber + 1;

    // If reached end of surah → move to next surah
    if (maxAyahs !== null && nextAyah > maxAyahs) {
      nextSurah++;
      nextAyah = 1;

      await ctx.reply('📘 Bu suraning oxiriga yetdingiz.');
    }

    // If beyond surah 114 → Quran reading finished
    if (nextSurah > 114) {
      await this.lessonsService.completeLesson(telegramIdStr);
      await ctx.reply('✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!');
      return;
    }

    const translator = await this.lessonsService.getTranslator(telegramIdStr);
    if (!translator) return;

    // 4. Fetch next ayah data
    const arabicAyah = this.userProgressesService.getAyah(
      nextAyah,
      nextSurah,
      TRANSLATIONS.ARABIC,
    );
    const translatedAyah = this.userProgressesService.getAyah(
      nextAyah,
      nextSurah,
      translator,
    );

    if (!(arabicAyah && translatedAyah)) {
      await ctx.reply('❌ Oyat yuklab bo‘lmadi. Keyinroq urinib ko‘ring.');
      return;
    }

    // 5. Update user progress
    await this.userProgressesService.updateUserPosition(
      telegramIdStr,
      nextSurah,
      nextAyah,
    );

    // 6. Clear previous inline buttons (if any)
    const buttonAction =
      await this.userProgressesService.getButtonAction(telegramIdStr);
    if (buttonAction) {
      await this.bot.telegram.editMessageReplyMarkup(
        telegramId,
        buttonAction.messageId,
        undefined,
        undefined,
      );
    }

    // 7. Prepare reply text
    let replyText =
      `📖 <b>${nextSurah}:${nextAyah}</b>\n\n` +
      `${arabicAyah.verseText}\n\n` +
      `🔍 <b>Tarjima:</b> ${translatedAyah.verseText}`;

    if (translatedAyah.verseFootnote) {
      replyText += `\n\n📝 <b>Ma'nosi:</b> ${translatedAyah.verseFootnote}`;
    }

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Hozirgi', 'current')],
      [Markup.button.callback('➡️ Keyingi', 'next')],
    ]);

    // 8. Send the ayah
    const msg = await ctx.replyWithHTML(replyText, buttons);

    // 9. Log button action
    if (msg?.message_id) {
      await this.userProgressesService.createButtonAction(
        telegramIdStr,
        msg.message_id,
      );
    }
  }

  @Action('continue_lesson')
  async onContinueLesson(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const progress =
      await this.userProgressesService.getUserPosition(telegramIdStr);
    if (!progress) return;

    const translator = await this.lessonsService.getTranslator(telegramIdStr);
    if (!translator) return;

    const arabicAyah = this.userProgressesService.getAyah(
      progress.surahNumber,
      progress.ayahNumber,
      TRANSLATIONS.ARABIC,
    );
    const translatedAyah = this.userProgressesService.getAyah(
      progress.surahNumber,
      progress.ayahNumber,
      translator,
    );

    if (!(arabicAyah && translatedAyah)) {
      await ctx.reply('❌ Oyat yuklab bo‘lmadi. Keyinroq urinib ko‘ring.');
      return;
    }

    // Clear previous inline buttons (if any)
    const buttonAction =
      await this.userProgressesService.getButtonAction(telegramIdStr);
    if (buttonAction) {
      await this.bot.telegram.editMessageReplyMarkup(
        telegramId,
        buttonAction.messageId,
        undefined,
        undefined,
      );
    }
    await ctx.reply('Qur’on darsiga xush kelibsiz!');

    let replyText = `📖 ${progress.surahNumber}:${progress.ayahNumber}\n\n${arabicAyah.verseText}\n\n🔍 Tarjima: ${translatedAyah.verseText}`;

    if (translatedAyah.verseFootnote) {
      replyText += `\n\n📝 Ma'nosi: ${translatedAyah.verseFootnote}`;
    }

    const buttons = Markup.inlineKeyboard([
      [Markup.button.callback('📖 Hozirgi', 'current')],
      [Markup.button.callback('➡️ Keyingi', 'next')],
    ]);

    const msg = await ctx.reply(replyText, buttons);

    if (msg?.message_id) {
      await this.userProgressesService.createButtonAction(
        telegramIdStr,
        msg.message_id,
      );
    }
  }

  @Action('cancel_lesson')
  async onCancelLesson(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const lesson = await this.lessonsService.cancelLesson(telegramIdStr);
    await ctx.editMessageText(
      `❌ Dars bekor qilindi!\n` +
        `📖 Tarjimon: ${lesson?.translator}\n` +
        `🔔 Agar xohlasangiz, yangi darsni boshlashingiz mumkin.`,
    );
  }

  @Action([
    `translator:${TRANSLATIONS.UZBEK}`,
    `translator:${TRANSLATIONS.RUSSIAN}`,
    `translator:${TRANSLATIONS.ENGLISH}`,
    `translator:${TRANSLATIONS.TURKISH}`,
  ])
  async onSaveDraft(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();
    let action: string | undefined;

    if (ctx.message && 'text' in ctx.message) {
      action = ctx.message.text.split(' ')[0];
    } else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      action = ctx.callbackQuery.data.split(' ')[0];
    }

    if (!action) return;

    const lastLesson = await this.lessonsService.getLastLesson(telegramIdStr);
    const draftLesson = await this.lessonsService.getDraft(telegramIdStr);

    if (draftLesson) {
      const confirmButtons = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Darsni tasdiqlash', 'confirm_draft')],
        [Markup.button.callback('❌ Darsni bekor qilish', 'cancel_draft')],
      ]);

      switch (draftLesson.translator) {
        case TRANSLATIONS.UZBEK: {
          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇺🇿 O'zbekcha (Mansour)\n`,
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.RUSSIAN: {
          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇷🇺 Русский (Kuliev)\n`,
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.ENGLISH: {
          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇬🇧 English (Sahih)\n`,
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.TURKISH: {
          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇹🇷 Türkçe (Diyanet)\n`,
            confirmButtons,
          );
          break;
        }
      }
    } else if (lastLesson?.status === LessonStatus.ACTIVE) {
      const lessonControlButtons = Markup.inlineKeyboard([
        [Markup.button.callback('▶️ Davom etish', 'continue_lesson')],
        [Markup.button.callback('❌ Darsni bekor qilish', 'cancel_lesson')],
      ]);

      await ctx.reply(
        'Sizda davom etayotgan dars mavjud. Nima qilamiz?',
        lessonControlButtons,
      );
    } else {
      const confirmButtons = Markup.inlineKeyboard([
        [Markup.button.callback('✅ Darsni tasdiqlash', 'confirm_draft')],
        [Markup.button.callback('❌ Darsni bekor qilish', 'cancel_draft')],
      ]);

      switch (action) {
        case `translator:${TRANSLATIONS.UZBEK}`: {
          await this.lessonsService.saveDraft(
            telegramIdStr,
            TRANSLATIONS.UZBEK,
          );

          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇺🇿 O'zbekcha (Mansour)\n`,
            confirmButtons,
          );
          break;
        }
        case `translator:${TRANSLATIONS.RUSSIAN}`: {
          await this.lessonsService.saveDraft(
            telegramIdStr,
            TRANSLATIONS.RUSSIAN,
          );

          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇷🇺 Русский (Kuliev)\n`,
            confirmButtons,
          );
          break;
        }
        case `translator:${TRANSLATIONS.ENGLISH}`: {
          await this.lessonsService.saveDraft(
            telegramIdStr,
            TRANSLATIONS.ENGLISH,
          );

          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇬🇧 English (Sahih)\n`,
            confirmButtons,
          );
          break;
        }
        case `translator:${TRANSLATIONS.TURKISH}`: {
          await this.lessonsService.saveDraft(
            telegramIdStr,
            TRANSLATIONS.TURKISH,
          );

          await ctx.replyWithHTML(
            `<b>📚 Yangi dars yaratildi</b>\n\n` +
              `<b>Tarjimon:</b> 🇹🇷 Türkçe (Diyanet)\n`,
            confirmButtons,
          );
          break;
        }
      }
    }
  }

  @Action('confirm_draft')
  async onConfirmDraft(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    try {
      const darftLesson = await this.lessonsService.confirmDraft(telegramIdStr);

      const buttons = Markup.inlineKeyboard([
        [Markup.button.callback('▶️ Davom etish', 'contunue_lesson')],
        [Markup.button.callback('❌ Darsni bekor qilish', 'cancel_lesson')],
      ]);

      await ctx.editMessageText(
        `✅ Dars tasdiqlandi!\n` +
          `📖 Tarjimon: ${darftLesson?.translator}\n` +
          `🔔 Endi oyatlarni ketma-ket o‘qishingiz mumkin.`,
        buttons,
      );
    } catch (error) {
      await ctx.reply('🚫 Sizda tasdiqlanadigan dars topilmadi.');
    }
  }

  @Action('cancel_draft')
  async onCancelDraft(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    try {
      const draftLesson = await this.lessonsService.cancelDraft(telegramIdStr);

      await ctx.editMessageText(
        `❌ Dars bekor qilindi!\n` +
          `📖 Tarjimon: ${draftLesson?.translator}\n` +
          `🔔 Agar xohlasangiz, yangi darsni boshlashingiz mumkin.`,
      );
    } catch (error) {
      await ctx.reply('🚫 Sizda bekor qilish uchun dars topilmadi.');
    }
  }

  @Cron('00 17 * * *') // Runs every day at 19:00 (server time UTC+2)
  async sendDailyAyah() {
    const telegramIds = await this.usersService.getAllTelegramIds();

    for (const telegramId of telegramIds) {
      const telegramIdStr = telegramId.toString();

      try {
        // 1. Create a new lesson if the user hasn’t started yet
        await this.lessonsService.createLesson(telegramIdStr);

        // 2. Clear previous inline buttons (if any)
        const buttonAction =
          await this.userProgressesService.getButtonAction(telegramIdStr);
        if (buttonAction) {
          await this.bot.telegram.editMessageReplyMarkup(
            telegramId,
            buttonAction.messageId,
            undefined,
            undefined,
          );
        }

        // 3. Get the user’s current reading position
        const current =
          await this.userProgressesService.getUserPosition(telegramIdStr);
        if (!current) {
          await this.bot.telegram.sendMessage(
            telegramId,
            '❗ Siz hali Qur’on o‘qishni boshlamagansiz.',
            { parse_mode: 'HTML' },
          );
          continue;
        }

        const maxAyahs = this.userProgressesService.getNumberOfAyahs(
          current.surahNumber,
        );

        // 4. Calculate the next ayah
        let nextSurah = current.surahNumber;
        let nextAyah = current.ayahNumber;

        // Skip increment for very first ayah (1:1)
        if (!(current.surahNumber === 1 && current.ayahNumber === 1)) {
          nextAyah += 1;
        }

        // If ayah exceeds current surah length, move to the next surah
        if (maxAyahs !== null && nextAyah > maxAyahs) {
          nextSurah++;
          nextAyah = 1;

          await this.bot.telegram.sendMessage(
            telegramId,
            '📘 Bu suraning oxiriga yetdingiz.',
            { parse_mode: 'HTML' },
          );
        }

        // If beyond Surah 114, the Qur’an reading is complete
        if (nextSurah > 114) {
          await this.lessonsService.completeLesson(telegramIdStr);
          await this.bot.telegram.sendMessage(
            telegramId,
            '✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!',
            { parse_mode: 'HTML' },
          );
          continue;
        }

        const translator =
          await this.lessonsService.getTranslator(telegramIdStr);
        if (!translator) return;

        // 5. Fetch the next ayah
        const arabicAyah = this.userProgressesService.getAyah(
          nextAyah,
          nextSurah,
          TRANSLATIONS.ARABIC,
        );
        const translatedAyah = this.userProgressesService.getAyah(
          nextAyah,
          nextSurah,
          translator,
        );

        if (!(arabicAyah && translatedAyah)) {
          await this.bot.telegram.sendMessage(
            telegramId,
            '❌ Oyatni yuklab bo‘lmadi. Iltimos, keyinroq urinib ko‘ring.',
            { parse_mode: 'HTML' },
          );
          continue;
        }

        // 6. Update user’s reading position
        await this.userProgressesService.updateUserPosition(
          telegramIdStr,
          nextSurah,
          nextAyah,
        );

        // 7. Prepare message text and inline buttons
        let replyText = `📖 <b>${nextSurah}:${nextAyah}</b>\n\n${arabicAyah.verseText}\n\n🔍 <b>Tarjima:</b> ${translatedAyah.verseText}`;

        if (translatedAyah.verseText) {
          replyText += `\n\n📝 <b>Ma'nosi:</b> ${translatedAyah.verseFootnote}`;
        }

        const buttons = Markup.inlineKeyboard([
          [Markup.button.callback('📖 Hozirgi', 'current')],
          [Markup.button.callback('➡️ Keyingi', 'next')],
        ]).reply_markup;

        // 8. Send the message to the user
        const msg = await this.bot.telegram.sendMessage(telegramId, replyText, {
          parse_mode: 'HTML',
          reply_markup: buttons,
        });

        // 9. Log the button action for this user
        if (msg?.message_id) {
          await this.userProgressesService.createButtonAction(
            telegramIdStr,
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
