import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { formatDate, formatNumber, formatCurrency, formatRelativeTime } from '@/i18n/utils';

/**
 * Server-side i18n utilities
 * These utilities can be used in server components and API routes
 */

/**
 * Get current locale from headers
 */
export async function getCurrentLocale(): Promise<string> {
  const headersList = headers();
  const acceptLanguage = headersList.get('accept-language') || 'en';

  // Simple locale extraction - you might want to use a more sophisticated approach
  const locale = acceptLanguage.split(',')[0].split('-')[0];
  return ['en', 'ja'].includes(locale) ? locale : 'en';
}

/**
 * Get translated messages for a specific namespace
 */
export async function getServerTranslations(namespace: string) {
  return getTranslations(namespace);
}

/**
 * Format date on server side with automatic locale detection
 */
export async function serverFormatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
  const locale = await getCurrentLocale();
  return formatDate(date, locale, options);
}

/**
 * Format number on server side with automatic locale detection
 */
export async function serverFormatNumber(number: number, options?: Intl.NumberFormatOptions) {
  const locale = await getCurrentLocale();
  return formatNumber(number, locale, options);
}

/**
 * Format currency on server side with automatic locale detection
 */
export async function serverFormatCurrency(amount: number, currency = 'USD') {
  const locale = await getCurrentLocale();
  return formatCurrency(amount, locale, currency);
}

/**
 * Format relative time on server side with automatic locale detection
 */
export async function serverFormatRelativeTime(date: Date) {
  const locale = await getCurrentLocale();
  return formatRelativeTime(date, locale);
}

/**
 * Get localized status labels
 */
export async function getStatusLabels() {
  const t = await getTranslations('evaluations');

  return {
    cycleStatus: {
      DRAFT: t('cycleStatus.draft'),
      ACTIVE: t('cycleStatus.active'),
      COMPLETED: t('cycleStatus.completed'),
      ARCHIVED: t('cycleStatus.archived'),
    },
    evaluationStatus: {
      DRAFT: t('evaluationStatus.draft'),
      SUBMITTED: t('evaluationStatus.submitted'),
      REVIEWED: t('evaluationStatus.reviewed'),
      APPROVED: t('evaluationStatus.approved'),
      SHARED: t('evaluationStatus.shared'),
    },
    evaluationType: {
      SELF: t('evaluationType.self'),
      PEER: t('evaluationType.peer'),
      MANAGER: t('evaluationType.manager'),
      SKIP_LEVEL: t('evaluationType.skip_level'),
      UPWARD: t('evaluationType.upward'),
    },
  };
}

/**
 * Get localized role labels
 */
export async function getRoleLabels() {
  const t = await getTranslations('organization.members.role');

  return {
    ADMIN: t('admin'),
    MANAGER: t('manager'),
    MEMBER: t('member'),
  };
}

/**
 * Get localized frequency labels
 */
export async function getFrequencyLabels() {
  const t = await getTranslations('checkins.templates.frequency');

  return {
    DAILY: t('daily'),
    WEEKLY: t('weekly'),
    BIWEEKLY: t('biweekly'),
    MONTHLY: t('monthly'),
    QUARTERLY: t('quarterly'),
  };
}
