# Japanese Text Audit - Startup HR Engagement Platform

This document contains a comprehensive list of all Japanese text found in the codebase that needs to be translated to English.

## Test Files

### `/tests/e2e/evaluations.spec.ts`
- Test descriptions: '評価システム', 'コンピテンシー管理', '権限テスト', 'レスポンシブテスト'
- Test names: '評価ダッシュボードの表示', '評価サイクル一覧の表示', '私の評価一覧の表示', '評価サイクル作成ボタンの表示'
- UI elements: '評価管理', '評価サイクル作成', 'コンピテンシー管理', 'コンピテンシー作成', 'コンピテンシーを検索'
- Test data: '2024年上期評価', 'コミュニケーション', 'デフォルトを初期化'
- Error messages: 'コンピテンシーがありません'
- Other test names: 'コンピテンシー一覧の表示', 'デフォルトコンピテンシーの初期化', 'モバイルビューでの表示'

### `/tests/e2e/dashboard.spec.ts`
- Test descriptions: 'ダッシュボード', 'Kudos機能', 'チェックイン機能', 'チーム管理', 'OKR機能', 'サーベイ機能'
- Test names: 'ダッシュボードの表示', 'ナビゲーションメニューの確認', 'Kudosページの表示', 'Kudos送信フォームの表示'
- UI elements: 'ダッシュボード', 'チームのムード', '今週のKudos', 'アクティブなユーザー', 'Kudosを送る'
- Navigation items: 'チーム', 'チェックイン', 'サーベイ', '評価', '設定'
- Other UI elements: 'チェックインを作成', 'チェックイン作成', 'チーム管理', 'チーム作成', 'サーベイ', 'サーベイ作成'

### `/tests/e2e/api.spec.ts`
- Test description: 'APIエンドポイントテスト'
- Test names: '評価サイクル取得API', 'コンピテンシー取得API', 'Kudos取得API', 'チェックイン取得API', 'チーム取得API'
- Test data: '2024年上期評価', 'コミュニケーション', '明確で効果的なコミュニケーションを行う能力', '明確で簡潔な情報伝達ができる'
- Kudos data: '素晴らしい仕事でした！', '送信者', '受信者'
- Check-in data: '新機能の開発を完了しました', 'テストの実施を予定しています', '特に大きな課題はありませんでした', 'テストユーザー'
- Team data: '開発チーム', 'プロダクト開発を担当するチーム', 'マネージャー', 'メンバー1', 'メンバー2'
- Error handling: 'サーバーエラー'

### `/tests/e2e/auth.spec.ts`
- Test descriptions: '認証システム', 'ユーザープロフィール'
- Test names: 'ログイン状態の確認', 'ログアウト機能', '管理者権限の確認', 'メンバー権限の確認', 'マネージャー権限の確認'
- UI elements: 'ダッシュボード', 'チーム作成', 'プロフィール設定', '設定'
- Test names: 'プロフィール情報の表示', '設定ページのアクセス'

### `/tests/e2e/evaluation-basic.spec.ts`
- Test descriptions: '評価システム基本テスト'
- Test names: '評価ページにアクセスできる', 'コンピテンシーページにアクセスできる'

## Source Code Files

### `/src/app/[locale]/(dashboard)/dashboard/page.tsx`
- Welcome message: 'ようこそ、{dbUser.name}さん'
- Subtitle: 'チームのエンゲージメント状況を確認しましょう'
- Stats titles: '今月のKudos', 'チェックイン完了率', 'チームメンバー', 'エンゲージメントスコア'
- Stats descriptions: 'チーム内で送受信', '今週のチェックイン', 'アクティブメンバー', '過去30日平均', '計測開始前'
- Card titles: '最近のKudos', '最近のチェックイン'
- Card descriptions: 'チームメンバーからの感謝メッセージ', 'チームの活動状況'
- Empty states: 'まだKudosがありません。チームメンバーに感謝を伝えてみましょう！', 'まだチェックインがありません。週次チェックインを開始してみましょう！'
- Fallback text: '回答なし'

### `/src/app/[locale]/(dashboard)/dashboard/teams/page.tsx`
- Page title: 'チーム管理'
- Page description: '組織内のチームとメンバーを管理します'
- Empty state: 'チームがありません', 'まだチームが作成されていません。'
- Role-based messages: '最初のチームを作成してみましょう。', 'マネージャーがチームを作成するまでお待ちください。'
- UI elements: 'メンバー', '+{count} 他', '編集', '詳細'

### `/src/app/[locale]/(auth)/signup/verify-email/page.tsx`
- Title: 'メールを確認してください'
- Message: '確認メールを送信しました。メール内のリンクをクリックして、アカウントの作成を完了してください。'
- Note: 'メールが届かない場合は、迷惑メールフォルダをご確認ください。'
- Link: 'ログインページに戻る'

### `/src/app/[locale]/(auth)/signup/page.tsx`
- Title: 'アカウント作成'
- Description: '新しいアカウントを作成して、チームのエンゲージメント向上を始めましょう'
- Labels: 'お名前', 'メールアドレス', 'パスワード'
- Placeholder: '山田 太郎'
- Helper text: '6文字以上のパスワードを入力してください'
- Button: 'アカウント作成中...', 'アカウントを作成'
- Link text: 'すでにアカウントをお持ちですか？', 'ログイン'
- Error: 'サインアップに失敗しました'

