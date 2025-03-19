export const TRANSLATIONS = {
  ARABIC: 'quran-simple',
  UZBEK: 'uz.mansour',
  ENGLISH: 'en.sahih',
  RUSSIAN: 'ru.kuliev',
  TURKISH: 'tr.diyanet',
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;
