'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale, isValidLocale } from '@/i18n/config';

const LANGUAGE_PREFERENCE_KEY = 'team-spark-language-preference';

interface LanguagePreference {
  locale: Locale;
  savedAt: string; // ISO date string
  source: 'user' | 'auto'; // Whether it was explicitly selected by user or auto-detected
}

/**
 * Hook for managing language preferences in localStorage
 * This is a client-side only hook that won't run during SSR
 */
export function useLanguagePreference(): {
  isClient: boolean;
  preference: LanguagePreference | null;
  savePreference: (locale: Locale, source?: 'user' | 'auto') => void;
  clearPreference: () => void;
  changeLanguage: (locale: Locale) => void;
  getCurrentLocale: () => string;
  isPreferenceMatched: () => boolean;
  getSuggestedLocale: () => string | null;
} {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [preference, setPreference] = useState<LanguagePreference | null>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load preference from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    try {
      const stored = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as LanguagePreference;
        if (isValidLocale(parsed.locale)) {
          setPreference(parsed);
        } else {
          // Invalid stored locale, remove it
          localStorage.removeItem(LANGUAGE_PREFERENCE_KEY);
        }
      }
    } catch (error) {
      // Invalid JSON or other error, clear the storage
      // Use console.warn since this is expected behavior for corrupted storage
      console.warn('Invalid language preference in storage, clearing:', error);
      localStorage.removeItem(LANGUAGE_PREFERENCE_KEY);
    }
  }, [isClient]);

  /**
   * Save language preference to localStorage
   */
  const savePreference = useCallback(
    (locale: Locale, source: 'user' | 'auto' = 'user') => {
      if (!isClient) return;

      const preference: LanguagePreference = {
        locale,
        savedAt: new Date().toISOString(),
        source,
      };

      try {
        localStorage.setItem(LANGUAGE_PREFERENCE_KEY, JSON.stringify(preference));
        setPreference(preference);
      } catch (error) {
        console.warn('Error saving language preference:', error);
      }
    },
    [isClient],
  );

  /**
   * Clear language preference from localStorage
   */
  const clearPreference = useCallback(() => {
    if (!isClient) return;

    try {
      localStorage.removeItem(LANGUAGE_PREFERENCE_KEY);
      setPreference(null);
    } catch (error) {
      console.warn('Error clearing language preference:', error);
    }
  }, [isClient]);

  /**
   * Change language and navigate to the new locale URL
   */
  const changeLanguage = useCallback(
    (newLocale: Locale) => {
      if (!isClient || !isValidLocale(newLocale)) return;

      // Save preference
      savePreference(newLocale, 'user');

      // Update URL to new locale
      const segments = pathname.split('/');
      const currentLocale = segments[1];

      let newPathname: string;
      if (locales.includes(currentLocale as Locale)) {
        // Replace existing locale
        segments[1] = newLocale;
        newPathname = segments.join('/');
      } else {
        // Add locale to path
        newPathname = `/${newLocale}${pathname}`;
      }

      // Navigate to new URL
      router.push(newPathname);
      router.refresh();
    },
    [isClient, pathname, router, savePreference],
  );

  /**
   * Get the current locale from the URL
   */
  const getCurrentLocale = useCallback((): string => {
    const segments = pathname.split('/');
    const urlLocale = segments[1];

    if (urlLocale !== undefined && urlLocale !== '' && isValidLocale(urlLocale)) {
      return urlLocale;
    }

    return '';
  }, [pathname]);

  /**
   * Check if the current URL locale matches the saved preference
   */
  const isPreferenceMatched = useCallback((): boolean => {
    if (!preference) return true; // No preference saved

    const currentLocale = getCurrentLocale();
    return currentLocale === preference.locale;
  }, [preference, getCurrentLocale]);

  /**
   * Get suggested locale based on browser language
   * This is only a suggestion and doesn't automatically redirect
   */
  const getSuggestedLocale = useCallback((): Locale | null => {
    if (!isClient) return null;

    const browserLang = navigator.language.toLowerCase();

    // Check for exact match
    for (const locale of locales) {
      if (browserLang.startsWith(locale)) {
        return locale;
      }
    }

    // Check for language family match (e.g., en-US matches en)
    const langFamily = browserLang.split('-')[0];
    if (langFamily !== undefined && langFamily !== '') {
      for (const locale of locales) {
        if (locale.startsWith(langFamily)) {
          return locale;
        }
      }
    }

    return null;
  }, [isClient]);

  return {
    preference,
    isClient,
    savePreference,
    clearPreference,
    changeLanguage,
    getCurrentLocale,
    isPreferenceMatched,
    getSuggestedLocale,
  };
}
