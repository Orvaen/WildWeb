#!/usr/bin/env bash
# Met le serveur à jour avec la dernière version de GitHub (branche main).
#   sudo bash /opt/wildweb/deploy/update.sh
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "Lance ce script avec sudo."; exit 1; }
DIR="$(cd "$(dirname "$0")/.." && pwd)"

git -C "$DIR" pull --ff-only
bash "$DIR/deploy/build.sh"
cp "$DIR/deploy/wildlink-api.service" /etc/systemd/system/wildlink-api.service
systemctl daemon-reload
systemctl restart wildlink-api
sleep 1
curl -fsS http://127.0.0.1:8081/api/health && echo && echo "Mise à jour terminée."
