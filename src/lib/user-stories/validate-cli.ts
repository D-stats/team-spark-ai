#!/usr/bin/env tsx

/**
 * ユーザーストーリー検証CLIツール
 */

import { validateAllStories } from './validator';

console.log('🚀 ユーザーストーリー検証を開始します...\n');

validateAllStories()
  .then(() => {
    console.log('\n✅ 検証が完了しました！');
    console.log('📄 レポートが user-story-validation-report.md に保存されました。');
  })
  .catch((error) => {
    console.error('\n❌ 検証中にエラーが発生しました:', error);
    process.exit(1);
  });
