import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

export function generateStaticParams(): Array<{ locale: string }> {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<{
  title: { template: string; default: string };
  description: string;
  metadataBase: URL;
  alternates: { languages: Record<string, string> };
  openGraph: { locale: string; alternateLocale: string[] };
}> {
  const validatedLocale = locale as Locale;

  return {
    title: {
      template: '%s | TeamSpark AI',
      default: 'TeamSpark AI',
    },
    description: 'AI-powered team communication and engagement platform',
    metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      locale: validatedLocale,
      alternateLocale: locales.filter((l) => l !== validatedLocale),
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}): Promise<JSX.Element> {
  // Validate that the incoming locale is supported
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const validatedLocale = locale as Locale;

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale: validatedLocale });

  return (
    <html lang={validatedLocale}>
      <head>
        {/* Hreflang tags for SEO */}
        {locales.map((l) => (
          <link
            key={l}
            rel="alternate"
            hrefLang={l}
            href={`${process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'}/${l}`}
          />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'}/en`}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={validatedLocale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
