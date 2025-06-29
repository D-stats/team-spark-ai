'use client';

import { useEffect, useState } from 'react';
import { useLanguagePreference } from '@/hooks/use-language-preference';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Globe } from 'lucide-react';
import { type Locale } from '@/i18n/config';

/**
 * Component to initialize language preference on client side
 * Handles language suggestion based on browser settings
 */
export function LanguageInitializer(): JSX.Element | null {
  const {
    preference,
    isClient,
    getCurrentLocale,
    isPreferenceMatched,
    getSuggestedLocale,
    changeLanguage,
    savePreference,
  } = useLanguagePreference();

  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedLocale, setSuggestedLocale] = useState<Locale | null>(null);

  useEffect(() => {
    if (!isClient) return;

    // Check if we should redirect based on saved preference
    if (preference && !isPreferenceMatched()) {
      // User has a saved preference but current URL doesn't match
      changeLanguage(preference.locale);
      return;
    }

    // Check if we should suggest a language
    const currentLocale = getCurrentLocale();
    const suggested = getSuggestedLocale();

    if (
      preference === null && // No saved preference
      suggested !== null && // Browser suggests a language
      suggested !== currentLocale && // Different from current
      currentLocale !== '' // We have a current locale
    ) {
      setSuggestedLocale(suggested as Locale);
      setShowSuggestion(true);
    }
  }, [
    isClient,
    preference,
    isPreferenceMatched,
    changeLanguage,
    getCurrentLocale,
    getSuggestedLocale,
  ]);

  const handleAcceptSuggestion = () => {
    if (suggestedLocale !== null) {
      changeLanguage(suggestedLocale);
    }
    setShowSuggestion(false);
  };

  const handleDismissSuggestion = () => {
    // Save current locale as preference to avoid showing suggestion again
    const currentLocale = getCurrentLocale();
    if (currentLocale) {
      savePreference(currentLocale as Locale, 'user');
    }
    setShowSuggestion(false);
  };

  // Don't render anything during SSR or if no suggestion
  if (!isClient || !showSuggestion || suggestedLocale === null) {
    return null;
  }

  const languageNames: Record<Locale, string> = {
    en: 'English',
    ja: '日本語',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Language Suggestion</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismissSuggestion}
              aria-label="Dismiss suggestion"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-4">
            Would you like to switch to {languageNames[suggestedLocale]}?
          </CardDescription>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAcceptSuggestion} className="flex-1">
              Switch to {languageNames[suggestedLocale]}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismissSuggestion}
              className="flex-1"
            >
              Keep Current
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
