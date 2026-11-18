# 🚀 Velora CRM - Production Architecture Audit & Oracle Cloud Deployment Guide

> **Target Environment:** Oracle Cloud Infrastructure (OCI) Compute (Ubuntu 22.04 / 24.04 or Oracle Linux 8/9)  
> **Audited By:** Senior Systems Architect & DevSecOps Lead  
> **Status:** Critical Remediation & Production Ready  

---

## 📌 Executive Summary

Velora CRM is an enterprise-grade multi-service monorepo CRM solution featuring an API Gateway, 12 microservices, a React Vite frontend, and shared packages for centralized database and utility handling. 

While the functional architecture is extensive, an in-depth audit revealed several **critical security vulnerabilities**, **architectural anti-patterns**, and **AI-generated development artifacts** (fake delays, monkey-patched database layers, hardcoded developer accounts) that would cause data loss, privilege escalation, or outages in a live production environment.

This document outlines the findings, the code-level remediations applied, and the step-by-step production deployment blueprint for Oracle Cloud Infrastructure (OCI).

---

## 🔍 Critical Vulnerabilities & Code Issues Identified

### 1. 🚨 Critical Security Vulnerabilities

| # | Vulnerability | Location | Severity | Risk & Impact |
|---|---|---|---|---|
| **S1** | **Unsigned JWT Token Forgery Fallback** | `packages/utils/authMiddleware.js` | **CRITICAL** | If `jwt.verify` threw an error, the code ran `jwt.decode(token)` and accepted any decoded token! An attacker could forge an unverified token with `role: 'Admin'` and gain complete administrative access. |
| **S2** | **Client Header Role Spoofing (`x-active-role`)** | `packages/utils/authMiddleware.js`, `apps/gateway/server.js`, `apps/client/src/main.jsx` | **CRITICAL** | Any client could pass HTTP header `x-active-role: Admin`, causing the gateway and downstream services to grant full Admin privileges without password or session validation. |
| **S3** | **Gateway Bypass for Opportunity Service** | `apps/client/Dockerfile` | **HIGH** | Nginx config inside the client container routed `/api/opportunities` directly to `http://opportunity-service:5003`, completely skipping authentication, rate limiting, and RBAC checks. |
| **S4** | **Arbitrary File Path Traversal** | `apps/document-service/controllers/documentController.js` | **HIGH** | `getFile` served files using unsanitized `req.params.filename`. An attacker requesting `/api/documents/../../.env` could read production environment secrets. |
| **S5** | **Hardcoded Personal Backdoor & Test Passwords** | `apps/auth-service/controllers/authController.js` | **HIGH** | Hardcoded emails (`yukeshyukesh785@gmail.com`) with automatic Admin role elevation and offline test credentials (`admin123`, `Admin@123456`, `employee123`). |
| **S6** | **Credential & OTP Exposure in Logs** | `apps/auth-service/controllers/authController.js` | **MEDIUM** | Password reset OTPs were printed directly to stdout (`console.log("DEBUG OTP:", otp)`). |
| **S7** | **Stack Trace Leaks to HTTP Clients** | `apps/auth-service/controllers/authController.js` | **LOW** | Internal error stack traces returned in JSON responses (`stack: error.stack`). |

---

### 2. ⚠️ Architectural Anti-Patterns & AI Hallmarks

