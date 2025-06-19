# AI開発者ガイド - Startup HR Engagement Platform

このドキュメントは、AIアシスタント（Claude等）がこのプロジェクトで効率的に開発を進めるためのガイドラインです。

## 🚀 プロジェクト概要

- **プロジェクト名**: Startup HR Engagement Platform
- **目的**: スタートアップ向けの社内エンゲージメント・評価システム
- **技術スタック**: Next.js 14, TypeScript, Supabase, Prisma, Slack SDK

## 📋 ユーザーストーリー駆動開発

このプロジェクトでは**ユーザーストーリー駆動開発**を採用しています。新機能の実装や変更を行う際は、必ず以下のプロセスに従ってください。

### ユーザーストーリーの確認

1. **既存ストーリーの確認**
   ```bash
   # ストーリー検証レポートを確認
   npm run validate:stories
   
   # 開発者ダッシュボードで確認（開発環境）
   http://localhost:3000/dev
   ```

2. **ストーリーファイルの場所**
   - `/src/lib/user-stories/stories/` - ストーリー定義
   - `/tests/e2e/stories/` - ストーリーベースのテスト

### 新機能実装時のフロー

1. **ユーザーストーリーの作成または確認**
   ```typescript
   // 例: /src/lib/user-stories/stories/feature-stories.ts
   {
     id: 'FEAT-001',
     title: '機能名',
     asA: 'ユーザータイプ',
     iWantTo: '実現したいこと',
     soThat: 'ビジネス価値',
     acceptanceCriteria: [
       {
         given: '前提条件',
         when: 'アクション',
         then: '期待される結果',
         verified: false,
       }
     ],
     priority: StoryPriority.P1,
     status: StoryStatus.READY,
   }
   ```

2. **実装時の記録**
   - 実装したコンポーネント、API、テストのパスを `implementedIn` に記録
   - 受け入れ基準に対応するテストIDを記録

3. **テストの作成**
   ```typescript
   // ストーリーベースのテストを作成
   import { describeStory, testCriteria } from '../utils/story-test';
   
   describeStory(story, () => {
     testCriteria(story.acceptanceCriteria[0], async ({ page }) => {
       // テスト実装
     });
   });
   ```

### 実装完了の確認

- すべての受け入れ基準が満たされているか確認
- `npm run validate:stories` で検証レポートを生成
- ストーリーのステータスを `DONE` に更新

## 📋 開発前チェックリスト

### 1. 環境確認
```bash
# Node.jsバージョン確認（18.x以上推奨）
node --version

# Dockerが起動しているか確認
docker ps

# ポート競合の確認
lsof -i :3000  # Next.js
lsof -i :54321 # Supabase Studio
lsof -i :54322 # Supabase API
```

### 2. Supabase Local起動
```bash
# Supabaseが起動していない場合
npx supabase start

# 起動状態の確認
npx supabase status
```

## 🛠️ 開発コマンド

### 開発サーバー起動
```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# 別ターミナルでSupabase Studio起動
npx supabase status  # URLを確認
```

### コード品質チェック
```bash
# TypeScriptの型チェック
npm run type-check

# ESLintの実行
npm run lint

# Prettierでのフォーマット
npm run format

# 全てのチェックを実行
npm run validate

# ユーザーストーリー検証
npm run validate:stories

# ストーリーベースのテスト実行
npm run test:stories
```

## 📝 コミット前の必須事項

### 1. コード品質確認
```bash
# 必ず実行
npm run validate

# テストの実行（実装後）
npm test
```

### 2. データベースマイグレーション
```bash
# スキーマ変更がある場合
npx prisma migrate dev --name [migration_name]

# Prisma Clientの再生成
npx prisma generate
```

### 3. 環境変数の確認
- `.env.local`に機密情報が含まれていないか確認
- 新しい環境変数を追加した場合は`.env.example`も更新

## 🚨 プッシュ前チェックリスト

1. **ローカルでの動作確認**
   - `npm run dev`でエラーがないこと
   - 主要機能が正常に動作すること

2. **コード品質**
   - `npm run validate`が全てパスすること
   - コンソールにエラーや警告がないこと

