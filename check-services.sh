#!/bin/bash

echo "🔍 TeamSpark AI サービス状態確認"
echo "================================"

# Check Docker containers
echo -e "\n📦 Docker コンテナ:"
docker compose ps

# Check if Next.js is running
echo -e "\n🌐 開発サーバー:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 開発サーバーは起動しています (http://localhost:3000)"
else
    echo "❌ 開発サーバーは起動していません"
    echo "   起動するには: ./start-dev.sh"
fi

# Check if Storybook is running
echo -e "\n🎨 Storybook:"
if curl -s http://localhost:6006 > /dev/null 2>&1; then
    echo "✅ Storybookは起動しています (http://localhost:6006)"
else
    echo "❌ Storybookは起動していません"
    echo "   起動するには: npm run storybook"
fi

# Check if Prisma Studio is running
echo -e "\n💾 Prisma Studio:"
if curl -s http://localhost:5555 > /dev/null 2>&1; then
    echo "✅ Prisma Studioは起動しています (http://localhost:5555)"
else
    echo "❌ Prisma Studioは起動していません"
    echo "   起動するには: npm run prisma:studio"
fi

echo -e "\n================================"
echo "📝 ログイン情報:"
echo "  Admin: admin@demo.com"
echo "  Manager: sarah.manager@demo.com"
echo "  Developer: john.dev@demo.com"
echo "  Sales: emily.sales@demo.com"