| # | Issue | Location | Problem |
|---|---|---|---|
| **A1** | **350-line Mongoose Monkey-Patch ("Offline DB Emulator")** | `packages/database/index.js` | In-memory proxy mocking `Query.prototype.exec`, `save()`, `create()`, etc. In production, if MongoDB drops connection, queries silently mutate in-memory arrays and drop data upon restart. |
| **A2** | **Destructive GET Request Side-Effects** | `apps/product-service/controllers/productController.js` | `getProducts` executed `Product.deleteMany()` and reset stock to 99 on **every single GET request**, corrupting inventory. Also exposed unauthenticated `?reseed=true` database wipe. |
| **A3** | **Synchronous N+1 Cross-Service HTTP Polling** | `apps/contact-service/controllers/contactController.js` | `getContacts` fetched every user from `auth-service` over HTTP on every request, creating extreme latency under dashboard traffic. |
| **A4** | **Hardcoded Localhost in Search Service** | `apps/search-service/controllers/searchController.js` | Search service hardcoded `http://localhost:5002` instead of Docker service names (`CONTACT_SERVICE_URL`), breaking search completely inside containers. |
| **A5** | **Ephemeral Uploads (Missing Docker Volume)** | `docker-compose.yml`, `apps/document-service` | Uploaded attachments were saved to local container filesystem without a persistent volume; container restart destroyed all uploads. |
| **A6** | **Admin Password Overwrite on Boot** | `apps/auth-service/server.js` | On every server startup, if an admin existed, the script re-hashed and overwrote their password with `.env` default, erasing user password updates. |
| **A7** | **Artificial UI Delay Spinners (`setTimeout 700ms`)** | `apps/client/src/context/AuthContext.jsx` | Artificial 700ms delay timers artificially injected to simulate loading times. |
| **A8** | **Cramped Memory Limit (`--max-old-space-size=48`)** | `start-production.js` | 48MB limit meant for 512MB free tiers caused frequent V8 GC pauses and crash risks on standard cloud VMs. |

---

## 🛠️ Action Plan & Code Changes

```
1. packages/utils/authMiddleware.js
   ├── Remove jwt.decode fallback (strictly require jwt.verify)
   ├── Remove x-active-role header spoofing
   └── Sanitize and enforce required JWT_SECRET

2. apps/gateway/server.js
   ├── Strip incoming identity headers (x-user-id, x-user-role, x-active-role) from untrusted external requests
   ├── Set downstream headers strictly from verified JWT payload
   └── Implement production-grade logging and CORS

3. apps/client/Dockerfile
   ├── Remove direct opportunity-service proxy
   └── Route all /api requests strictly through API Gateway (gateway:5000)

4. apps/auth-service
   ├── Remove hardcoded emails & offline backdoor credentials
   ├── Stop overwriting Admin password on restart if admin already exists
   ├── Remove OTP stdout logging and stack trace leakage
   └── Sanitize input & enforce secure defaults

5. apps/product-service/controllers/productController.js
   ├── Remove deleteMany and stock override from getProducts
   └── Secure seed endpoint with Admin authentication

6. apps/contact-service/controllers/contactController.js
   └── Remove synchronous HTTP polling from getContacts (rely on RabbitMQ/EDA)

7. apps/document-service/controllers/documentController.js
   └── Add path traversal prevention using path.basename and absolute resolution check

8. apps/search-service/controllers/searchController.js
   └── Use process.env.*_SERVICE_URL with Docker service name fallbacks

9. packages/database/index.js
   └── Clean production Mongoose connector with connection pooling, retry logic, and zero monkey patching

10. docker-compose.yml
   ├── Add persistent volume for document uploads
   ├── Add environment variables to search-service
   ├── Add container healthchecks
   └── Include optional Redis & RabbitMQ services for 100% self-hosted deployment

11. Oracle Cloud Provisioning Script (scripts/setup-oracle-cloud.sh)
   ├── Support both Ubuntu and Oracle Linux (UEK)
   ├── Open OCI OS-level iptables / firewalld for ports 80, 443, 3000, 5000
   ├── Install Docker Engine & Docker Compose V2
   └── Configure 4GB Swap and optimal kernel limits
```

---

## ☁️ Oracle Cloud Infrastructure (OCI) Deployment Architecture

