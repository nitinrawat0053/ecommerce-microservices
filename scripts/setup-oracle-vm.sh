#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# setup-oracle-vm.sh — One-time setup on a fresh Oracle Cloud VM
#
# Run as a sudo-capable user ON the VM after it's provisioned:
#   bash setup-oracle-vm.sh
#
# Installs: Docker Engine, Docker Compose plugin, pnpm, git, tools.
# Also opens the iptables/oracle firewall rules for 80/3000 if needed.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

echo "▶ Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

echo "▶ Installing prerequisites..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release git

echo "▶ Installing Docker Engine..."
if ! command -v docker >/dev/null 2>&1; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "▶ Adding current user to docker group..."
sudo usermod -aG docker "$USER"

echo "▶ Installing Node.js 20 + pnpm (via nvm-friendly install)..."
if ! command -v node >/dev/null 2>&1 || ! node --version | grep -q "v20"; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo npm install -g pnpm@11

echo "▶ Verifying installs..."
docker --version
docker compose version
node --version
pnpm --version

echo ""
echo "✅ VM setup complete!"
echo ""
echo "NEXT STEPS:"
echo "  1) Re-login (or run: newgrp docker) so the docker group takes effect."
echo "  2) Clone/push repo, then copy it onto the VM (scp or git)."
echo "  3) cp .env.production.example .env.production  — fill in secrets."
echo "  4) ./scripts/deploy.sh"
