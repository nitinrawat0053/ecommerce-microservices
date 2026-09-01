#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# check-health.sh — Quick health/status report for the stack.
#
#   ./scripts/check-health.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -20

echo ""
echo "=== Last 20 lines per backend service (errors highlighted) ==="
for svc in api-gateway auth-service user-service product-service order-service cart-service payment-service notification-service web; do
  echo ""
  echo "--- $svc ---"
  docker compose -f docker-compose.prod.yml logs --tail=20 "$svc" 2>/dev/null \
    | grep -iE "error|fail|listen|running|port|EADDR|ENOENT" | tail -8 || true
done