3. **データベース**
   - マイグレーションファイルがコミットされていること
   - seedデータが必要な場合は更新されていること

## 🔄 CI/CD確認

### GitHub Actions確認方法
1. プッシュ後、GitHubリポジトリの「Actions」タブを確認
2. 以下のワークフローが成功することを確認：
   - `typecheck`: TypeScriptの型チェック
   - `lint`: コード品質チェック
   - `test`: テストの実行（実装後）
   - `build`: ビルドの成功

### 失敗時の対処
```bash
# ローカルで同じチェックを実行
npm run typecheck
npm run lint
npm run test
npm run build
```

## 🐛 トラブルシューティング

### ポート競合エラー
```bash
# ポートを使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 [PID]

# または別のポートで起動
PORT=3001 npm run dev
```

### Supabase接続エラー
```bash
# Supabaseの状態確認
npx supabase status

# 再起動
npx supabase stop
npx supabase start
```

### Prismaエラー
```bash
# Prisma Clientの再生成
npx prisma generate

# データベースリセット（開発環境のみ）
npx prisma migrate reset
```

## 📁 プロジェクト構造

```
.
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Reactコンポーネント
│   ├── lib/             # ユーティリティ関数
│   │   └── user-stories/ # ユーザーストーリー管理
│   ├── services/        # ビジネスロジック
│   ├── hooks/           # カスタムフック
│   └── types/           # TypeScript型定義
├── tests/
│   └── e2e/
│       └── stories/     # ストーリーベーステスト
├── prisma/
│   ├── schema.prisma    # データベーススキーマ
│   └── migrations/      # マイグレーションファイル
├── public/              # 静的ファイル
└── docs/
    └── user-stories/    # ストーリードキュメント
```

## 🔑 重要な開発原則

1. **ユーザーストーリー駆動**: 全ての機能はユーザーストーリーから始める
2. **型安全性**: TypeScriptの型を最大限活用
3. **エラーハンドリング**: 適切なエラー処理とユーザーフィードバック
4. **セキュリティ**: 環境変数の適切な管理、認証・認可の確認
5. **パフォーマンス**: 不要なレンダリングの回避、適切なキャッシング
6. **アクセシビリティ**: キーボード操作、スクリーンリーダー対応
7. **テスト駆動**: 受け入れ基準に基づくテストの作成

## 📞 サポート

問題が解決しない場合は、以下を確認：
1. `docs/troubleshooting.md`（作成予定）
2. プロジェクトのissuesを検索
3. Slack開発チャンネルで質問（設定後）

## 🎯 ユーザーストーリー実装の例

### 新しいエンゲージメント機能を追加する場合

1. **ストーリーファイルの作成**
   ```typescript
   // /src/lib/user-stories/stories/engagement-stories.ts
   export const newFeatureStory: UserStory = {
     id: 'ENG-005',
     title: '1on1ミーティング記録',
     asA: 'マネージャー',
     iWantTo: '部下との1on1の内容を記録したい',
     soThat: '継続的な成長支援ができる',
     acceptanceCriteria: [
       {
         id: 'AC-005-1',
         given: '1on1ページを開いている',
         when: '新規作成ボタンをクリック',
         then: '記録フォームが表示される',
         verified: false,
       }
     ],
     priority: StoryPriority.P1,
     status: StoryStatus.READY,
     tags: ['1on1', 'マネージャー', 'エンゲージメント'],
   };
   ```

2. **実装とストーリーの更新**
   - コンポーネント作成後、`implementedIn.components` に追加
   - API作成後、`implementedIn.apis` に追加
   - テスト作成後、`implementedIn.tests` に追加
   - 各受け入れ基準のテストが通ったら `verified: true` に更新

3. **検証の実行**
   ```bash
   # 実装状況の確認
   npm run validate:stories
   
   # ストーリーベーステストの実行
   npm run test:stories
   ```

4. **ステータスの更新**
   - すべての受け入れ基準が満たされたら `status: StoryStatus.DONE` に更新

この方法により、ビジネス価値と実装が常に紐づいた状態で開発を進めることができます。