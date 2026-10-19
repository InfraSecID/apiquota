# 🛡️ APIQuota — Secure Multi-Provider API Quota Monitor & Alert SaaS
<img width="1907" height="827" alt="Screenshot from 2026-10-19 22-19-18" src="https://github.com/user-attachments/assets/f1934a5e-4b74-46ed-82e4-5a8d9cd42249" />

**APIQuota** is a SaaS platform for monitoring API quotas, credit usage, and remaining limits across various *AI Providers* (such as **OpenAI**, **Google Gemini**, and **Anthropic**) automatically and in *real-time*. It comes equipped with a multi-channel automatic alert system (**Telegram Bot** via `callmebot-notifier` & **WhatsApp Webhook**), session management based on **JWT with httpOnly cookies**, role-based access control (**Role-Based Access Control / RBAC: ADMIN & VIEWER**), as well as a high-grade encryption vault using **AES-256-GCM** designed with the *Security-First (Defense in Depth)* principle.

---

## ✨ Key Features

- **JWT Authentication & Secure Sessions**:
  - Registration endpoint (`POST /api/auth/register`) and login (`POST /api/auth/login`) with password hashing using **bcrypt** (salt rounds = 10).
  - The `authenticate` middleware verifies the JSON Web Token (JWT) from the `Authorization: Bearer <token>` header as well as from the *httpOnly cookie*.
  - Token storage on the client side uses an **httpOnly cookie** (not `localStorage`) to prevent token theft attacks through *Cross-Site Scripting (XSS)*.
  - The frontend component `ProtectedRoute` automatically redirects users who are not logged in to the login page.
- **Role-Based Access Control (RBAC)**:
  - User roles are divided into **ADMIN** and **VIEWER**.
  - Provider rights are strictly limited: only accounts with the **ADMIN** role have permission to create (`POST /api/providers`) and delete (`DELETE /api/providers/:id`) provider data.
- **Automatic Synchronization Cron Job**:
  - Background scheduling using **node-cron** (`services/scheduler.ts`) that runs every 15 minutes (`*/15 * * * *`).
  - The `startScheduler()` function is automatically activated when the backend server starts.
  - Comprehensive logging on every execution cycle with error handling (*error isolation*) so that the server remains stable and does not *crash*.
- **Telegram Notifications via callmebot-notifier**:
  - Integration of the `callmebot-notifier` library in `services/notifications.ts` for sending instant messages to Telegram.
  - Triggered automatically when the remaining API quota of a provider drops below the threshold value (*alert threshold*, default 20%).
  - Retrieves the `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` configuration from environment variables (`.env`) or runtime preferences.
- **Real-Time Quota Monitoring & Usage History**:
  - Accurate quota telemetry and remaining cost/credit estimation for the OpenAI, Google Gemini, Anthropic providers, as well as custom endpoints.
- **AES-256-GCM Credential Encryption**:
  - All API keys are encrypted *at rest* with a 32-byte master key (256 bits), a random Initialization Vector (IV) per payload, and a 128-bit Authentication Tag to prevent modification or tampering.
- **Credential Masking**:
  - The secret API key is **never** returned in plaintext in the API response; only the obfuscated form (*masked key*, for example `sk-proj-••••••••••••8a9F`) is exposed to the client.
- **Modern Dashboard & Dark Mode Redesign**:
  - A new user interface with a minimalist and futuristic dark theme inspired by the modern portfolio visual style (such as masdika.id).
  - A deep black background (`#0a0a0a`), bright color accents (neon emerald `#00ff88` / `#10b981`), modern sans-serif typography, a running marquee text (*"MONITORING • QUOTA • ALERTS • SECURITY"*), large statistic cards, interactive dark-themed Recharts graphs, and a history log of alerts with status `SENT`/`FAILED`.

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+) & TypeScript
- **Framework**: Express.js (v4.21+)
- **Database & ORM**: SQLite (development default) / PostgreSQL (fully supported) via **Prisma ORM** (v5.22+)
- **Security & Encryption**: Node.js Native `crypto` (AES-256-GCM), Helmet.js, Express Rate Limit, bcryptjs, jsonwebtoken, cookie-parser
- **Scheduler & Notifications**: `node-cron`, `callmebot-notifier`, `axios`
- **Schema Validation**: Zod

### Frontend
- **Framework & Bundler**: React (v18+), TypeScript, Vite (v5.4+)
- **Styling**: Tailwind CSS (v3.4+), PostCSS, Autoprefixer
- **Chart Visualization**: Recharts (v2.13+)
- **Icons**: Lucide React

---

## 📋 System Prerequisites

Before starting, make sure your device has the following installed:
- **Node.js**: Version `>= 18.18.0` (LTS v20 or v22 recommended)
- **npm**: Version `>= 9.0.0`
- **Git**

---

