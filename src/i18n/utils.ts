import { useTranslations as useNextIntlTranslations } from 'next-intl';
import { getTranslations as getNextIntlTranslations } from 'next-intl/server';

// Re-export for consistent usage across the app
export const useTranslations = useNextIntlTranslations;
export const getTranslations = getNextIntlTranslations;

// Helper to get nested translation keys
export function getNestedTranslation(
  translations: ReturnType<typeof useTranslations>,
  key: string,
  values?: Record<string, any>
): string {
  const keys = key.split('.');
  let result: any = translations;
  
  for (const k of keys) {
    if (result && typeof result === 'function') {
      result = result(k, values);
    } else if (result && typeof result === 'object') {
      result = result[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof result === 'string' ? result : key;
}

// Language utilities
export const languages = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
} as const;

export type LanguageCode = keyof typeof languages;

// Get language display name
export function getLanguageName(code: LanguageCode, native = false): string {
  const lang = languages[code];
  return native ? lang.nativeName : lang.name;
}

// Format date according to locale
export function formatDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

// Format number according to locale
export function formatNumber(number: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(number);
}

// Format currency according to locale
export function formatCurrency(amount: number, locale: string, currency = 'USD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

// Format relative time
export function formatRelativeTime(date: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];
  
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffInSeconds) >= secondsInUnit) {
      const value = Math.floor(diffInSeconds / secondsInUnit);
      return rtf.format(value, unit);
    }
  }
  
  return rtf.format(0, 'second');
}