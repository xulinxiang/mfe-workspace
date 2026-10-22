#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MYSQL_SOCK="$ROOT/.tools/mysql-data/mysql.sock"
MYSQL_BIN="$ROOT/.tools/mysql-8.0.40-macos14-arm64/bin"
LOG_DIR="$ROOT/.tools"
JAVA_HOME="${JAVA_HOME:-/Users/go-talent/Library/Java/JavaVirtualMachines/corretto-1.8.0_504/Contents/Home}"
export JAVA_HOME

if [ ! -S "$MYSQL_SOCK" ]; then
  echo "[mysql] starting..."
  nohup "$MYSQL_BIN/mysqld" \
    --datadir="$ROOT/.tools/mysql-data" \
    --socket="$MYSQL_SOCK" \
    --port=3306 \
    --bind-address=127.0.0.1 \
    --mysqlx=0 >>"$LOG_DIR/mysql.log" 2>&1 &
  for _ in $(seq 1 15); do
    [ -S "$MYSQL_SOCK" ] && break
    sleep 1
  done
fi

for port in 8088 8080 5000 5001 5002; do
  lsof -ti :"$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
done
sleep 1

echo "[api] starting on 8088..."
cd "$ROOT/aicode-platform"
nohup "$ROOT/.tools/apache-maven-3.9.5/bin/mvn" -q spring-boot:run \
  -Dspring-boot.run.arguments=--server.port=8088 >>"$LOG_DIR/backend.log" 2>&1 &
echo $! >"$LOG_DIR/backend.pid"

for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8088/api/auth/login \
    -X POST -H 'Content-Type: application/json' -d '{}' 2>/dev/null) || true
  [ -n "$code" ] || code=000
  case "$code" in 200|400|401|403) echo "[api] ready ($code)"; break ;; esac
  sleep 1
  if [ "$i" -eq 60 ]; then echo "[api] timeout"; exit 1; fi
done

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 >/dev/null

cd "$ROOT/aicode-web"
echo "[host] 5000"
nohup npm run dev -w @mfe/host >>"$LOG_DIR/host-dev.log" 2>&1 &
echo $! >"$LOG_DIR/host-dev.pid"
echo "[product] 5001"
nohup npm run dev -w @mfe/product >>"$LOG_DIR/product-dev.log" 2>&1 &
echo $! >"$LOG_DIR/product-dev.pid"
echo "[user] 5002"
nohup npm run dev -w @mfe/user >>"$LOG_DIR/user-dev.log" 2>&1 &
echo $! >"$LOG_DIR/user-dev.pid"

http_code() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$1" 2>/dev/null) || true
  if [ -z "$code" ]; then code=000; fi
  printf '%s' "$code"
}

for i in $(seq 1 90); do
  h=$(http_code http://127.0.0.1:5000/)
  p=$(http_code http://127.0.0.1:5001/)
  u=$(http_code http://127.0.0.1:5002/)
  if [ "$h" != "000" ] && [ "$p" != "000" ] && [ "$u" != "000" ]; then
    echo "[frontend] host=$h product=$p user=$u"
    exit 0
  fi
  sleep 1
done

echo "[frontend] timeout — check $LOG_DIR/*-dev.log"
exit 1
