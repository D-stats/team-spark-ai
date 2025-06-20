#!/bin/bash

# ポート競合チェックスクリプト
# 開発環境で必要なポートが利用可能かチェックする

set -e

# カラー出力用の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# デフォルトポート（環境変数で上書き可能）
NEXT_PORT=${PORT:-3000}
SUPABASE_API_PORT=${SUPABASE_API_PORT:-54321}
SUPABASE_DB_PORT=${SUPABASE_DB_PORT:-54322}
SUPABASE_STUDIO_PORT=${SUPABASE_STUDIO_PORT:-54323}
SUPABASE_INBUCKET_PORT=${SUPABASE_INBUCKET_PORT:-54324}

# チェックモード（環境変数で制御）
CHECK_SUPABASE=${CHECK_SUPABASE:-false}

# チェック対象のポート配列
if [ "$CHECK_SUPABASE" = "true" ]; then
  # Supabaseポートも含めてチェック
  declare -A PORTS=(
    ["Next.js"]=$NEXT_PORT
    ["Supabase API"]=$SUPABASE_API_PORT
    ["Supabase DB"]=$SUPABASE_DB_PORT
    ["Supabase Studio"]=$SUPABASE_STUDIO_PORT
    ["Inbucket Mail"]=$SUPABASE_INBUCKET_PORT
  )
else
  # Next.jsポートのみチェック（通常の開発時）
  declare -A PORTS=(
    ["Next.js"]=$NEXT_PORT
  )
fi

# ポートチェック関数
check_port() {
  local port=$1
  local service=$2
  
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗${NC} Port ${YELLOW}$port${NC} is already in use (required for $service)"
    return 1
  else
    echo -e "${GREEN}✓${NC} Port ${YELLOW}$port${NC} is available ($service)"
    return 0
  fi
}

# ポート使用プロセスを表示
show_port_usage() {
  local port=$1
  echo -e "${YELLOW}Process using port $port:${NC}"
  lsof -i :$port | grep LISTEN || echo "Could not identify process"
}

# 代替ポートを提案
suggest_alternative() {
  local base_port=$1
  local service=$2
  local alt_port=$((base_port + 1))
  
  while lsof -Pi :$alt_port -sTCP:LISTEN -t >/dev/null 2>&1; do
    alt_port=$((alt_port + 1))
  done
  
  echo -e "${GREEN}Suggested alternative port for $service: $alt_port${NC}"
  echo "You can use: PORT=$alt_port npm run dev"
}

# メインチェック処理
echo "🔍 Checking required ports for development environment..."
echo ""

ALL_CLEAR=true

for service in "${!PORTS[@]}"; do
  port=${PORTS[$service]}
  if ! check_port $port "$service"; then
    ALL_CLEAR=false
    show_port_usage $port
    suggest_alternative $port "$service"
    echo ""
  fi
done

echo ""

if [ "$ALL_CLEAR" = true ]; then
  echo -e "${GREEN}✅ All ports are available! You can start the development environment.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some ports are in use. Please free them or use alternative ports.${NC}"
  echo ""
  echo "Quick fixes:"
  echo "1. Kill process using a port: kill -9 \$(lsof -ti:PORT)"
  echo "2. Use alternative port: PORT=3001 npm run dev"
  echo "3. Stop all services: npm run stop:all"
  exit 1
fi