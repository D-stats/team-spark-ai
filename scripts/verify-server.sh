#!/bin/bash

# 正しい開発サーバーが起動していることを確認するスクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PORT=${PORT:-3000}

echo -e "${BLUE}🔍 サーバーの検証を開始します (ポート: $PORT)${NC}"

# 1. ポートが開いているかチェック
check_port_open() {
  if ! lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ ポート $PORT は開いていません${NC}"
    return 1
  fi
  echo -e "${GREEN}✓ ポート $PORT は開いています${NC}"
  return 0
}

# 2. プロセス情報を取得
check_process_info() {
  local process_info=$(lsof -i :$PORT | grep LISTEN | head -1)
  if [ -z "$process_info" ]; then
    echo -e "${RED}❌ プロセス情報を取得できません${NC}"
    return 1
  fi
  
  echo -e "${BLUE}📋 プロセス情報:${NC}"
  echo "$process_info"
  
  # Node.jsプロセスかチェック
  if echo "$process_info" | grep -q "node"; then
    echo -e "${GREEN}✓ Node.jsプロセスが検出されました${NC}"
  else
    echo -e "${YELLOW}⚠️  Node.js以外のプロセスが検出されました${NC}"
    return 1
  fi
  
  return 0
}

# 3. Next.jsのレスポンスヘッダーをチェック
check_nextjs_headers() {
  echo -e "${BLUE}🌐 HTTPレスポンスをチェック中...${NC}"
  
  local headers=$(curl -s -I http://localhost:$PORT/ 2>/dev/null || echo "")
  
  if [ -z "$headers" ]; then
    echo -e "${RED}❌ HTTPレスポンスを取得できません${NC}"
    return 1
  fi
  
  # X-Powered-Byヘッダーをチェック
  if echo "$headers" | grep -q "X-Powered-By: Next.js"; then
    echo -e "${GREEN}✓ Next.jsサーバーが検出されました${NC}"
  else
    echo -e "${YELLOW}⚠️  Next.jsヘッダーが見つかりません${NC}"
    # 開発環境では必ずしもこのヘッダーがない場合もある
  fi
  
  return 0
}

# 4. ヘルスチェックエンドポイントの内容を検証
check_health_endpoint() {
  echo -e "${BLUE}🏥 ヘルスチェックエンドポイントを検証中...${NC}"
  
  local health_response=$(curl -s http://localhost:$PORT/api/health 2>/dev/null || echo "{}")
  
  # レスポンスが空でないかチェック
  if [ "$health_response" = "{}" ] || [ -z "$health_response" ]; then
    echo -e "${YELLOW}⚠️  ヘルスチェックエンドポイントが応答しません${NC}"
    return 1
  fi
  
  # サービス名を確認（jqがなくても動作するように）
  if echo "$health_response" | grep -q '"service":"startup-hr-engagement"'; then
    echo -e "${GREEN}✓ 正しいサービス (startup-hr-engagement) が確認されました${NC}"
    
    # ステータスも確認
    if echo "$health_response" | grep -q '"status":"ok"'; then
      echo -e "${GREEN}✓ サービスステータス: OK${NC}"
    else
      echo -e "${YELLOW}⚠️  サービスステータスが正常ではありません${NC}"
    fi
    
    return 0
  else
    echo -e "${RED}❌ 別のサービスが動作している可能性があります${NC}"
    echo -e "${YELLOW}レスポンス:${NC}"
    echo "$health_response" | head -3
    return 1
  fi
}

# 5. 特定のNext.jsルートをチェック
check_nextjs_routes() {
  echo -e "${BLUE}🛣️  Next.jsルートをチェック中...${NC}"
  
  # _next/staticディレクトリの存在確認
  local static_check=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/_next/static/ 2>/dev/null || echo "000")
  
  if [ "$static_check" = "404" ] || [ "$static_check" = "200" ]; then
    echo -e "${GREEN}✓ Next.jsの静的ルートが確認されました${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  Next.jsの静的ルートが見つかりません（コード: $static_check）${NC}"
    return 1
  fi
}

# 6. 総合判定
verify_server() {
  local checks_passed=0
  local total_checks=5
  
  echo -e "\n${BLUE}========== サーバー検証結果 ==========${NC}\n"
  
  if check_port_open; then ((checks_passed++)); fi
  echo ""
  
  if check_process_info; then ((checks_passed++)); fi
  echo ""
  
  if check_nextjs_headers; then ((checks_passed++)); fi
  echo ""
  
  if check_health_endpoint; then ((checks_passed++)); fi
  echo ""
  
  if check_nextjs_routes; then ((checks_passed++)); fi
  echo ""
  
  echo -e "${BLUE}=====================================${NC}"
  echo -e "${BLUE}チェック結果: $checks_passed/$total_checks${NC}"
  
  if [ $checks_passed -ge 3 ]; then
    echo -e "${GREEN}✅ 開発サーバーが正常に動作しています${NC}"
    echo -e "${GREEN}📱 URL: http://localhost:$PORT${NC}"
    return 0
  else
    echo -e "${RED}❌ 正しい開発サーバーが動作していない可能性があります${NC}"
    echo -e "${YELLOW}💡 ヒント:${NC}"
    echo -e "   1. npm run devでサーバーを起動してください"
    echo -e "   2. 別のサービスが動作している場合は停止してください"
    echo -e "   3. npm run check:portsでポート状況を確認してください"
    return 1
  fi
}

# メイン実行
verify_server