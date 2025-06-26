'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { languages, type LanguageCode } from '@/i18n/utils';
import { locales } from '@/i18n/config';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLocaleChange = (newLocale: string) => {
    // Remove the current locale from pathname if it exists
    const segments = pathname.split('/');
    const pathnameHasLocale = locales.some((l) => segments[1] === l);

    let newPathname = pathname;
    if (pathnameHasLocale) {
      segments[1] = newLocale;
      newPathname = segments.join('/');
    } else {
      // Add locale to pathname
      newPathname = `/${newLocale}${pathname}`;
    }

    router.push(newPathname);
    router.refresh();
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{languages[locale as LanguageCode].flag}</span>
            <span className="hidden sm:inline">{languages[locale as LanguageCode].nativeName}</span>
            <span className="sm:hidden">{languages[locale as LanguageCode].flag}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(languages) as LanguageCode[]).map((code) => (
          <SelectItem key={code} value={code}>
            <span className="flex items-center gap-2">
              <span>{languages[code].flag}</span>
              <span>{languages[code].nativeName}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
