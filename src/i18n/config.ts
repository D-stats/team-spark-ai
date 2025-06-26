import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'ja'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  // Ensure locale is a string and validate it
  const typedLocale = locale as string;
  if (!typedLocale || !locales.includes(typedLocale as any)) notFound();

  return {
    locale: typedLocale,
    messages: (await import(`./messages/${typedLocale}.json`)).default,
  };
});
