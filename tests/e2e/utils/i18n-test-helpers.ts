/**
 * i18n対応テスト用のヘルパー関数
 */

// デフォルトのロケール
export const DEFAULT_LOCALE = 'ja';

// サポートされているロケール
export const SUPPORTED_LOCALES = ['ja', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * ルートにロケールプレフィックスを追加
 * @param path - ロケールなしのパス (例: '/dashboard/kudos')
 * @param locale - 追加するロケール (デフォルト: 'ja')
 * @returns ロケール付きのパス (例: '/ja/dashboard/kudos')
 */
export function withLocale(path: string, locale: Locale = DEFAULT_LOCALE): string {
  // すでにロケールプレフィックスがある場合はそのまま返す
  if (SUPPORTED_LOCALES.some((loc) => path.startsWith(`/${loc}`))) {
    return path;
  }

  // パスが'/'で始まっていない場合は追加
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `/${locale}${normalizedPath}`;
}

/**
 * 複数のロケールでテストを実行するヘルパー
 * @param locales - テストするロケール配列
 * @param testFn - 各ロケールで実行するテスト関数
 */
export function testWithLocales(
  locales: Locale[] = ['ja'],
  testFn: (locale: Locale) => void,
): void {
  locales.forEach((locale) => {
    describe(`Locale: ${locale}`, () => {
      testFn(locale);
    });
  });
}

/**
 * ロケール依存のテキストを取得するヘルパー
 */
export const i18nText = {
  ja: {
    dashboard: {
      title: 'ダッシュボード',
      kudos: 'Kudos',
      checkins: 'チェックイン',
      evaluations: '評価',
      teams: 'チーム',
      surveys: 'サーベイ',
      okr: 'OKR',
      settings: '設定',
    },
    buttons: {
      save: '保存',
      cancel: 'キャンセル',
      submit: '送信',
      create: '作成',
      edit: '編集',
      delete: '削除',
    },
    messages: {
      saved: '保存しました',
      submitted: '送信しました',
      error: 'エラーが発生しました',
    },
  },
  en: {
    dashboard: {
      title: 'Dashboard',
      kudos: 'Kudos',
      checkins: 'Check-ins',
      evaluations: 'Evaluations',
      teams: 'Teams',
      surveys: 'Surveys',
      okr: 'OKR',
      settings: 'Settings',
    },
    buttons: {
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      create: 'Create',
      edit: 'Edit',
      delete: 'Delete',
    },
    messages: {
      saved: 'Saved successfully',
      submitted: 'Submitted successfully',
      error: 'An error occurred',
    },
  },
} as const;

/**
 * ロケール別のテキストを取得
 * @param locale - ロケール
 * @param path - テキストのパス (例: 'dashboard.title')
 * @returns ロケール依存のテキスト
 */
export function getLocalizedText(locale: Locale, path: string): string {
  const parts = path.split('.');
  let current: unknown = i18nText[locale];

  for (const part of parts) {
    if (
      current !== null &&
      current !== undefined &&
      typeof current === 'object' &&
      part in current
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path; // 見つからない場合はパスをそのまま返す
    }
  }

  return typeof current === 'string' ? current : path;
}
