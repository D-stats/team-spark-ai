# セットアップ・トラブルシューティングガイド

このドキュメントは、開発環境のセットアップ時によく遭遇する問題と解決方法をまとめています。

## 🚨 よくある問題と解決方法

### 1. スキーマ不一致エラー

#### エラー例

```
Error: Invalid `prisma.checkIn.findMany()` invocation:
The column `CheckIn.achievements` does not exist in the current database.
```

#### 原因

Prismaスキーマとデータベースの実際の構造が一致していない

#### 解決方法

```bash
# 1. 現在のマイグレーション状態を確認
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma migrate status

# 2. 未適用のマイグレーションがある場合
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma migrate deploy

# 3. それでも解決しない場合はリセット（開発環境のみ）
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres?schema=public" npx prisma migrate reset --force
```

### 2. ポート競合エラー

#### エラー例

```
Error: listen EADDRINUSE: address already in use :::3000
```

#### 解決方法

```bash
# 1. 使用中のプロセスを確認
lsof -i :3000

# 2. プロセスを終了
kill -9 [PID]

# 3. 代替ポートで起動
PORT=3001 npm run dev

# または自動ポートチェック付き起動
npm run dev:safe
```

### 3. Supabase接続エラー

#### エラー例

```
Error: Could not connect to Supabase
```

#### 解決方法

```bash
# 1. Supabaseの状態確認
npx supabase status

# 2. 起動していない場合
npx supabase start

# 3. 再起動が必要な場合
npx supabase stop
npx supabase start

# 4. ログを確認
npx supabase logs
```

### 4. Prisma Client生成エラー

#### エラー例

```
Error: @prisma/client did not initialize yet
```

#### 解決方法

```bash
# 1. Prisma Clientを再生成
npx prisma generate

# 2. node_modulesをクリーンアップ
rm -rf node_modules
npm install
npx prisma generate
```

### 5. TypeScriptエラー

#### エラー例

```
Type 'JsonValue' is not assignable to type 'Question[]'
```

#### 解決方法

```bash
# 1. 型チェックを実行
npm run type-check

# 2. .d.tsファイルをクリーンアップ
rm -rf .next/types

# 3. 再ビルド
npm run build
```

## 🛠️ 予防的メンテナンス

### 開発開始前のチェックリスト

```bash
# 推奨: 事前チェックスクリプトを実行
npm run pre-flight

# または手動でチェック
npx supabase status          # Supabase起動確認
npm run check:ports           # ポート競合チェック
npx prisma migrate status     # マイグレーション状態確認
```

### 定期的なメンテナンス

```bash
# 週次で実行を推奨
npm update                    # 依存関係の更新
npx prisma migrate dev        # マイグレーション同期
npm run validate              # 品質チェック
```

## 📞 サポート

上記で解決しない場合：

1. エラーメッセージの全文をコピー
2. 実行したコマンドを記録
3. `npm run health`の出力を確認
4. GitHubのIssuesまたはSlackで報告

## 関連ドキュメント

- [環境構築ガイド](./setup-guide.md)
- [CLAUDE.md](../CLAUDE.md) - トラブルシューティングセクション
- [ポート管理ガイド](./PORT_MANAGEMENT.md)
