#!/usr/bin/env bash
# Installation de Wild Link sur un serveur Ubuntu/Debian neuf (x86_64 ou ARM, ex. Oracle Cloud Always Free).
#   curl -fsSL https://raw.githubusercontent.com/Orvaen/WildWeb/main/deploy/install.sh -o install.sh
#   sudo bash install.sh wildlink.arkerion.dev
#
# Installe Git, Go, Node et Caddy, construit le site et l'API, crée le service et le HTTPS.
# Peut être relancé sans risque : il garde la base, les images envoyées et le secret JWT.
set -euo pipefail

DOMAIN="${1:?Usage : sudo bash install.sh wildlink.arkerion.dev}"
REPO="https://github.com/Orvaen/WildWeb.git"
DIR="/opt/wildweb"
DATA="/var/lib/wildlink"
GO_VERSION="1.23.4"
NODE_MAJOR="20"

[ "$(id -u)" -eq 0 ] || { echo "Lance ce script avec sudo."; exit 1; }
step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }

case "$(uname -m)" in
  x86_64) ARCH=amd64 ;;
  aarch64 | arm64) ARCH=arm64 ;;
  *) echo "Architecture non prise en charge : $(uname -m)"; exit 1 ;;
esac

step "Paquets système"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ca-certificates gnupg openssl debian-keyring debian-archive-keyring apt-transport-https

step "Go $GO_VERSION"
if ! /usr/local/go/bin/go version 2>/dev/null | grep -q "go$GO_VERSION"; then
  rm -rf /usr/local/go
  curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${ARCH}.tar.gz" | tar -C /usr/local -xz
fi
export PATH="/usr/local/go/bin:$PATH"

step "Node $NODE_MAJOR"
if ! node -v 2>/dev/null | grep -q "^v$NODE_MAJOR\."; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi

step "Caddy (serveur web + HTTPS automatique)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

step "Pare-feu : ports 80 et 443"
# Les images Ubuntu d'Oracle Cloud bloquent tout sauf SSH dans iptables.
if command -v iptables >/dev/null; then
  for port in 80 443; do
    iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
  done
  command -v netfilter-persistent >/dev/null && netfilter-persistent save || true
fi
command -v ufw >/dev/null && ufw status | grep -q active && { ufw allow 80/tcp; ufw allow 443/tcp; } || true

step "Code source"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone "$REPO" "$DIR"; fi

step "Utilisateur et dossiers"
id wildlink >/dev/null 2>&1 || useradd --system --home "$DATA" --shell /usr/sbin/nologin wildlink
mkdir -p "$DATA/uploads"
chown -R wildlink:wildlink "$DATA"

step "Configuration (/etc/wildlink/wildlink.env)"
mkdir -p /etc/wildlink
if [ ! -f /etc/wildlink/wildlink.env ]; then
  cat > /etc/wildlink/wildlink.env <<EOF
WL_ADDR=127.0.0.1:8081
WL_DB=$DATA/wildlink.db
WL_UPLOADS=$DATA/uploads
WL_WEB_ORIGIN=https://$DOMAIN
WL_JWT_SECRET=$(openssl rand -hex 32)
# Mets 1 si le nuage est orange (proxy Cloudflare) pour lire l'IP réelle des joueurs.
WL_TRUST_CLOUDFLARE=0
EOF
  chmod 600 /etc/wildlink/wildlink.env
fi

step "Construction"
bash "$DIR/deploy/build.sh"

step "Service de l'API"
cp "$DIR/deploy/wildlink-api.service" /etc/systemd/system/wildlink-api.service
systemctl daemon-reload
systemctl enable wildlink-api
systemctl restart wildlink-api

step "Caddy pour $DOMAIN"
sed "s/{DOMAIN}/$DOMAIN/g" "$DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy || systemctl restart caddy

step "Vérification"
sleep 2
if curl -fsS http://127.0.0.1:8081/api/health; then
  echo
  echo "Wild Link est en ligne : https://$DOMAIN"
  echo "Le premier accès peut prendre quelques secondes, le temps que Caddy obtienne le certificat HTTPS."
else
  echo "L'API ne répond pas. Regarde les logs : journalctl -u wildlink-api -n 50"
  exit 1
fi
