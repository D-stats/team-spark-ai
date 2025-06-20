#!/bin/bash

# Pre-flight check script for development environment
# This script helps prevent schema mismatch errors and other common issues

echo "🚀 開発環境の事前チェックを開始します..."

# カラー定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 環境変数をロード
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# 1. Supabaseの状態確認
echo -e "\n📊 Supabaseの状態を確認中..."
if ! npx supabase status > /dev/null 2>&1; then
    echo -e "${RED}❌ Supabaseが起動していません${NC}"
    echo "   実行してください: npx supabase start"
    exit 1
else
    echo -e "${GREEN}✅ Supabaseが起動しています${NC}"
fi

# 2. データベース接続確認
echo -e "\n🔌 データベース接続を確認中..."
if ! DATABASE_URL="$DATABASE_URL" npx prisma db pull --print > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  データベース接続を確認できませんでした${NC}"
    echo "   DATABASE_URLが正しく設定されているか確認してください"
else
    echo -e "${GREEN}✅ データベースに接続できます${NC}"
fi

# 3. マイグレーション状態確認
echo -e "\n🔄 マイグレーション状態を確認中..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1)
if echo "$MIGRATION_STATUS" | grep -q "Database schema is not up to date"; then
    echo -e "${YELLOW}⚠️  未適用のマイグレーションがあります${NC}"
    echo "   実行してください: npx prisma migrate deploy"
    exit 1
elif echo "$MIGRATION_STATUS" | grep -q "Failed to apply"; then
    echo -e "${RED}❌ マイグレーションエラーがあります${NC}"
    echo "$MIGRATION_STATUS"
    exit 1
else
    echo -e "${GREEN}✅ マイグレーションは最新です${NC}"
fi

# 4. Prisma Client生成確認
echo -e "\n🏗️  Prisma Clientを確認中..."
if [ ! -d "node_modules/@prisma/client" ]; then
    echo -e "${YELLOW}⚠️  Prisma Clientが生成されていません${NC}"
    echo "   実行してください: npx prisma generate"
    exit 1
else
    echo -e "${GREEN}✅ Prisma Clientが生成されています${NC}"
fi

# 5. 依存関係の確認
echo -e "\n📦 依存関係を確認中..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo -e "${YELLOW}⚠️  依存関係がインストールされていません${NC}"
    echo "   実行してください: npm install"
    exit 1
else
    echo -e "${GREEN}✅ 依存関係がインストールされています${NC}"
fi

# 6. ポート競合確認
echo -e "\n🔍 ポート競合を確認中..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ポート3000が使用されています${NC}"
    echo "   別のポートを使用するか、既存のプロセスを停止してください"
    echo "   実行例: PORT=3001 npm run dev"
fi

# 7. TypeScript型チェック（高速版）
echo -e "\n📝 TypeScript型の簡易チェック中..."
if ! npx tsc --noEmit --skipLibCheck --incremental false 2>&1 | head -20; then
    echo -e "${YELLOW}⚠️  TypeScriptエラーがあります（詳細は npm run type-check で確認）${NC}"
else
    echo -e "${GREEN}✅ TypeScript型チェックOK（簡易版）${NC}"
fi

echo -e "\n${GREEN}🎉 事前チェック完了！開発を開始できます。${NC}"
echo -e "\n実行コマンド: ${YELLOW}npm run dev${NC}"