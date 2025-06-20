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

# 🚀 推奨: 事前チェック付き起動（スキーマ不一致エラーを防ぐ）
npm run dev:safe

# 通常の起動方法
npm run dev

# 手動で事前チェックを実行
npm run pre-flight

# ポート競合時の代替起動方法
PORT=3001 npm run dev    # 環境変数で指定
npm run dev:alt          # 3001番ポートで起動
npm run dev:custom       # 対話的にポート指定

# 別ターミナルでSupabase Studio起動
npx supabase status  # URLを確認
```

### 開発前の事前チェック（pre-flight）

`npm run pre-flight` コマンドは以下をチェックします：

- ✅ Supabaseの起動状態
- ✅ データベース接続
- ✅ マイグレーション適用状態
- ✅ Prisma Client生成状態
- ✅ 依存関係のインストール
- ✅ ポート競合
- ✅ TypeScript型エラー（簡易版）

問題がある場合は、具体的な解決方法を提示します。

### 開発サーバーの起動確認

**重要**: サーバーが実際に起動したことを確認してから作業を進めてください。

```bash
# サーバーの起動を確認
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# 200が返ればOK

# またはヘルスチェックエンドポイントを使用
npm run health

# 起動確認付きでサーバーを起動
npm run dev:server  # 自動で起動確認を行います

# 正しいサービスが起動していることを詳細に検証
npm run verify
```

### ヘルスチェックエンドポイント

開発サーバーには `/api/health` エンドポイントが実装されており、以下の情報を提供します：

```json
{
  "status": "ok",
  "timestamp": "2025-06-19T22:47:16.340Z",
  "service": "startup-hr-engagement",
  "version": "0.1.0",
  "checks": {
    "server": true,
    "database": true
  }
}
```

- **service**: 正しいサービスが起動していることを確認
- **checks.server**: サーバーの稼働状態
- **checks.database**: データベース接続の状態

### サーバー検証スクリプト

`scripts/verify-server.sh` では以下の5つのチェックを実行：

1. **ポート確認**: 指定ポートが開いているか
2. **プロセス確認**: Node.jsプロセスが動作しているか
3. **HTTPヘッダー確認**: Next.jsサーバーとして応答しているか
4. **ヘルスチェック**: 正しいサービス（startup-hr-engagement）か
5. **Next.jsルート確認**: Next.js特有のパスが存在するか

3つ以上のチェックが通れば、正しい開発サーバーが起動していると判断します。

### ポート管理戦略

開発環境でのポート競合を避けるため、以下の戦略を採用しています：

1. **自動ポートチェック**: `npm run dev`実行時に自動でポート競合を確認
2. **環境変数サポート**: PORTなどの環境変数で柔軟に設定可能
3. **Docker Compose活用**: 内部通信のサービスは外部ポートを公開しない

詳細は`docs/PORT_MANAGEMENT.md`を参照してください。

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

## 📝 機能開発完了時の必須チェック

### ⚠️ 重要: 機能開発完了後は必ずテスト・品質チェックを実行

新機能の実装や既存機能の変更が完了したら、**必ず以下のチェックを実行してください**：

```bash
# 1. TypeScript型チェック（必須）
npm run type-check

# 2. ESLint実行（必須）
npm run lint

# 3. テスト実行（実装がある場合は必須）
npm test

# 4. 全体品質チェック（推奨）
npm run validate
```

### 機能開発フロー

1. **実装** → 機能やバグ修正を完了
2. **品質チェック** → 上記コマンドを実行
3. **修正** → エラーや警告があれば修正
4. **再チェック** → 全てパスするまで繰り返し
5. **コミット** → 品質チェック完了後のみコミット

### エラー・警告の対応

- **TypeScriptエラー**: 型定義の修正は必須
- **ESLintエラー**: コード品質問題の修正は必須
- **テスト失敗**: 既存機能を壊していないか確認し修正
- **ESLint警告**: 可能な限り修正（重大でない場合はコミット可能）

## 📝 コミット前の必須事項

### 1. コード品質確認

```bash
# 必ず実行（機能開発完了時と同じ）
npm run type-check
npm run lint
npm test

# または一括実行
npm run validate
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

### 4. コミット時の自動チェック（Husky + lint-staged）

このプロジェクトでは、コミット時に自動的にコード品質チェックが実行されます：

```bash
# コミット時に自動実行される内容
- ESLint --fix（TypeScript/TSXファイル）
- Prettier --write（全対象ファイル）
```

手動でスキップする場合（推奨しません）：

```bash
git commit --no-verify -m "メッセージ"
```

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
# 自動ポートチェック
npm run check:ports

# 手動でポートを使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 $(lsof -ti:3000)

# 代替ポートで起動
PORT=3001 npm run dev    # 環境変数で指定
npm run dev:alt          # 3001番で起動
npm run dev:custom       # 対話的に指定

# すべての開発サービスを停止
npm run stop:all
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

### スキーマ不一致エラーの防止と対処

**エラー例**: `The column CheckIn.achievements does not exist in the current database`

このようなエラーは、Prismaスキーマとデータベースの実際の構造が一致していない場合に発生します。

#### 🚨 再発防止策

1. **スキーマ変更時の必須手順**

   ```bash
   # 1. スキーマ変更後、必ずマイグレーションを作成
   npx prisma migrate dev --name descriptive_migration_name

   # 2. Prisma Clientを再生成
   npx prisma generate

   # 3. TypeScriptの型チェックでエラーがないか確認
   npm run type-check
   ```

2. **開発開始時のチェック**

   ```bash
   # マイグレーション状態の確認
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma migrate status

   # 未適用のマイグレーションがある場合は適用
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma migrate deploy
   ```

3. **スキーマとコードの同期確認**

   ```bash
   # データベースの実際の構造を確認
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma db pull

   # 差分がある場合は、スキーマファイルを確認
   git diff prisma/schema.prisma
   ```

4. **コード変更時の注意点**

   - スキーマ変更時は、関連するすべてのコードを検索して更新
   - 古いフィールドを参照している箇所がないか確認

   ```bash
   # 削除したフィールド名で検索（例：achievements）
   grep -r "achievements" src/ --include="*.ts" --include="*.tsx"
   ```

5. **チーム開発での同期**
   - プルリクエストでスキーマ変更がある場合は、マイグレーションファイルも含める
   - READMEやチームチャンネルでマイグレーション実行を周知
6. **CI/CDでの検証**
   - ビルド前にマイグレーション状態をチェック
   - スキーマとコードの整合性テストを追加

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
       },
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