## 🚀 Step-by-Step Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/username/apiquota.git
cd apiquota
```

### 2. Configure Environment Variables
Copy the `.env.example` configuration template to a `.env` file in the `backend` folder:
```bash
cp .env.example backend/.env
```
Open the `backend/.env` file and adjust the values. Example configuration:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
ENCRYPTION_KEY=3388b9ed773d4d66c637bd00bc54ffb2ef50e6787ee2ef9a0278dfafaec06392
JWT_SECRET=supersecret_jwt_vault_key_2026_apiquota
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

> [!TIP]
> To generate a new random 64-character hexadecimal `ENCRYPTION_KEY`:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Install Backend & Frontend Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### 4. Database Schema Synchronization & Seeding

Run the following commands inside the `backend` directory:
```bash
cd backend

# Synchronize the Prisma schema to the database
npx prisma db push

# Generate Prisma Client TypeScript types
npm run prisma:generate

# Fill the database with sample users (ADMIN & VIEWER), sample providers, and history
npm run prisma:seed

cd ..
```

---

## 🏃 How to Run the Application

Run the backend and frontend in two separate terminal windows:

### Terminal 1: Backend Server (Port 5000)
```bash
cd backend
npm run dev
```
The backend will run at `http://localhost:5000`. On first startup, the scheduler is automatically scheduled every 15 minutes.

### Terminal 2: Frontend Client (Port 5173)
```bash
cd frontend
npm run dev
```
The Vite frontend will run at `http://localhost:5173`. Open that address in your browser.

> **Default Account Credentials (Seeding Result):**
> - **ADMIN Account**: `admin@apiquota.dev` | Password: `Password123!` *(Full Access: Create, Edit, Delete, Sync Provider)*
> - **VIEWER Account**: `viewer@apiquota.dev` | Password: `Password123!` *(Read-Only Access & Telemetry)*

---

## 🔐 Environment Variables Table

| Variable | Data Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | Yes | Database connection string for SQLite (`file:./dev.db`) or PostgreSQL (`postgresql://...`). |
| `ENCRYPTION_KEY` | Hex String | Yes | 32-byte master key (64 hex characters) for encrypting & decrypting credentials with AES-256-GCM. |
| `PORT` | Number | No | Network port for the Express backend (default: `5000`). |
| `JWT_SECRET` | String | Yes | Secret key for signing and validating JSON Web Tokens. |
| `TELEGRAM_BOT_TOKEN` | String | Optional | Telegram Bot token from BotFather for `callmebot-notifier` notifications. |
| `TELEGRAM_CHAT_ID` | String | Optional | Target Telegram Chat/Group ID that receives critical quota notifications. |

---

## 📡 Main API Endpoint List

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new account (`email`, `password`, optional `role: ADMIN/VIEWER`). The token is stored in an httpOnly cookie. |
| `POST` | `/api/auth/login` | Public | Validates user credentials, issues a JWT, and sets the httpOnly cookie. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves the profile and role data of the currently logged-in user. |
| `POST` | `/api/auth/logout` | Authenticated | Deletes the session httpOnly cookie and logs out. |

### 2. Provider Management (`/api/providers`)
*All `/api/providers` endpoints are protected by the `authenticate` middleware.*
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/providers` | Authenticated | Retrieves the list of all monitored providers (with masked API key). |
| `GET` | `/api/providers/:id` | Authenticated | Retrieves the details of a single provider by ID. |
| `POST` | `/api/providers` | **ADMIN Only** | Registers a new API key. The plaintext is immediately encrypted with AES-256-GCM before being stored. |
| `PUT` | `/api/providers/:id` | Authenticated | Updates the provider's name, quota budget, or threshold value. |
| `DELETE`| `/api/providers/:id` | **ADMIN Only** | Deletes provider data along with the related usage history and logs. |
| `POST` | `/api/providers/:id/sync` | Authenticated | Forces an immediate (*on-demand*) quota synchronization with the provider server. |

### 3. Telemetry Dashboard (`/api/dashboard`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Public / Auth | Retrieves aggregate quota metrics, time-series data for Recharts graphs, and the latest alert history. |

### 4. Alert Settings (`/api/alerts`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alerts/config` | Authenticated | Retrieves notification preferences (Telegram, Webhook, toggle status). |
| `PUT` | `/api/alerts/config` | Authenticated | Updates the Telegram bot token, chat ID, or webhook URL. |
| `POST` | `/api/alerts/test` | Authenticated | Sends a test message (*test alert*) directly to Telegram or the WhatsApp Webhook. |
| `GET` | `/api/alerts/logs` | Authenticated | Retrieves the audit trail list of notification delivery logs. |

---

## 🔒 Security Notes (Security Deep Dive)

1. **Authentic Credential Encryption (AES-256-GCM)**:
   - Uses *Galois/Counter Mode* (GCM), which provides *confidentiality* as well as data authentication *integrity*.
   - Every time data is encrypted, a unique random 16-byte IV is generated.
   - Storage format: `<IV_HEX>:<AUTH_TAG_HEX>:<CIPHERTEXT_HEX>`. Modifying a single bit in the ciphertext or IV will immediately cause decryption to fail.
2. **Credential Masking**:
   - The plaintext API key is strictly decrypted temporarily in processor memory only when performing HTTP polling to the upstream AI Provider.
   - The REST API response always obfuscates the key (for example: `sk-proj-••••••••••••8a9F`), so sensitive data never leaks into the browser inspector.
