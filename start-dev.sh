#!/bin/bash

# TeamSpark AI Development Server Startup Script

echo "🚀 TeamSpark AI 開発環境を起動します..."

# Set environment variables
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/teamspark?schema=public"
export REDIS_URL="redis://localhost:6379"

# Check if Docker containers are running
echo "📦 Docker コンテナを確認中..."
if ! docker compose ps | grep -q "team-spark-db.*Up.*healthy"; then
    echo "⚠️  PostgreSQL が起動していません。起動します..."
    docker compose up -d postgres
    sleep 5
fi

if ! docker compose ps | grep -q "team-spark-redis.*Up.*healthy"; then
    echo "⚠️  Redis が起動していません。起動します..."
    docker compose up -d redis
    sleep 3
fi

# Run migrations if needed
echo "🔄 データベースマイグレーションを確認中..."
npx prisma migrate deploy 2>/dev/null || {
    echo "📝 マイグレーションを実行します..."
    npx prisma migrate dev
}

# Generate Prisma client
echo "🏗️  Prisma Client を生成中..."
npx prisma generate

# Start the development server
echo "🌟 開発サーバーを起動します..."
echo "📍 URL: http://localhost:3000"
echo "📚 API Docs: http://localhost:3000/api-docs"
echo "🎨 Storybook: http://localhost:6006 (別途起動が必要)"
echo ""
echo "ログイン情報:"
echo "  Admin: admin@demo.com"
echo "  Manager: sarah.manager@demo.com"
echo "  Developer: john.dev@demo.com"
echo "  Sales: emily.sales@demo.com"
echo ""

# Start Next.js
npm run dev