```
                    Internet
                       │
                       ▼
       ┌───────────────────────────────┐
       │   OCI VCN Ingress Rules       │
       │   Ports: 80, 443, 22          │
       └───────────────┬───────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │   Host Firewall (iptables)    │
       │   ACCEPT tcp 80, 443          │
       └───────────────┬───────────────┘
                       │
                       ▼
       ┌───────────────────────────────┐
       │ Nginx / Caddy (Reverse Proxy) │
       │ Let's Encrypt SSL (HTTPS)     │
       └───────┬───────────────┬───────┘
               │               │
      / (Frontend)      /api (Gateway)
               │               │
               ▼               ▼
        ┌────────────┐  ┌─────────────┐
        │   Client   │  │ API Gateway │ (Port 5000)
        │ (Port 3000)│  └──────┬──────┘
        └────────────┘         │
           ────────────────────┼──────────────────────
           │                   │                     │
           ▼                   ▼                     ▼
     Auth Service       Contact Service       Opportunity Svc
      (Port 5001)         (Port 5002)           (Port 5003)
           │                   │                     │
     Task Service       Notification Svc      Analytics Svc
      (Port 5004)         (Port 5005)           (Port 5006)
           │                   │                     │
     Document Svc       Product Service       Invoice Service
      (Port 5007)         (Port 5008)           (Port 5009)
           │                   │                     │
     Ticket Service     Search Service          HR Service
      (Port 5010)         (Port 5011)           (Port 5012)
           ───────────────────────────────────────────
                               │
               ┌───────────────┴───────────────┐
               │    Shared Data & Event Bus    │
               │  - MongoDB (Atlas or Local)   │
               │  - Redis (Cache & Limiter)    │
               │  - RabbitMQ (Message Queue)   │
               └───────────────────────────────┘
```

---

## 🚀 Step-by-Step OCI Deployment Instructions

### Step 1: Create Compute Instance in OCI
1. Log in to Oracle Cloud Console.
2. Go to **Compute** > **Instances** > **Create Instance**.
3. Choose Image: **Ubuntu 22.04 / 24.04 Minimal** or **Oracle Linux 9**.
4. Choose Shape:
   - *Free Tier Eligible:* **VM.Standard.A1.Flex** (4 OCPUs, 24GB RAM) or **VM.Standard.E2.1.Micro** (1GB RAM with 4GB Swap).
5. Add your SSH Public Key and click **Create**.

### Step 2: Open Ingress Ports in OCI Security List
1. In OCI Console, navigate to **Networking** > **Virtual Cloud Networks**.
2. Select your VCN > Click **Default Security List for `<vcn>`**.
3. Under **Ingress Rules**, click **Add Ingress Rules**:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port Range: `80, 443, 3000, 5000`
   - Description: `HTTP, HTTPS, Frontend, Gateway`
4. Click **Add Ingress Rules**.

### Step 3: Run Setup Script on the Instance
Connect via SSH:
```bash
ssh -i /path/to/private_key ubuntu@<YOUR_OCI_PUBLIC_IP>
```
Clone the repository and run the provisioning script:
```bash
git clone <YOUR_REPO_URL> company-crm
cd company-crm
chmod +x scripts/setup-oracle-cloud.sh
sudo ./scripts/setup-oracle-cloud.sh
```

### Step 4: Configure Production Environment (`.env`)
```bash
cp .env.example .env
nano .env
```
Ensure you set:
- `MONGO_URI`: Your production MongoDB Atlas connection string.
- `JWT_SECRET`: A strong 64-character random string (`openssl rand -hex 32`).
- `DEFAULT_ADMIN_EMAIL`: Your company admin email.
- `DEFAULT_ADMIN_PASSWORD`: A strong initial password.
- `VITE_API_URL`: `http://<YOUR_OCI_PUBLIC_IP>:5000` (or `https://yourdomain.com` if using domain/SSL).

### Step 5: Start the Cluster
```bash
docker-compose up -d --build
```
Verify all containers:
```bash
docker-compose ps
```

---
*Report generated and approved for production deployment.*
