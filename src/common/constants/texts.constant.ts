import { TRANSLATIONS } from './translations.constant';

export const TEXTS = {
  COMMANDS: {
    START_LESSON: '📖 Darsni boshlash',
    SEARCH_AYAH: '🔍 Oyat qidirish',
    ABOUT: 'ℹ️ Bot haqida',
    STATS: '📊 Statistika',
    CHANGE_LANGUAGE: '🇺🇿/🇷🇺 Tilni o‘zgartirish',
  },

  ACTIONS: {
    TRANSLATOR: {
      UZBEK: `translator:${TRANSLATIONS.UZBEK}`,
      RUSSIAN: `translator:${TRANSLATIONS.RUSSIAN}`,
      ENGLISH: `translator:${TRANSLATIONS.ENGLISH}`,
      TURKISH: `translator:${TRANSLATIONS.TURKISH}`,
    },
    CONFIRM_DRAFT: 'confirm_draft',
    CANCEL_DRAFT: 'cancel_draft',
    CONTINUE_LESSON: 'continue_lesson',
    CANCEL_LESSON: 'cancel_lesson',
    PREV: 'prev',
    CURRENT: 'current',
    NEXT: 'next',
    LANGUAGES: {
      UZBEK: 'lang_uz',
      RUSSIAN: 'lang_ru',
      ENGLISH: 'lang_en',
    },
  },

  MESSAGES: {
    START:
      `🕌 <b>Assalomu alaykum, hurmatli foydalanuvchi!</b>\n\n` +
      `Siz eng ulug‘ ne’mat — <b>Qur’oni karim</b> bilan bog‘landingiz.\n` +
      `Har bir oyat — qalbga nur, hayotga yo‘l, dilga taskindir.\n\n` +
      `Endi siz Qur’onni har kuni oz-ozdan, <i>arabcha matni, o‘qilishi va tarjimasi</i> bilan birga tushunarli tarzda o‘qishingiz mumkin.\n\n` +
      `➡️ Boshlash uchun “<b>📖 Darsni boshlash</b>” tugmasini bosing.\n\n` +
      `📿 <i>Alloh bu amalingizni qabul qilsin va savoblaringizni ziyoda qilsin!</i>`,
    ABOUT:
      `<b>🟢 Bot haqida</b>\n\n` +
      `Bu bot sizni Qur’on bilan doimiy bog‘lab turadi.\n\n` +
      `Har kuni soat <b>19:00</b> da sizga Qur’onning <b>bitta oyatini</b> yuboradi — <i>arabcha matni, o‘qilishi va mashhur tarjimalari</i> bilan birga.\n\n` +
      `<b>📖 O‘qish Qur’onning boshidan boshlanadi</b> va har bir dars orqali siz:\n` +
      `– Oyatni <b>to‘g‘ri o‘qishni</b>,\n` +
      `– <b>Ma’nosini anglashni</b>,\n` +
      `– <b>Turli tarjimalar orqali tafakkur qilishni</b> o‘rganasiz.\n\n` +
      `Bu — Qur’on bilan yuragingizni uyg‘otuvchi sayohat.\n` +
      `<b>Har bir harf savob, har bir kun baraka!</b>`,
    SEARCH_AYAH:
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
    SELECT_TRANSLATOR: 'Tarjimonni tanlang:',
    ACTIVE_LESSON_EXISTS: 'Sizda davom etayotgan dars mavjud. Nima qilamiz?',
    SELECT_LANGUAGE: 'Tilni tanlang:',
    SURAH_END: '📘 Bu suraning oxiriga yetdingiz.',
    QURAN_COMPLETE: '✅ Qur’on o‘qish yakunlandi. Tabriklaymiz!',
    WELCOME_BACK: 'Qur’on darsiga xush kelibsiz!',
    FIRST_VERSE: '📖 Bu Qur’onning birinchi oyati. Orqaga qaytish imkoni yo‘q.',
    SURAH_START: '📖 Yangi sura boshidan boshlandi.',

    TRANSLATOR_INFO: (translator: string) =>
      `<b>📚 Yangi dars yaratildi</b>\n\n<b>Tarjimon:</b> ${translator}\n`,

    AYAH: (surah: number, ayah: number, arabic: string, translation: string) =>
      `📖 <b>${surah}:${ayah}</b>\n\n${arabic}\n\n🔍 <b>Tarjima:</b> ${translation}`,

    FOOTNOTE: (footnote: string) => `\n\n📝 <b>Ma'nosi:</b> ${footnote}`,

    CANCEL_LESSON: (translator: string | null) =>
      `❌ Dars bekor qilindi!\n📖 Tarjimon: ${translator ?? 'Noma’lum'}\n` +
      `🔔 Agar xohlasangiz, yangi darsni boshlashingiz mumkin.`,

    CONFIRM_SUCCESS: (translator: string | null) =>
      `✅ Dars tasdiqlandi!\n📖 Tarjimon: ${translator ?? 'Noma’lum'}\n` +
      `🔔 Endi oyatlarni ketma-ket o‘qishingiz mumkin.`,
  },

  VALIDATION: {
    INVALID_SURAH: '📖 Sura raqami 1 dan 114 gacha bo‘lishi kerak.',
    INVALID_AYAH: '📖 Oyat raqami 1 dan boshlanadi.',
    INVALID_RANGE:
      '❌ Iltimos, suradagi mavjud oyatlar doirasida raqam kiriting.',
    LOAD_ERROR: '❌ Oyat yuklab bo‘lmadi. Keyinroq urinib ko‘ring.',
    NO_LESSON: '❗ Siz hali hech qanday darsni boshlamagansiz.',
    CONFIRM_ERROR: '🚫 Sizda tasdiqlanadigan dars topilmadi.',
    CANCEL_ERROR: '🚫 Sizda bekor qilish uchun dars topilmadi.',
    NOT_STARTED: '❗ Siz hali Qur’on o‘qishni boshlamagansiz.',
    SYSTEM_ERROR: '⚠️ Xatolik yuz berdi. Iltimos, keyinroq urinib ko‘ring.',
  },

  BUTTONS: {
    CONFIRM_DRAFT: '✅ Darsni tasdiqlash',
    CANCEL_DRAFT: '❌ Darsni bekor qilish',

    CONTINUE_LESSON: '▶️ Davom etish',
    CANCEL_LESSON: '❌ Darsni bekor qilish',

    PREV: '⬅️ Oldingi',
    CURRENT: '📖 Hozirgi',
    NEXT: '➡️ Keyingi',

    TRANSLATORS: {
      UZBEK: "🇺🇿 O'zbekcha (Mansour)",
      RUSSIAN: '🇷🇺 Русский (Kuliev)',
      ENGLISH: '🇬🇧 English (Sahih)',
      TURKISH: '🇹🇷 Türkçe (Diyanet)',
    },

    LANGUAGES: {
      UZBEK: '🇺🇿 O‘zbek',
      RUSSIAN: '🇷🇺 Русский',
      ENGLISH: '🇬🇧 English',
    },
  },

  TRANSLATOR_LABELS: {
    [TRANSLATIONS.UZBEK]: "🇺🇿 O'zbekcha (Mansour)",
    [TRANSLATIONS.RUSSIAN]: '🇷🇺 Русский (Kuliev)',
    [TRANSLATIONS.ENGLISH]: '🇬🇧 English (Sahih)',
    [TRANSLATIONS.TURKISH]: '🇹🇷 Türkçe (Diyanet)',
  },
};
