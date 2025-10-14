#!/bin/bash
# 공통 프론트엔드 종료 스크립트 (로컬 + EC2 겸용)

if [ -d "/home/ubuntu" ]; then
  APP_DIR="/home/ubuntu/frontend"
else
  ENV="LOCAL"
  APP_DIR="$(pwd)" # 현재 디렉토리 기준
fi
PID_FILE="$APP_DIR/frontend.pid"
PORT=8081

# PID 파일 기반 종료
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p $PID > /dev/null 2>&1; then
    echo "프론트엔드 중지 중... (PID: $PID)"
    kill $PID
    rm -f "$PID_FILE"
    echo "프로세스 종료 완료."
    exit 0
  else
    echo "PID 파일은 있지만 프로세스가 없습니다. 정리합니다."
    rm -f "$PID_FILE"
  fi
fi

# PID 파일 없으면 포트로 종료 시도
PORT_PID=$(lsof -t -i:$PORT)
if [ -n "$PORT_PID" ]; then
  echo "포트 $PORT 사용 중 프로세스 종료 (PID: $PORT_PID)"
  kill -9 $PORT_PID
  echo "포트 $PORT 해제 완료."
else
  echo "실행 중인 프론트엔드 프로세스를 찾지 못했습니다."
fi