3. **JWT Authentication & httpOnly Cookie**:
   - Uses digitally signed JWT tokens with the HMAC-SHA256 algorithm.
   - Stored in the browser through a cookie marked `httpOnly: true`, `SameSite: 'lax'`, and `secure: true` (in production mode), so that third-party JavaScript or malicious XSS scripts cannot read the token.
4. **Role-Based Access Control (RBAC)**:
   - Strict validation is applied at the Express middleware level (`requireAdmin`).
   - Any attempt to write or delete a provider by a `VIEWER`-level user will be immediately rejected with the HTTP status code `403 Forbidden`.
5. **Denial of Service (DoS) & Injection Mitigation**:
   - The body parser is limited to a maximum of 16 KB.
   - Tiered rate limiting protects sensitive routes from *brute force* attacks.
   - Prisma ORM uses *parameterized queries* that eliminate the SQL Injection vulnerability.

---

## 🧪 How to Test the System

This project comes with an automated testing suite to verify cryptographic security and end-to-end API behavior:

### 1. AES-256-GCM Cryptographic Testing
Verifies the functionality of encryption, decryption, semantic IV randomness, and authentication tampering detection:
```bash
cd backend
npm run test:crypto
```

### 2. End-to-End API, JWT & RBAC Testing
Verifies the Helmet security headers, protected routes returning 401 unauthenticated, JWT registration/login, 403 rejection for the VIEWER role, as well as full operations for the ADMIN role:
```bash
cd backend
npx tsx tests/api.test.ts
```

---

## 📂 Project Directory Structure

```
apiquota/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Prisma Schema (User, ApiProvider, UsageHistory, NotificationConfig, AlertLog)
│   │   └── seed.ts              # Script for seeding initial user and provider data
│   ├── src/
│   │   ├── config/              # Zod environment variable validation (env.ts)
│   │   ├── controllers/         # Business logic controllers (auth, provider, dashboard, alert)
│   │   ├── middleware/          # Security (auth, rateLimiter, security, validate, error)
│   │   ├── routes/              # Express routes (auth, provider, dashboard, alert)
│   │   ├── services/            # Crypto, poller, scheduler (node-cron), notifications (callmebot) services
│   │   ├── utils/               # Logger, masking utilities
│   │   ├── app.ts               # Express initialization & middleware pipeline
│   │   └── index.ts             # Server entrypoint & cron scheduler initialization
│   ├── tests/
│   │   ├── api.test.ts          # E2E Backend, JWT, RBAC & API security test
│   │   └── crypto.test.ts       # AES-256-GCM algorithm validation
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, StatCard, ProviderCard, UsageChart, Modals, LoginPage, ProtectedRoute
│   │   ├── services/            # HTTP client api.ts with fetch and httpOnly credentials
│   │   ├── types/               # TypeScript definitions (User, ApiProvider, DashboardSummary, etc.)
│   │   ├── App.tsx              # Main masdika.id dark mode Dashboard view
│   │   ├── index.css            # Custom Tailwind styling & infinite marquee keyframes
│   │   └── main.tsx             # React entrypoint
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── .env.example                 # Root environment variable template
├── LICENSE                      # Official MIT License (Copyright (c) 2026 Hidayat)
└── README.md                    # Complete project documentation
```

---

## ❓ Troubleshooting

The following table summarizes common problems that are frequently encountered, their technical causes, and their solutions:

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **Port 5000 is already in use (`EADDRINUSE`)** | Another backend process or a local service (such as AirPlay / a server daemon) is occupying port 5000. | Kill the process using that port with the command `lsof -i :5000` then `kill -9 <PID>`, or change the `PORT=5001` configuration in the `backend/.env` file. |
| **Prisma Migrate / Push Fails** | The SQLite database file `dev.db` is locked by another process, or the Prisma schema has experienced *drift*. | Stop the running server, make sure the directory permissions are writable (`chmod 755 prisma`), then re-run `npx prisma db push` inside the `backend` folder. |
| **CORS Error in the Browser** | The `CORS_ORIGIN` value in `backend/.env` does not match the host address or port of the Vite frontend. | Make sure `CORS_ORIGIN=http://localhost:5173` has been set in `backend/.env` and make sure the browser is accessing from the same origin. |
| **JWT Expired / Session Ended** | The JWT authentication token has passed its expiration time limit (24 hours). | Log in again through the login page interface to get a fresh new JWT token in the cookie. |
| **Telegram does not send alert messages** | The `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` value is wrong, the bot has not been started via `/start` by the user on Telegram, or the provider quota has not yet passed the threshold. | Open your bot on Telegram and send the `/start` message. Verify the bot token via BotFather, check the chat ID through the get-id bot, then try the **Test Send** button in the *Alert Settings* modal. |
| **Role Forbidden (403 when Creating/Deleting a Provider)** | The user who is currently logged in is an account with the `VIEWER` role. | Log in using an account with `ADMIN` status (for example `admin@apiquota.dev` / `Password123!`), because the rights to add and delete provider keys are granted only to ADMIN. |
