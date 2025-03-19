import { Update, Ctx, Start, Action, Hears } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Cron } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { User, Message } from 'telegraf/types';
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

    await ctx.replyWithHTML(TEXTS.MESSAGES.START, replyMenu);
  }

  @Hears(TEXTS.COMMANDS.START_LESSON)
  async onStartLesson(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const lastLesson = await this.lessonsService.getLastLesson(telegramIdStr);
    const draftLesson = await this.lessonsService.getDraft(telegramIdStr);

    const confirmButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          TEXTS.BUTTONS.CONFIRM_DRAFT,
          TEXTS.ACTIONS.CONFIRM_DRAFT,
        ),
      ],
      [
        Markup.button.callback(
          TEXTS.BUTTONS.CANCEL_DRAFT,
          TEXTS.ACTIONS.CANCEL_DRAFT,
        ),
      ],
    ]);

    if (draftLesson) {
      switch (draftLesson.translator) {
        case TRANSLATIONS.UZBEK: {
          await ctx.replyWithHTML(
            TEXTS.MESSAGES.TRANSLATOR_INFO(TEXTS.BUTTONS.TRANSLATORS.UZBEK),
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.RUSSIAN: {
          await ctx.replyWithHTML(
            TEXTS.MESSAGES.TRANSLATOR_INFO(TEXTS.BUTTONS.TRANSLATORS.RUSSIAN),
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.ENGLISH: {
          await ctx.replyWithHTML(
            TEXTS.MESSAGES.TRANSLATOR_INFO(TEXTS.BUTTONS.TRANSLATORS.ENGLISH),
            confirmButtons,
          );
          break;
        }
        case TRANSLATIONS.TURKISH: {
          await ctx.replyWithHTML(
            TEXTS.MESSAGES.TRANSLATOR_INFO(TEXTS.BUTTONS.TRANSLATORS.TURKISH),
            confirmButtons,
          );
          break;
        }
      }
    } else if (lastLesson?.status === LessonStatus.ACTIVE) {
      const lessonControlButtons = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            TEXTS.BUTTONS.CONTINUE_LESSON,
            TEXTS.ACTIONS.CONTINUE_LESSON,
          ),
        ],
        [
          Markup.button.callback(
            TEXTS.BUTTONS.CANCEL_LESSON,
            TEXTS.ACTIONS.CANCEL_LESSON,
          ),
        ],
      ]);

      await ctx.reply(
        TEXTS.MESSAGES.ACTIVE_LESSON_EXISTS,
        lessonControlButtons,
      );
    } else {
      const translationKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            TEXTS.BUTTONS.TRANSLATORS.UZBEK,
            TEXTS.ACTIONS.TRANSLATOR.UZBEK,
          ),
        ],
        [
          Markup.button.callback(
            TEXTS.BUTTONS.TRANSLATORS.RUSSIAN,
            TEXTS.ACTIONS.TRANSLATOR.RUSSIAN,
          ),
        ],
        [
          Markup.button.callback(
            TEXTS.BUTTONS.TRANSLATORS.ENGLISH,
            TEXTS.ACTIONS.TRANSLATOR.ENGLISH,
          ),
        ],
        [
          Markup.button.callback(
            TEXTS.BUTTONS.TRANSLATORS.TURKISH,
            TEXTS.ACTIONS.TRANSLATOR.TURKISH,
          ),
        ],
      ]);

      await ctx.reply(TEXTS.MESSAGES.SELECT_TRANSLATOR, translationKeyboard);
    }
  }

  @Hears(TEXTS.COMMANDS.SEARCH_AYAH)
  async onSearchAyah(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(TEXTS.MESSAGES.SEARCH_AYAH);
  }

  @Hears(TEXTS.COMMANDS.ABOUT)
  async onAbout(@Ctx() ctx: Context) {
    await ctx.replyWithHTML(TEXTS.MESSAGES.ABOUT);
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
      [
        Markup.button.callback(
          TEXTS.BUTTONS.LANGUAGES.UZBEK,
          TEXTS.ACTIONS.LANGUAGES.UZBEK,
        ),
      ],
      [
        Markup.button.callback(
          TEXTS.BUTTONS.LANGUAGES.RUSSIAN,
          TEXTS.ACTIONS.LANGUAGES.RUSSIAN,
        ),
      ],
      [
        Markup.button.callback(
          TEXTS.BUTTONS.LANGUAGES.ENGLISH,
          TEXTS.ACTIONS.LANGUAGES.ENGLISH,
        ),
      ],
    ]);

    await ctx.reply(TEXTS.MESSAGES.SELECT_LANGUAGE, translateButtons);
  }

  @Hears(/^(\d{1,3}):(\d{1,3})$/)
  async onAyahInput(@Ctx() ctx: Context) {
    const { id: telegramId } = ctx.from as User;
    const message =
      ctx.message && 'text' in ctx.message ? ctx.message.text : null;
    const telegramIdStr = telegramId.toString();

    const match = message?.match(/^(\d{1,3}):(\d{1,3})$/);
    if (!match) {
      await ctx.replyWithHTML(TEXTS.MESSAGES.SEARCH_AYAH);
      return;
    }

    const surahNumber = parseInt(match[1], 10);
    const ayahNumber = parseInt(match[2], 10);

    if (surahNumber < 1 || surahNumber > 114) {
      await ctx.reply(TEXTS.VALIDATION.INVALID_SURAH);
      return;
    }

    if (ayahNumber < 1) {
      await ctx.reply(TEXTS.VALIDATION.INVALID_AYAH);
      return;
    }

    const maxAyahs = this.userProgressesService.getNumberOfAyahs(surahNumber);

    if (maxAyahs !== null && maxAyahs < ayahNumber) {
      await ctx.reply(TEXTS.VALIDATION.INVALID_RANGE);
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
      await ctx.reply(TEXTS.VALIDATION.LOAD_ERROR);
      return;
    }

    let replyText = TEXTS.MESSAGES.AYAH(
      surahNumber,
      ayahNumber,
      arabicAyah.verseText ?? '',
      translatedAyah.verseText ?? '',
    );

    if (translatedAyah.verseFootnote) {
      replyText += TEXTS.MESSAGES.FOOTNOTE(translatedAyah.verseFootnote);
    }

    await ctx.replyWithHTML(replyText);
  }

  @Action(TEXTS.ACTIONS.PREV)
  async onPrev(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const current =
      await this.userProgressesService.getUserPosition(telegramIdStr);
    if (!current) {
      await ctx.reply(TEXTS.VALIDATION.NO_LESSON);
      return;
    }

    let prevSurah = current.surahNumber;
    let prevAyah = current.ayahNumber - 1;

    if (prevAyah < 1) {
      prevSurah--;
      if (prevSurah < 1) {
        await ctx.reply(TEXTS.MESSAGES.FIRST_VERSE);
        return;
      }
      prevAyah = this.userProgressesService.getNumberOfAyahs(prevSurah) || 1;
      await ctx.reply(TEXTS.MESSAGES.SURAH_START);
    }

    const translator = await this.lessonsService.getTranslator(telegramIdStr);
    if (!translator) return;

    const arabicAyah = this.userProgressesService.getAyah(
      prevSurah,
      prevAyah,
      TRANSLATIONS.ARABIC,
    );
    const translatedAyah = this.userProgressesService.getAyah(
      prevSurah,
      prevAyah,
      translator,
    );

    if (!(arabicAyah && translatedAyah)) {
      await ctx.reply(TEXTS.VALIDATION.LOAD_ERROR);
      return;
    }

    await this.userProgressesService.updateUserPosition(
      telegramIdStr,
      prevSurah,
      prevAyah,
    );

    /*try {
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
    } catch (err) {
      if (err.response && err.response.statusCode === 400) {
        await this.userProgressesService.deleteButtonAction(telegramIdStr);
      }
    }*/

    let replyText = TEXTS.MESSAGES.AYAH(
      prevSurah,
      prevAyah,
      arabicAyah.verseText,
      translatedAyah.verseText,
    );

    if (translatedAyah.verseFootnote) {
      replyText += TEXTS.MESSAGES.FOOTNOTE(translatedAyah.verseFootnote);
    }

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback(TEXTS.BUTTONS.PREV, TEXTS.ACTIONS.PREV),
        Markup.button.callback(TEXTS.BUTTONS.CURRENT, TEXTS.ACTIONS.CURRENT),
        Markup.button.callback(TEXTS.BUTTONS.NEXT, TEXTS.ACTIONS.NEXT),
      ],
    ]);

    await ctx.editMessageText(replyText, {
      parse_mode: 'HTML',
      ...buttons,
    });

    //const msg = await ctx.replyWithHTML(replyText, buttons);

    /*if (msg?.message_id) {
      await this.userProgressesService.createButtonAction(
        telegramIdStr,
        msg.message_id,
      );
    }*/
  }

  @Action(TEXTS.ACTIONS.CURRENT)
  async onCurrent(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const progress = await this.userProgressesService.getUserPosition(
      telegramIdStr,
      TEXTS.ACTIONS.CURRENT,
    );
    if (!progress) {
      await ctx.reply(TEXTS.VALIDATION.NO_LESSON);
      return;
    }

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
      await ctx.reply(TEXTS.VALIDATION.LOAD_ERROR);
      return;
    }

    await this.userProgressesService.updateUserPosition(
      telegramIdStr,
      progress.surahNumber,
      progress.ayahNumber,
    );

    /*try {
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
    } catch (err) {
      if (err.response && err.response.statusCode === 400) {
        await this.userProgressesService.deleteButtonAction(telegramIdStr);
      }
    }*/

    let replyText = TEXTS.MESSAGES.AYAH(
      progress.surahNumber,
      progress.ayahNumber,
      arabicAyah.verseText,
      translatedAyah.verseText,
    );

    if (translatedAyah.verseFootnote) {
      replyText += TEXTS.MESSAGES.FOOTNOTE(translatedAyah.verseFootnote);
    }

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback(TEXTS.BUTTONS.PREV, TEXTS.ACTIONS.PREV),
        Markup.button.callback(TEXTS.BUTTONS.CURRENT, TEXTS.ACTIONS.CURRENT),
        Markup.button.callback(TEXTS.BUTTONS.NEXT, TEXTS.ACTIONS.NEXT),
      ],
    ]);

    await ctx.editMessageText(replyText, {
      parse_mode: 'HTML',
      ...buttons,
    });

    //const msg = await ctx.replyWithHTML(replyText, buttons);

    /*if (msg?.message_id) {
      await this.userProgressesService.createButtonAction(
        telegramIdStr,
        msg.message_id,
      );
    }*/
  }

  @Action(TEXTS.ACTIONS.NEXT)
  async onNext(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const current =
      await this.userProgressesService.getUserPosition(telegramIdStr);
    if (!current) {
      await ctx.reply(TEXTS.VALIDATION.NO_LESSON);
      return;
    }

    const maxAyahs = this.userProgressesService.getNumberOfAyahs(
      current.surahNumber,
    );

    let nextSurah = current.surahNumber;
    let nextAyah = current.ayahNumber + 1;

    if (maxAyahs !== null && nextAyah > maxAyahs) {
      nextSurah++;
      nextAyah = 1;
      await ctx.reply(TEXTS.MESSAGES.SURAH_END);
    }

    if (nextSurah > 114) {
      await this.lessonsService.completeLesson(telegramIdStr);
      await ctx.reply(TEXTS.MESSAGES.QURAN_COMPLETE);
      return;
    }

    const translator = await this.lessonsService.getTranslator(telegramIdStr);
    if (!translator) return;

    const arabicAyah = this.userProgressesService.getAyah(
      nextSurah,
      nextAyah,
      TRANSLATIONS.ARABIC,
    );
    const translatedAyah = this.userProgressesService.getAyah(
      nextSurah,
      nextAyah,
      translator,
    );

    if (!(arabicAyah && translatedAyah)) {
      await ctx.reply(TEXTS.VALIDATION.LOAD_ERROR);
      return;
    }

    await this.userProgressesService.updateUserPosition(
      telegramIdStr,
      nextSurah,
      nextAyah,
    );

    /*try {
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
    } catch (err) {
      if (err.response && err.response.statusCode === 400) {
        await this.userProgressesService.deleteButtonAction(telegramIdStr);
      }
    }*/

    let replyText = TEXTS.MESSAGES.AYAH(
      nextSurah,
      nextAyah,
      arabicAyah.verseText,
      translatedAyah.verseText,
    );

    if (translatedAyah.verseFootnote) {
      replyText += TEXTS.MESSAGES.FOOTNOTE(translatedAyah.verseFootnote);
    }

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback(TEXTS.BUTTONS.PREV, TEXTS.ACTIONS.PREV),
        Markup.button.callback(TEXTS.BUTTONS.CURRENT, TEXTS.ACTIONS.CURRENT),
        Markup.button.callback(TEXTS.BUTTONS.NEXT, TEXTS.ACTIONS.NEXT),
      ],
    ]);

    await ctx.editMessageText(replyText, {
      parse_mode: 'HTML',
      ...buttons,
    });

    //const msg = await ctx.replyWithHTML(replyText, buttons);

    /*if (msg?.message_id) {
      await this.userProgressesService.createButtonAction(
        telegramIdStr,
        msg.message_id,
      );
    }*/
  }

  @Action(TEXTS.ACTIONS.CONTINUE_LESSON)
  async onContinueLesson(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const progress =
      await this.userProgressesService.getUserPosition(telegramIdStr);
    if (!progress) {
      await ctx.reply(TEXTS.VALIDATION.NO_LESSON);
      return;
    }

    const translator = await this.lessonsService.getTranslator(telegramIdStr);
    if (!translator) return;

    await ctx.editMessageText(TEXTS.MESSAGES.CONFIRM_SUCCESS(translator));

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
      await ctx.reply(TEXTS.VALIDATION.LOAD_ERROR);
      return;
    }

    try {
      const buttonAction =
        await this.userProgressesService.getButtonAction(telegramIdStr);
      if (buttonAction) {
        /*await this.bot.telegram.editMessageReplyMarkup(
          telegramId,
          buttonAction.messageId,
          undefined,
          undefined,
        );*/
        await this.bot.telegram.deleteMessage(telegramId, buttonAction.messageId);
      }
    } catch (err) {
      if (err.response && err.response.statusCode === 400) {
        await this.userProgressesService.deleteButtonAction(telegramIdStr);
      }
    }

    await ctx.reply(TEXTS.MESSAGES.WELCOME_BACK);

    let replyText = TEXTS.MESSAGES.AYAH(
      progress.surahNumber,
      progress.ayahNumber,
      arabicAyah.verseText,
      translatedAyah.verseText,
    );

    if (translatedAyah.verseFootnote) {
      replyText += TEXTS.MESSAGES.FOOTNOTE(translatedAyah.verseFootnote);
    }

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback(TEXTS.BUTTONS.PREV, TEXTS.ACTIONS.PREV),
        Markup.button.callback(TEXTS.BUTTONS.CURRENT, TEXTS.ACTIONS.CURRENT),
        Markup.button.callback(TEXTS.BUTTONS.NEXT, TEXTS.ACTIONS.NEXT),
      ],
    ]);

    const msg = await ctx.replyWithHTML(replyText, buttons);

    if (msg?.message_id) {
      await this.userProgressesService.createButtonAction(
        telegramIdStr,
        msg.message_id,
      );
    }
  }

  @Action(TEXTS.ACTIONS.CANCEL_LESSON)
  async onCancelLesson(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    const lesson = await this.lessonsService.cancelLesson(telegramIdStr);
    if (!lesson) return;

    const translatorText = TEXTS.TRANSLATOR_LABELS[lesson.translator];

    try {
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
    } catch (err) {
      if (err.response && err.response.statusCode === 400) {
        await this.userProgressesService.deleteButtonAction(telegramIdStr);
      }
    }

    await ctx.editMessageText(TEXTS.MESSAGES.CANCEL_LESSON(translatorText));
  }

  @Action([
    TEXTS.ACTIONS.TRANSLATOR.UZBEK,
    TEXTS.ACTIONS.TRANSLATOR.RUSSIAN,
    TEXTS.ACTIONS.TRANSLATOR.ENGLISH,
    TEXTS.ACTIONS.TRANSLATOR.TURKISH,
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

    const confirmButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          TEXTS.BUTTONS.CONFIRM_DRAFT,
          TEXTS.ACTIONS.CONFIRM_DRAFT,
        ),
      ],
      [
        Markup.button.callback(
          TEXTS.BUTTONS.CANCEL_DRAFT,
          TEXTS.ACTIONS.CANCEL_DRAFT,
        ),
      ],
    ]);

    if (draftLesson) {
      const translatorText = TEXTS.TRANSLATOR_LABELS[draftLesson.translator];
      await ctx.replyWithHTML(
        TEXTS.MESSAGES.TRANSLATOR_INFO(translatorText),
        confirmButtons,
      );
      return;
    }

    if (lastLesson?.status === LessonStatus.ACTIVE) {
      const lessonControlButtons = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            TEXTS.BUTTONS.CONTINUE_LESSON,
            TEXTS.ACTIONS.CONTINUE_LESSON,
          ),
        ],
        [
          Markup.button.callback(
            TEXTS.BUTTONS.CANCEL_LESSON,
            TEXTS.ACTIONS.CANCEL_LESSON,
          ),
        ],
      ]);

      await ctx.reply(
        TEXTS.MESSAGES.ACTIVE_LESSON_EXISTS,
        lessonControlButtons,
      );
      return;
    }

    let selectedTranslator: string | undefined;

    switch (action) {
      case TEXTS.ACTIONS.TRANSLATOR.UZBEK:
        selectedTranslator = TRANSLATIONS.UZBEK;
        break;
      case TEXTS.ACTIONS.TRANSLATOR.RUSSIAN:
        selectedTranslator = TRANSLATIONS.RUSSIAN;
        break;
      case TEXTS.ACTIONS.TRANSLATOR.ENGLISH:
        selectedTranslator = TRANSLATIONS.ENGLISH;
        break;
      case TEXTS.ACTIONS.TRANSLATOR.TURKISH:
        selectedTranslator = TRANSLATIONS.TURKISH;
        break;
    }

    if (selectedTranslator) {
      await this.lessonsService.saveDraft(telegramIdStr, selectedTranslator);

      const translatorText = TEXTS.TRANSLATOR_LABELS[selectedTranslator];

      await ctx.replyWithHTML(
        TEXTS.MESSAGES.TRANSLATOR_INFO(translatorText),
        confirmButtons,
      );
    }
  }

  @Action(TEXTS.ACTIONS.CONFIRM_DRAFT)
  async onConfirmDraft(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    try {
      const draftLesson = await this.lessonsService.confirmDraft(telegramIdStr);

      const buttons = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            TEXTS.BUTTONS.CONTINUE_LESSON,
            TEXTS.ACTIONS.CONTINUE_LESSON,
          ),
        ],
        [
          Markup.button.callback(
            TEXTS.BUTTONS.CANCEL_LESSON,
            TEXTS.ACTIONS.CANCEL_LESSON,
          ),
        ],
      ]);

      if (!draftLesson) return;

      const translatorText = TEXTS.TRANSLATOR_LABELS[draftLesson.translator];

      await ctx.editMessageText(
        TEXTS.MESSAGES.CONFIRM_SUCCESS(translatorText),
        buttons,
      );
    } catch (err) {
      await ctx.reply(TEXTS.VALIDATION.CONFIRM_ERROR);
    }
  }

  @Action(TEXTS.ACTIONS.CANCEL_DRAFT)
  async onCancelDraft(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();

    const { id: telegramId } = ctx.from as User;
    const telegramIdStr = telegramId.toString();

    try {
      const draftLesson = await this.lessonsService.cancelDraft(telegramIdStr);
      if (!draftLesson) return;

      const translatorText = TEXTS.TRANSLATOR_LABELS[draftLesson.translator];

      await ctx.editMessageText(TEXTS.MESSAGES.CANCEL_LESSON(translatorText));
    } catch (err) {
      await ctx.reply(TEXTS.VALIDATION.CANCEL_ERROR);
    }
  }

  @Cron('00 19 * * *') // Runs every day at 19:00 (server time UTC+2)
  async sendDailyAyah() {
    const telegramIds = await this.usersService.getAllTelegramIds();

    for (const telegramId of telegramIds) {
      const telegramIdStr = telegramId.toString();

      try {
        await this.lessonsService.createLesson(telegramIdStr);

        // clear old buttons
        try {
          const buttonAction =
            await this.userProgressesService.getButtonAction(telegramIdStr);
          if (buttonAction) {
            /*await this.bot.telegram.editMessageReplyMarkup(
              telegramId,
              buttonAction.messageId,
              undefined,
              undefined,
            );*/
            await this.bot.telegram.deleteMessage(telegramId, buttonAction.messageId);
          }
        } catch (err) {
          if (err.response && err.response.statusCode === 400) {
            await this.userProgressesService.deleteButtonAction(telegramIdStr);
          }
        }

        const current =
          await this.userProgressesService.getUserPosition(telegramIdStr, TEXTS.ACTIONS.CURRENT);
        if (!current) {
          await this.bot.telegram.sendMessage(
            telegramId,
            TEXTS.VALIDATION.NOT_STARTED,
            { parse_mode: 'HTML' },
          );
          continue;
        }

        const maxAyahs = this.userProgressesService.getNumberOfAyahs(
          current.surahNumber,
        );

        let nextSurah = current.surahNumber;
        let nextAyah = current.ayahNumber;

        if (!(current.surahNumber === 1 && current.ayahNumber === 1)) {
          nextAyah += 1;
        }

        if (maxAyahs !== null && nextAyah > maxAyahs) {
          nextSurah++;
          nextAyah = 1;

          await this.bot.telegram.sendMessage(
            telegramId,
            TEXTS.MESSAGES.SURAH_END,
            { parse_mode: 'HTML' },
          );
        }

        if (nextSurah > 114) {
          await this.lessonsService.completeLesson(telegramIdStr);
          await this.bot.telegram.sendMessage(
            telegramId,
            TEXTS.MESSAGES.QURAN_COMPLETE,
            {
              parse_mode: 'HTML',
            },
          );
          continue;
        }

        const translator =
          await this.lessonsService.getTranslator(telegramIdStr);
        if (!translator) return;

        const arabicAyah = this.userProgressesService.getAyah(
          nextSurah,
          nextAyah,
          TRANSLATIONS.ARABIC,
        );
        const translatedAyah = this.userProgressesService.getAyah(
          nextSurah,
          nextAyah,
          translator,
        );

        if (!(arabicAyah && translatedAyah)) {
          await this.bot.telegram.sendMessage(
            telegramId,
            TEXTS.VALIDATION.LOAD_ERROR,
            { parse_mode: 'HTML' },
          );
          continue;
        }

        await this.userProgressesService.updateUserPosition(
          telegramIdStr,
          nextSurah,
          nextAyah,
        );

        let replyText = TEXTS.MESSAGES.AYAH(
          nextSurah,
          nextAyah,
          arabicAyah.verseText,
          translatedAyah.verseText,
        );

        if (translatedAyah.verseFootnote) {
          replyText += TEXTS.MESSAGES.FOOTNOTE(translatedAyah.verseFootnote);
        }

        const buttons = Markup.inlineKeyboard([
          Markup.button.callback(TEXTS.BUTTONS.PREV, TEXTS.ACTIONS.PREV),
          Markup.button.callback(TEXTS.BUTTONS.CURRENT, TEXTS.ACTIONS.CURRENT),
          Markup.button.callback(TEXTS.BUTTONS.NEXT, TEXTS.ACTIONS.NEXT),
        ]).reply_markup;

        const msg = await this.bot.telegram.sendMessage(telegramId, replyText, {
          parse_mode: 'HTML',
          reply_markup: buttons,
        });

        if (msg?.message_id) {
          await this.userProgressesService.createButtonAction(
            telegramIdStr,
            msg.message_id,
          );
        }
      } catch (err) {
        await this.bot.telegram.sendMessage(
          telegramId,
          TEXTS.VALIDATION.SYSTEM_ERROR,
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
