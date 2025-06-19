#!/bin/bash

# サーバーの起動を待機するスクリプト
# 正しいサービスが起動していることを確認

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# デフォルト設定
PORT=${PORT:-3000}
MAX_ATTEMPTS=30
ATTEMPT=0
SLEEP_TIME=2

echo -e "${BLUE}🔍 サーバーの起動を確認中... (ポート: $PORT)${NC}"

# ポートが開いているかチェック
wait_for_port() {
  while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 0
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -ne "\r⏳ 待機中... ($ATTEMPT/$MAX_ATTEMPTS)"
    sleep $SLEEP_TIME
  done
  return 1
}

# ヘルスチェックエンドポイントの確認
check_health() {
  local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health 2>/dev/null || echo "000")
  if [ "$response" = "200" ] || [ "$response" = "503" ]; then
    return 0
  fi
  return 1
}

# サービスの詳細確認
verify_service() {
  local health_data=$(curl -s http://localhost:$PORT/api/health 2>/dev/null || echo "{}")
  
  # jqがインストールされている場合は使用、なければ簡易的なチェック
  if command -v jq &> /dev/null; then
    local service_name=$(echo "$health_data" | jq -r '.service // "unknown"')
    local status=$(echo "$health_data" | jq -r '.status // "unknown"')
  else
    # 簡易的なサービス名チェック
    if echo "$health_data" | grep -q "startup-hr-engagement"; then
      local service_name="startup-hr-engagement"
      local status="ok"
    else
      local service_name="unknown"
      local status="unknown"
    fi
  fi
  
  if [ "$service_name" = "startup-hr-engagement" ]; then
    echo -e "\n${GREEN}✅ 正しいサービスが起動しています！${NC}"
    echo -e "${GREEN}   サービス: $service_name${NC}"
    echo -e "${GREEN}   ステータス: $status${NC}"
    echo -e "${GREEN}   URL: http://localhost:$PORT${NC}"
    return 0
  else
    echo -e "\n${RED}❌ 別のサービスがポート $PORT を使用しています${NC}"
    echo -e "${YELLOW}   検出されたサービス: $service_name${NC}"
    
    # 使用中のプロセス情報を表示
    echo -e "\n${YELLOW}📝 ポート $PORT を使用中のプロセス:${NC}"
    lsof -i :$PORT | grep LISTEN | head -5 || echo "プロセス情報を取得できません"
    
    return 1
  fi
}

# メイン処理
main() {
  # ポートが開くまで待機
  if ! wait_for_port; then
    echo -e "\n${RED}❌ タイムアウト: サーバーが起動しませんでした${NC}"
    exit 1
  fi
  
  echo -e "\n${YELLOW}🔄 ヘルスチェックを実行中...${NC}"
  
  # ヘルスチェックエンドポイントの確認（少し待機）
  sleep 2
  
  if ! check_health; then
    echo -e "\n${YELLOW}⚠️  ヘルスチェックエンドポイントが応答しません${NC}"
    echo -e "${YELLOW}   通常のHTTPサービスの可能性があります${NC}"
    
    # 基本的なHTTP応答チェック
    local http_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/ 2>/dev/null || echo "000")
    if [ "$http_response" = "200" ] || [ "$http_response" = "404" ]; then
      echo -e "${YELLOW}   HTTPサービスは応答しています（ステータス: $http_response）${NC}"
    fi
  fi
  
  # サービスの詳細確認
  if verify_service; then
    exit 0
  else
    echo -e "\n${YELLOW}💡 ヒント:${NC}"
    echo -e "   1. 別のポートで起動: PORT=3001 npm run dev"
    echo -e "   2. 既存プロセスを停止: npm run stop:all"
    echo -e "   3. ポート状況を確認: npm run check:ports"
    exit 1
  fi
}

# スクリプト実行
main