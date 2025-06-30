import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'ja'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

// Locale display names
export const localeNames: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

// Check if a string is a valid locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get the best matching locale from Accept-Language header
export function getBestLocale(acceptLanguage: string | null): Locale {
  if (acceptLanguage === null || acceptLanguage === undefined || acceptLanguage === '')
    return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map((lang) => lang.trim().split(';')[0]?.split('-')[0])
    .filter((lang): lang is string => lang !== undefined)
    .filter(isValidLocale);

  return languages[0] || defaultLocale;
}

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is a string and validate it, fallback to default locale if invalid
  const typedLocale = locale as string;
  const validLocale =
    !typedLocale || !locales.includes(typedLocale as Locale)
      ? defaultLocale
      : (typedLocale as Locale);

  const messagesModule = (await import(`./messages/${validLocale}.json`)) as {
    default: Record<string, unknown>;
  };
  const messages = messagesModule.default;

  return {
    locale: validLocale,
    messages,
    timeZone: 'Asia/Tokyo', // You can make this dynamic based on locale
    now: new Date(),
  };
});
