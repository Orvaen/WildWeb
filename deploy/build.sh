#!/usr/bin/env bash
# Construit le site (web/dist) et l'API (api/wildlink-api). Utilisé par install.sh et update.sh.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/usr/local/go/bin:$PATH"

echo "Site…"
cd "$DIR/web"
if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
npm run build

echo "API…"
cd "$DIR/api"
go mod download || go mod tidy
CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o wildlink-api.new .
mv wildlink-api.new wildlink-api
