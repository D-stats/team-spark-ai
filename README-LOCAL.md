# TeamSpark AI - ローカル開発環境セットアップガイド

## 🚀 クイックスタート

### 1. 環境準備

```bash
# Dockerコンテナを起動
docker compose up -d

# 環境変数の確認 (.env ファイルが自動生成されています)
cat .env
```

### 2. 開発サーバーの起動

**新しいターミナルを開いて以下を実行:**

```bash
# 自動起動スクリプトを使用（推奨）
./start-dev.sh

# または手動で起動
npm run dev
```

### 3. アクセス可能なURL

開発サーバー起動後、以下のURLにアクセスできます：

- **メインアプリ**: http://localhost:3000
- **テストページ**: http://localhost:3000/test
- **API ドキュメント**: http://localhost:3000/api-docs
- **開発者ダッシュボード**: http://localhost:3000/dev
- **Health Check**: http://localhost:3000/api/health

### 4. その他のサービス

別のターミナルで起動:

```bash
# Storybook（コンポーネントカタログ）
npm run storybook
# → http://localhost:6006

# Prisma Studio（データベース管理）
npm run prisma:studio
# → http://localhost:5555

# ワーカープロセス（バックグラウンドジョブ）
npm run worker:dev
```

## 📝 ログイン情報

- **Admin**: admin@demo.com
- **Manager**: sarah.manager@demo.com
- **Developer**: john.dev@demo.com
- **Sales**: emily.sales@demo.com

## 🔍 サービス状態確認

```bash
# すべてのサービスの状態を確認
./check-services.sh
```

## 🛠️ トラブルシューティング

### 開発サーバーにアクセスできない場合

1. **ポートを確認**

   ```bash
   lsof -i :3000
   ```

2. **別のポートで起動**

   ```bash
   PORT=3001 npm run dev
   ```

3. **Dockerコンテナを確認**

   ```bash
   docker compose ps
   ```

4. **ログを確認**
   ```bash
   docker compose logs postgres
   docker compose logs redis
   ```

### データベース接続エラー

```bash
# マイグレーションを再実行
npm run prisma:migrate

# シードデータを再投入
npm run prisma:seed
```

## 📦 実装済み機能

- ✅ **Docker本番環境** - マルチステージビルド対応
- ✅ **テストセットアップ** - Jest + React Testing Library
- ✅ **API ドキュメント** - OpenAPI 3.0 + Swagger UI
- ✅ **ロギング/モニタリング** - Winston + OpenTelemetry
- ✅ **セキュリティ** - レート制限、CSPヘッダー
- ✅ **キャッシング** - Redis統合
- ✅ **バックグラウンドジョブ** - BullMQ
- ✅ **コンポーネント開発** - Storybook

## 🎯 Next.js が起動しない場合の確認事項

1. **Node.js バージョン**: 18.x 以上が必要
2. **環境変数**: DATABASE_URL が正しく設定されているか
3. **ポート競合**: 3000番ポートが空いているか
4. **依存関係**: `npm install` が完了しているか

問題が解決しない場合は、以下を実行してください：

```bash
# クリーンインストール
rm -rf node_modules package-lock.json
npm install

# キャッシュクリア
npm cache clean --force
```
