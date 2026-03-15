#!/bin/bash
# Запускать на сервере после git pull: обновить env Blockscout, порт 4000, поднять контейнеры, перезапустить API.
set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"
git pull origin main

BLOCKSCOUT_ROOT="/root/blockscout/docker-compose"
if [ -d "$BLOCKSCOUT_ROOT" ]; then
  cp "$PROJECT_ROOT/docs/blockscout-demochain.env" "$BLOCKSCOUT_ROOT/envs/common-blockscout.env"
  [ -f "$PROJECT_ROOT/docs/blockscout-frontend-demochain.env" ] && cp "$PROJECT_ROOT/docs/blockscout-frontend-demochain.env" "$BLOCKSCOUT_ROOT/envs/common-frontend.env"
  NGINX_YML="$BLOCKSCOUT_ROOT/services/nginx.yml"
  if [ -f "$NGINX_YML" ]; then
    sed -i 's/published: 400080/published: 8080/g; s/published: 400081/published: 8081/g' "$NGINX_YML"
    sed -i '0,/published: 80$/s/published: 80$/published: 4000/' "$NGINX_YML"
  fi
  (cd "$BLOCKSCOUT_ROOT" && docker compose up -d --force-recreate frontend 2>/dev/null || docker compose up -d)
fi

pm2 restart demochain-api
echo "Done: demochain-api restarted"
