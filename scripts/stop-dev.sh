#!/bin/bash

# 開発サーバーを安全に停止するスクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 開発サーバーを停止します...${NC}"

# PIDファイルから停止
if [ -f .dev-server.pid ]; then
  PID=$(cat .dev-server.pid)
  if kill -0 $PID 2>/dev/null; then
    kill $PID
    echo -e "${GREEN}✅ サーバーを停止しました (PID: $PID)${NC}"
    rm -f .dev-server.pid
  else
    echo -e "${YELLOW}⚠️  PIDファイルは存在しますが、プロセスが見つかりません${NC}"
    rm -f .dev-server.pid
  fi
else
  echo -e "${YELLOW}⚠️  PIDファイルが見つかりません${NC}"
fi

# Next.jsプロセスを検索して停止
NEXT_PIDS=$(pgrep -f "next dev" 2>/dev/null || true)
if [ -n "$NEXT_PIDS" ]; then
  echo -e "${YELLOW}🔍 実行中のNext.jsプロセスを発見:${NC}"
  for pid in $NEXT_PIDS; do
    echo -e "   PID: $pid"
    kill $pid 2>/dev/null || true
  done
  echo -e "${GREEN}✅ Next.jsプロセスを停止しました${NC}"
fi

# ログファイルのクリーンアップ（オプション）
if [ -f dev-server.log ]; then
  echo -e "${YELLOW}📋 ログファイルを保持します: dev-server.log${NC}"
  echo -e "   削除する場合: rm dev-server.log"
fi

echo -e "${GREEN}✨ クリーンアップ完了${NC}"