#!/bin/bash
# Запускать на сервере после git push: подтянуть код и перезапустить API
set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"
git pull
pm2 restart api-demo
echo "Done: api-demo restarted"
