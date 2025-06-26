# ポート管理ガイド

このドキュメントでは、開発環境でのポート競合を避けるための戦略とベストプラクティスを説明します。

## 📊 ポート使用一覧

### アプリケーションポート

| サービス   | デフォルトポート | 環境変数          | 説明                           |
| ---------- | ---------------- | ----------------- | ------------------------------ |
| Next.js    | 3000             | `PORT`            | フロントエンドアプリケーション |
| Mailhog UI | 8025             | `MAILHOG_UI_PORT` | メールテスト用Web UI           |

### Supabaseポート（Supabase CLIで管理）

| サービス        | デフォルトポート | 説明                 |
| --------------- | ---------------- | -------------------- |
| Supabase API    | 54321            | REST API (PostgREST) |
| PostgreSQL      | 54322            | データベース         |
| Supabase Studio | 54323            | 管理UI               |
| Inbucket        | 54324            | メールサーバー       |

### 内部通信のみ（Docker Compose使用時）

| サービス     | 内部ポート | 説明                         |
| ------------ | ---------- | ---------------------------- |
| PostgreSQL   | 5432       | データベース（外部非公開）   |
| Redis        | 6379       | セッション管理（外部非公開） |
| Mailhog SMTP | 1025       | SMTPサーバー（外部非公開）   |

## 🚀 使用方法

### 1. ポート競合チェック

開発を始める前に、必要なポートが利用可能か確認：

```bash
npm run check:ports
```

### 2. デフォルトポートで起動

```bash
npm run dev
```

### 3. 代替ポートで起動

ポート3000が使用中の場合：

```bash
# 方法1: 環境変数を使用
PORT=3001 npm run dev

# 方法2: 代替ポートスクリプト
npm run dev:alt

# 方法3: カスタムポートを対話的に指定
npm run dev:custom
```

### 4. Docker Composeで起動（推奨）

外部ポートの公開を最小限に抑えた構成：

```bash
# .envファイルでポートを設定
echo "PORT=3000" >> .env
echo "MAILHOG_UI_PORT=8025" >> .env

# Docker Composeで起動
docker-compose up -d
```

## 🔧 トラブルシューティング

### ポート競合の解決

1. **使用中のポートを確認**

   ```bash
   lsof -i :3000
   ```

2. **プロセスを終了**

   ```bash
   kill -9 $(lsof -ti:3000)
   ```

3. **すべての開発サービスを停止**
   ```bash
   npm run stop:all
   ```

### Supabaseのポート競合

Supabaseが他のプロジェクトで実行中の場合：

```bash
# 現在の状態を確認
npx supabase status

# 停止してから再起動
npm run supabase:start:clean
```

## 🎯 ベストプラクティス

### 1. 環境変数の活用

`.env.local`ファイルでポートを管理：

```env
# アプリケーションポート
PORT=3000

# Docker Compose用ポート
MAILHOG_UI_PORT=8025

# Supabase設定（必要に応じて）
SUPABASE_API_PORT=54321
SUPABASE_DB_PORT=54322
```

### 2. 内部通信の最適化

Docker Composeを使用する場合、データベースやRedisなどのサービスは外部に公開せず、内部ネットワークでのみ通信します：

```yaml
services:
  postgres:
    # portsではなくexposeを使用
    expose:
      - '5432'
    networks:
      - app-network
```

### 3. ポート範囲の規約

組織内で以下のようなポート範囲を定めることを推奨：

- **3000-3999**: フロントエンドアプリケーション
- **4000-4999**: バックエンドAPI
- **5000-5999**: マイクロサービス
- **8000-8999**: 開発ツール（デバッガー、管理UI等）
- **54300-54399**: Supabase関連

### 4. CI/CD環境での考慮

GitHub ActionsなどのCI環境では、ランダムポートを使用：

```yaml
- name: Start services
  run: |
    export PORT=$(shuf -i 3000-3999 -n 1)
    npm run dev &
```

## 📝 開発チェックリスト

- [ ] `npm run check:ports`でポートの空き状況を確認
- [ ] 必要に応じて代替ポートを使用
- [ ] 長期的な開発にはDocker Composeの使用を検討
- [ ] チーム内でポート使用ルールを共有
- [ ] `.env.example`にポート設定例を記載

## 🔗 関連リソース

- [Next.js環境変数ドキュメント](https://nextjs.org/docs/basic-features/environment-variables)
- [Docker Composeネットワーキング](https://docs.docker.com/compose/networking/)
- [Supabase CLIドキュメント](https://supabase.com/docs/guides/cli)
