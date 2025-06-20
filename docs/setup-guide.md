# 環境構築ガイド

## 前提条件

以下のツールがインストールされていることを確認してください：

- **Node.js**: v18.0.0以上（推奨: v20.x）
- **npm**: v9.0.0以上
- **Docker**: v20.0.0以上（Supabase Local用）
- **Git**: v2.0.0以上

### 必要なツールのインストール確認

```bash
# Node.jsバージョン確認
node --version

# npmバージョン確認
npm --version

# Dockerバージョン確認
docker --version

# Gitバージョン確認
git --version
```

## 1. プロジェクトのクローン

```bash
# リポジトリをクローン
git clone [repository-url]
cd startup-hr

# または新規作成の場合
mkdir startup-hr
cd startup-hr
git init
```

## 2. 依存関係のインストール

```bash
# package.jsonが存在する場合
npm install

# 新規プロジェクトの場合（後述の初期設定を参照）
npm init -y
```

## 3. Supabase Localのセットアップ

### 3.1 Supabase CLIのインストール

```bash
# npmでインストール（推奨）
npm install -g supabase

# またはHomebrewでインストール（macOS）
brew install supabase/tap/supabase
```

### 3.2 Supabaseプロジェクトの初期化

```bash
# Supabaseを初期化
npx supabase init

# ローカルのSupabaseを起動
npx supabase start
```

起動が完了すると、以下のような情報が表示されます：

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJ...
service_role key: eyJ...
```

これらの情報を`.env.local`に保存します。

### 3.3 環境変数の設定

`.env.local`ファイルを作成：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# データベース接続（Prisma用）
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=public

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Slack設定（後で設定）
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
```

`.env.example`ファイルも作成（機密情報を含まない）：

```bash
cp .env.local .env.example
# .env.exampleから実際の値を削除
```

## 4. Next.jsプロジェクトの初期設定

### 4.1 プロジェクトが未作成の場合

```bash
# Next.jsプロジェクトを作成
npx create-next-app@latest . --typescript --tailwind --app --use-npm

# 追加の依存関係をインストール
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install prisma @prisma/client
npm install @slack/bolt @slack/web-api
npm install zod react-hook-form @hookform/resolvers
npm install zustand
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install recharts
npm install clsx tailwind-merge

# 開発依存関係
npm install -D @types/node
npm install -D eslint-config-prettier prettier
```

### 4.2 Prismaの初期化

```bash
# Prismaを初期化
npx prisma init

# スキーマファイルを編集（後述）
# マイグレーションを実行
npx prisma migrate dev --name init

# Prisma Clientを生成
npx prisma generate
```

## 5. データベースのセットアップ

### 5.1 Prismaスキーマの設定

`prisma/schema.prisma`を編集して、データモデルを定義します。

### 5.2 初期マイグレーション

```bash
# マイグレーションファイルを作成・実行
npx prisma migrate dev --name initial_schema

# Seedデータを投入（オプション）
npx prisma db seed
```

## 6. Slack Appの作成

### 6.1 Slack App作成

1. https://api.slack.com/apps にアクセス
2. "Create New App" → "From scratch"を選択
3. App名とワークスペースを設定

### 6.2 必要な権限（Bot Token Scopes）

- `chat:write`
- `commands`
- `users:read`
- `users:read.email`
- `team:read`

### 6.3 Slash Commandsの設定

以下のコマンドを登録：

- `/kudos` - Request URL: `https://your-domain.com/api/slack/commands`
- `/checkin` - Request URL: `https://your-domain.com/api/slack/commands`
- `/mood` - Request URL: `https://your-domain.com/api/slack/commands`

### 6.4 環境変数の更新

Slack Appの情報を`.env.local`に追加：

```bash
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

## 7. 開発サーバーの起動

### 7.1 Supabaseが起動していることを確認

```bash
npx supabase status
```

### 7.2 開発サーバーを起動

```bash
# 推奨: 事前チェック付き起動（スキーマ不一致エラーを防ぐ）
npm run dev:safe

# または通常起動
npm run dev

# ポート競合時の代替起動
PORT=3001 npm run dev

# 別のターミナルでSupabase Studioを開く
npx supabase status
# 表示されたStudio URLをブラウザで開く
```

### 7.3 動作確認

- http://localhost:3000 - アプリケーション
- http://localhost:54323 - Supabase Studio
- http://localhost:54324 - Inbucket（メールテスト用）

## 8. VSCode推奨設定

### 8.1 推奨拡張機能

`.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 8.2 設定ファイル

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## 9. トラブルシューティング

詳細なトラブルシューティングは[SETUP_TROUBLESHOOTING.md](./SETUP_TROUBLESHOOTING.md)を参照してください。

### クイックヘルプ

#### 事前チェック

```bash
# 環境の健全性を確認
npm run pre-flight
```

#### よくある問題

1. **スキーマ不一致エラー**: `npm run prisma:reset`（開発環境のみ）
2. **ポート競合**: `PORT=3001 npm run dev`
3. **Supabase接続エラー**: `npx supabase stop && npx supabase start`
4. **TypeScriptエラー**: `npm run type-check`で詳細確認

## 10. 次のステップ

環境構築が完了したら：

1. `docs/development-plan.md`を確認して開発タスクを開始
2. `CLAUDE.md`のガイドラインに従って開発
3. 機能実装前にテスト環境を構築

## 付録: よく使うコマンド

### 開発

```bash
npm run dev:safe     # 事前チェック付き起動（推奨）
npm run dev          # 通常起動
npm run build        # プロダクションビルド
npm run pre-flight   # 環境の健全性チェック
```

### コード品質

```bash
npm run type-check   # TypeScript型チェック
npm run lint         # ESLint実行
npm run format       # Prettierフォーマット
npm run validate     # 全チェック実行
```

### テスト

```bash
npm test             # E2Eテスト実行
npm run test:headed  # ブラウザ表示付きテスト
npm run test:stories # ユーザーストーリーテスト
```

### データベース

```bash
npx prisma migrate dev    # マイグレーション実行
npx prisma generate       # Prisma Client生成
npx prisma studio         # Prisma Studio起動
npm run prisma:reset      # DBリセット（開発環境のみ）
```

### Supabase

```bash
npx supabase status       # 状態確認
npx supabase start        # 起動
npx supabase stop         # 停止
npm run supabase:start    # npm経由で起動
```

### ユーザーストーリー

```bash
npm run validate:stories  # ストーリー検証レポート
npm run report:stories    # テスト実行とレポート生成
```
