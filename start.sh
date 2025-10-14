#!/bin/bash
# 공통 프론트엔드 시작 스크립트 (로컬 + EC2 겸용)

# === 환경 감지 ===
if [ -d "/home/ubuntu" ]; then
  ENV="EC2"
  APP_DIR="/home/ubuntu/frontend"
  LOG_FILE="$APP_DIR/frontend.log"
else
  ENV="LOCAL"
  APP_DIR="$(pwd)" # 현재 디렉토리 기준
  LOG_FILE="$APP_DIR/frontend.log"
fi

PORT=80  # 필요시 변경

echo "Environment detected: $ENV"
echo "App directory: $APP_DIR"
echo "Log file: $LOG_FILE"

cd "$APP_DIR" || {
  echo "경로를 찾을 수 없습니다: $APP_DIR"
  exit 1
}

echo "Stopping existing npm start process (if any)..."
pkill -f "npm start" || true

# === EC2에서는 nohup 백그라운드 실행 ===
if [ "$ENV" = "EC2" ]; then
  echo "Starting frontend in background (nohup)..."
  nohup npm start > "$LOG_FILE" 2>&1 &
  sleep 2
else
  # === 로컬에서는 일반 실행 (터미널에서 로그 확인 가능) ===
  echo "Starting frontend in foreground..."
  npm start
  exit 0
fi

PID=$(pgrep -f "npm start" || true)

if [ -n "$PID" ]; then
  echo "Frontend started successfully (PID: $PID)"
  echo "Logs: tail -f $LOG_FILE"
else
  echo "Failed to start frontend. Check log: $LOG_FILE"
fi