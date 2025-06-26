'use client';

import { useTranslations } from '@/i18n/utils';
import { isAppError } from '@/lib/errors';

interface ErrorMessageProps {
  error: unknown;
  className?: string;
}

export function ErrorMessage({ error, className }: ErrorMessageProps) {
  const t = useTranslations();
  
  const getMessage = (): string => {
    if (!error) return '';
    
    if (isAppError(error)) {
      // If the error message is a translation key (starts with 'errors.'), translate it
      if (error.userMessage.startsWith('errors.')) {
        // Get nested translation
        const keys = error.userMessage.split('.');
        let translation: any = t;
        
        for (const key of keys) {
          translation = translation(key);
        }
        
        return typeof translation === 'string' ? translation : error.userMessage;
      }
      return error.userMessage;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return t('errors.unknown.default');
  };

  const message = getMessage();
  
  if (!message) return null;

  return (
    <div className={className}>
      {message}
    </div>
  );
}