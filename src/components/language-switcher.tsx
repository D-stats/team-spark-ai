'use client';

import { useLocale } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useLanguagePreference } from '@/hooks/use-language-preference';
import { type Locale, localeNames } from '@/i18n/config';

export function LanguageSwitcher(): JSX.Element {
  const locale = useLocale();
  const { changeLanguage, isClient } = useLanguagePreference();

  const handleLocaleChange = (newLocale: string): void => {
    changeLanguage(newLocale as Locale);
  };

  // Don't render during SSR to avoid hydration mismatch
  if (!isClient) {
    return <div className="h-10 w-[140px] animate-pulse rounded-md bg-muted/50" />;
  }

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[140px]" aria-label="Select language">
        <SelectValue>
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{localeNames[locale as Locale]}</span>
            <span className="sm:hidden">{locale.toUpperCase()}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(localeNames) as [Locale, string][]).map(([code, name]) => (
          <SelectItem key={code} value={code} className="flex items-center gap-2">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span>{name}</span>
              {locale === code && <span className="sr-only">(Current language)</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
