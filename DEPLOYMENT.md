# 🚀 Deployment Guide — Oracle Cloud Always Free

Deploy your entire ecommerce microservices stack **for free, forever** on Oracle Cloud's
Always Free tier (1 ARM VM with 4 OCPUs / 24 GB RAM). You only pay nothing — the entire
stack (8 backend services + Redis + RabbitMQ + frontend) runs in Docker on one VM.

---

## What was prepared (in this repo)

| File | Purpose |
|---|---|
| `Dockerfile` (root) | Reusable multi-stage Dockerfile for all 8 backend services |
| `apps/web/Dockerfile` | Frontend build (Node) → serve (Nginx) |
| `apps/web/nginx.conf` | SPA hosting + reverse-proxy `/api` → gateway |
| `docker-compose.prod.yml` | Runs the full stack (all services + Redis + RabbitMQ) |
| `.env.production.example` | Template for production secrets |
| `scripts/setup-oracle-vm.sh` | One-time VM setup (Docker, Compose, pnpm) |
| `scripts/deploy.sh` | Build + deploy + health check |
| `scripts/check-health.sh` | Live status report |

---

## Part A — Only YOU can do this (Oracle Cloud)

> ⚠️ These steps require your personal email/account. I can't do them for you.

### A1. Create an Oracle Cloud account
1. Go to **https://www.oracle.com/cloud/free/**
2. Click **Start for free** → sign up with email
3. Choose **"Individual"** account type
4. Verify your email + add a payment method ✅ *(required, but you are NEVER charged on the Always Free tier — just prevents fraud)*

### A2. Create the ARM VM
1. In the console: **Compute → Instances → Create instance**
2. **Name**: `ecommerce-vm`
3. **Image**: Ubuntu 22.04 (or 24.04) — default is fine
4. **Shape** → **Change shape** → select **Ampere A1 Flex**
   - **OCPU**: 4, **Memory**: 24 GB (Always Free)
   - If 4/24 unavailable, create 2 reserved VMs with 2 OCPU/12GB each
5. **SSH key**: choose **"Generate a key pair"** → download the `.pem` and `.key` files
   - 🗝️ **SAVE THIS KEY** — it's your only way into the VM
6. **Create instance**. Note the **Public IP**.

### A3. Open firewall ports
1. In console: **Networking → Virtual Cloud Networks → your VCN → Security List → Default Security List → Add Ingress Rules**
2. Add these rows (Source CIDR = `0.0.0.0/0`):

| Source CIDR | IP Protocol | Destination Port |
|---|---|---|
| 0.0.0.0/0 | TCP | 80 |
| 0.0.0.0/0 | TCP | 3000 |
| 0.0.0.0/0 | TCP | 22 |

---

## Part B — Give me SSH access (or run it yourself)

You have two options:

### Option B1 (easiest for you): I guide your terminal
In Claude, you can run commands with `!` prefix. We'll do:
```bash
ssh -i your-key.pem ubuntu@<PUBLIC_IP>
```
Then run the scripts step by step together.

### Option B2: I need the SSH key from you
If you want me to run the remote commands directly, I'll need access to the SSH key
(the `.pem` file) and the VM's public IP. **Share them only if you're comfortable.**

---

## Part C — On the VM (I can run these)

### C1. One-time VM setup
```bash
cd ~ && git clone <your-repo-url> ecommerce-microservices && cd ecommerce-microservices
bash scripts/setup-oracle-vm.sh
newgrp docker   # activate docker group
```

### C2. Configure secrets
```bash
cp .env.production.example .env.production
nano .env.production   # ✏ fill in real secrets
```

### C3. Deploy
```bash
./scripts/deploy.sh
```

### C4. Verify live
```bash
./scripts/check-health.sh
# Frontend:  http://<PUBLIC_IP>/
#    API   :  http://<PUBLIC_IP>:3000/api/
```

---

## Mapping your existing `.env` → `.env.production`

Your current `.env` values carry over directly. For `.env.production`, change **only**:

| Old (dev) | New (prod) |
|---|---|
| `USER_SERVICE_URL=http://localhost:3002` | `http://user-service:3002` |
| `PRODUCT_SERVICE_URL=http://localhost:3003` | `http://product-service:3003` |
| `ORDER_SERVICE_URL=http://localhost:3004` | `http://order-service:3004` |
| `RABBITMQ_URL=amqp://...@localhost:5672` | `amqp://admin:admin@rabbitmq:5672` |
| `REDIS_URL=redis://localhost:6379` | `redis://redis:6379` |
| `NODE_ENV=development` | `production` |

**Unchanged**: `MONGODB_URI` (Atlas — cloud, same), all API keys
(Twilio/Resend/Razorpay/Cloudinary), Super Admin creds.

> 🔒 **Security note**: your live-looking API keys and MongoDB password are currently in
> `.env` — it IS gitignored, but once you open the ports to the internet, **rotate the
> MongoDB password and Twilio/Resend keys in the Oracle dashboard** to be safe.

---

## Optional — Real domain + HTTPS

The free tier includes:
- **Oracle Load Balancer** (free, 10 Mbps) with a free SSL cert
- Or use **Cloudflare** (free) in front of your VM IP for HTTPS + CDN + hiding the IP

Ask me and I'll set up HTTPS with free SSL.

---

## Cost summary

| Item | Cost |
|---|---|
| Oracle Cloud Always Free ARM VM (4 OCPU / 24GB) | **$0 / mo forever** |
| MongoDB Atlas (M0 free cluster) | **$0 / mo** |
| Docker / Redis / RabbitMQ (on the VM) | **$0** |
| **TOTAL** | **$0 / month** |
