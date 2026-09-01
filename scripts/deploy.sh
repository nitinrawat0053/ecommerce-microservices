#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# deploy.sh — Build & deploy the whole stack on the Oracle VM
#
# Run this ON the Oracle Cloud VM from the repo root:
#   ./scripts/deploy.sh
#
# 1. Pulls latest code         (git pull)
# 2. Installs deps             (pnpm install)
# 3. Copies prod env if absent (.env.production)
# 4. Builds & starts           (docker compose up -d --build)
# 5. Shows status + logs       (docker compose ps / logs --tail)
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ [1/6] Pulling latest code..."
git pull --rebase || echo "  (no changes / not a git remote — continuing)"

echo "▶ [2/6] Ensuring production env file exists..."
if [ ! -f .env.production ]; then
  echo "  ⚠ Missing .env.production — copying from example."
  cp .env.production.example .env.production
  echo "  ✏ EDIT .env.production with your secrets, then re-run deploy.sh"
  exit 1
fi

echo "▶ [3/6] Installing dependencies (pnpm)..."
corepack enable
corepack prepare pnpm@11 --activate
pnpm install --frozen-lockfile || pnpm install

echo "▶ [4/6] Building & starting containers..."
docker compose -f docker-compose.prod.yml up -d --build

echo "▶ [5/6] Waiting for services to warm up... (45s)"
sleep 45

echo "▶ [6/6] Container status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deploy complete. Live checks:"
echo "   Frontend : http://$(hostname -I | awk '{print $1}')/"
echo "   API      : http://$(hostname -I | awk '{print $1}'):3000/api/"
echo ""
echo "   Logs:  docker compose -f docker-compose.prod.yml logs -f"
