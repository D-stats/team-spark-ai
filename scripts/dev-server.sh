#!/bin/bash

# 開発サーバーを起動し、正しく起動したことを確認するスクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ポート設定
PORT=${PORT:-3000}

echo -e "${BLUE}🚀 開発サーバーを起動します (ポート: $PORT)${NC}"

# 既存のNext.jsプロセスをチェック
check_existing_nextjs() {
  local pids=$(pgrep -f "next dev" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}⚠️  既存のNext.js開発サーバーが実行中です${NC}"
    echo -e "${YELLOW}   PID: $pids${NC}"
    echo -e "${YELLOW}   停止するには: npm run stop:all${NC}"
    return 1
  fi
  return 0
}

# サーバー起動
start_server() {
  # ポートチェック
  npm run check:ports
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ポートが使用中です${NC}"
    return 1
  fi
  
  # 既存プロセスチェック
  if ! check_existing_nextjs; then
    return 1
  fi
  
  # バックグラウンドでサーバー起動
  echo -e "${BLUE}📦 Next.js開発サーバーを起動中...${NC}"
  npm run dev > dev-server.log 2>&1 &
  local SERVER_PID=$!
  
  echo -e "${BLUE}   PID: $SERVER_PID${NC}"
  echo $SERVER_PID > .dev-server.pid
  
  # サーバーの起動を待機
  if ./scripts/wait-for-server.sh; then
    echo -e "\n${GREEN}🎉 開発環境の準備が整いました！${NC}"
    echo -e "${GREEN}📱 アクセスURL: http://localhost:$PORT${NC}"
    echo -e "${GREEN}📊 ヘルスチェック: http://localhost:$PORT/api/health${NC}"
    echo -e "${GREEN}🔧 開発者ダッシュボード: http://localhost:$PORT/dev${NC}"
    echo -e "\n${YELLOW}💡 サーバーを停止するには:${NC}"
    echo -e "   npm run stop:dev"
    echo -e "   または Ctrl+C"
    
    # ログの監視
    echo -e "\n${BLUE}📝 サーバーログ (Ctrl+C で終了):${NC}"
    tail -f dev-server.log
  else
    echo -e "${RED}❌ サーバーの起動に失敗しました${NC}"
    echo -e "${YELLOW}📋 ログを確認: tail -f dev-server.log${NC}"
    
    # プロセスをクリーンアップ
    if [ -n "$SERVER_PID" ] && kill -0 $SERVER_PID 2>/dev/null; then
      kill $SERVER_PID
    fi
    rm -f .dev-server.pid
    
    return 1
  fi
}

# クリーンアップハンドラー
cleanup() {
  echo -e "\n${YELLOW}🛑 サーバーを停止中...${NC}"
  if [ -f .dev-server.pid ]; then
    local PID=$(cat .dev-server.pid)
    if kill -0 $PID 2>/dev/null; then
      kill $PID
      echo -e "${GREEN}✅ サーバーを停止しました${NC}"
    fi
    rm -f .dev-server.pid
  fi
}

# シグナルハンドラー設定
trap cleanup EXIT INT TERM

# メイン処理
main() {
  start_server
}

main