### `/src/app/[locale]/(auth)/login/page.tsx`
- Title: 'ログイン'
- Description: 'アカウントにログインして、ダッシュボードにアクセスしてください'
- Labels: 'メールアドレス', 'パスワード'
- Links: 'パスワードを忘れた方'
- Button: 'ログイン中...', 'ログイン'
- Link text: 'アカウントをお持ちでない方は', '新規登録'
- Error: 'ログインに失敗しました'

### `/src/app/[locale]/(dashboard)/evaluations/competencies/page.tsx`
- Category labels: 'コアコンピテンシー', 'リーダーシップ', '技術スキル', '職能別スキル'
- Page title: 'コンピテンシー管理'
- Page description: '評価に使用するコンピテンシーを管理します'
- Buttons: 'デフォルトを初期化', 'コンピテンシー作成'
- Dialog titles: 'コンピテンシー編集', 'コンピテンシー作成'
- Dialog description: '評価に使用するコンピテンシーを{action}します。'
- Form labels: 'コンピテンシー名 *', 'カテゴリ *', '説明 *', '表示順序', '期待される行動'
- Placeholders: '例: コミュニケーション', 'コンピテンシーの詳細説明', '行動例 {index}'
- Buttons: '削除', '行動を追加', 'キャンセル', '更新', '作成'
- Filter: 'コンピテンシーを検索...', 'すべてのカテゴリ'
- Empty state: 'コンピテンシーがありません', 'コンピテンシーを作成して評価システムを開始しましょう。'
- Delete dialog: 'コンピテンシーを削除しますか？', '「{name}」を削除します。この操作は元に戻せません。'
- Warning: '※ このコンピテンシーは評価データがあるため、非アクティブ化されます。'
- Info text: '期待される行動:', '{count}件の評価で使用済み'
- Toast messages: 'コンピテンシーの読み込みに失敗しました', 'デフォルトコンピテンシーの初期化に失敗しました', 'コンピテンシーを更新しました', 'コンピテンシーを作成しました', 'コンピテンシーの保存に失敗しました', 'コンピテンシーを削除しました', 'コンピテンシーの削除に失敗しました'

### `/src/types/api.ts`
- Comments: '統一API型定義', 'フロントエンドとバックエンド間の型安全性を保証する', '基本レスポンス型', '基本エンティティ型', '評価関連型定義', 'API リクエスト型', '型エクスポート', 'Result型パターン', 'API関数型定義', '評価サイクル', 'コンピテンシー', '評価'
- Validation messages: '名前は必須です', '説明は必須です', '行動指標は1つ以上必要です', '総合コメントは必須です', 'コメントは必須です', '行動指標は1つ以上選択してください', 'コンピテンシー評価は必須です'

### Environment Files
- `.env.example` comments: 'ポート設定', 'アプリケーションのポート（デフォルト: 3000）', 'Docker Compose用ポート設定', 'Supabase設定', 'データベース接続（Prisma用）', 'アプリケーション設定', 'Slack設定', 'メール設定', '開発環境用メール設定（Docker Compose使用時）'

### `/src/app/[locale]/(dashboard)/evaluations/page.tsx`
- Stats titles: 'アクティブサイクル', '未完了評価', '総サイクル数'
- Stats descriptions: '未実施', '{count}件の評価', '現在アクティブなサイクルはありません', 'あなたが実施する評価', 'これまでに実施したサイクル'
- Tab labels: '概要', '評価サイクル', '私の評価'
- Page title: '評価管理'

### `/src/app/[locale]/(dashboard)/dashboard/checkins/page.tsx`
- Page title: 'チェックイン'
- Page description: 'カスタマイズされたテンプレートで定期的な振り返りを記録しましょう'

### `.github/workflows/user-story-validation.yml`
- Comment header: 'ユーザーストーリー検証レポート'

## Additional Files to Check

The following files also contain Japanese text:
- `/src/app/[locale]/(dashboard)/evaluations/[id]/results/page.tsx`
- `/src/app/[locale]/(dashboard)/evaluations/[id]/page.tsx`
- `/src/app/[locale]/(dashboard)/setup/page.tsx`
- `/src/app/[locale]/(dashboard)/dashboard/organization/page.tsx`
- `/src/app/[locale]/(dashboard)/dashboard/settings/slack/page.tsx`
- `/src/app/[locale]/(dashboard)/dashboard/settings/page.tsx`
- `/src/app/[locale]/(dashboard)/dashboard/surveys/page.tsx`
- `/src/app/[locale]/(dashboard)/dashboard/checkins/templates/page.tsx`
- `/src/app/[locale]/(dashboard)/dashboard/checkins/page.tsx`
- `/src/app/[locale]/(dashboard)/dashboard/kudos/page.tsx`
- `/src/app/[locale]/(dashboard)/dev/page.tsx`
- `/src/app/api/organizations/route.ts`

## Summary

The codebase contains extensive Japanese text in:
1. **Test files** - Test descriptions, test names, and test data
2. **UI components** - Page titles, labels, buttons, messages, and descriptions
3. **Validation messages** - Form validation and error messages
4. **Comments** - Code comments and documentation
5. **Configuration** - Environment variable descriptions

All of these instances need to be translated to English to complete the internationalization of the application.