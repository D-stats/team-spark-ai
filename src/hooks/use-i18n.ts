'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatDate as formatDateUtil } from '@/i18n/utils';

/**
 * Custom hook for i18n utilities
 * Provides common i18n functionality in a reusable way
 */
export function useI18n() {
  const locale = useLocale();

  /**
   * Format date according to current locale
   */
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return formatDateUtil(date, locale, options);
  };

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  const formatRelativeTime = (date: Date) => {
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
  };

  /**
   * Format number according to locale
   */
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(number);
  };

  /**
   * Format currency according to locale
   */
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  /**
   * Get locale-specific date format pattern
   */
  const getDateFormat = () => {
    switch (locale) {
      case 'ja':
        return 'yyyy/MM/dd';
      case 'en':
      default:
        return 'MM/dd/yyyy';
    }
  };

  /**
   * Check if current locale is RTL (Right-to-Left)
   */
  const isRTL = () => {
    // Add more RTL languages as needed
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(locale);
  };

  return {
    locale,
    formatDate,
    formatRelativeTime,
    formatNumber,
    formatCurrency,
    getDateFormat,
    isRTL,
  };
}

/**
 * Hook to get translated validation messages
 */
export function useValidationMessages() {
  const t = useTranslations('forms.validation');

  return {
    required: () => t('required'),
    email: () => t('email'),
    minLength: (min: number) => t('minLength', { min }),
    maxLength: (max: number) => t('maxLength', { max }),
    url: () => t('url'),
    number: () => t('number'),
    integer: () => t('integer'),
    positive: () => t('positive'),
    date: () => t('date'),
    time: () => t('time'),
    match: () => t('match'),
  };
}

/**
 * Hook to get translated error messages
 */
export function useErrorMessages() {
  const t = useTranslations('errors');

  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      // Map common error types to i18n keys
      if (error.message.includes('unauthorized')) {
        return t('authorization.unauthorized');
      }
      if (error.message.includes('not found')) {
        return t('notFound.default');
      }
      if (error.message.includes('network')) {
        return t('network.default');
      }
      if (error.message.includes('timeout')) {
        return t('network.timeout');
      }

      return error.message;
    }

    return t('unknown.default');
  };

  return {
    getErrorMessage,
    validation: {
      default: t('validation.default'),
      required: t('validation.required'),
      email: t('validation.email'),
      passwordMismatch: t('validation.passwordMismatch'),
      invalidCredentials: t('validation.invalidCredentials'),
    },
    authentication: {
      default: t('authentication.default'),
      sessionExpired: t('authentication.sessionExpired'),
      unauthorized: t('authentication.unauthorized'),
    },
    authorization: {
      default: t('authorization.default'),
      insufficientPermissions: t('authorization.insufficientPermissions'),
      adminOnly: t('authorization.adminOnly'),
    },
  };
}
