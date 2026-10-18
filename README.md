# 🛡️ APIQuota — Secure Multi-Provider API Quota Monitor & Alert SaaS

**APIQuota** is a SaaS *dashboard* platform for monitoring quota, credit usage, and remaining API limits from various *AI Providers* (such as **OpenAI** and **Google Gemini**) automatically and in *real-time*. It is equipped with an automatic alert system (**Telegram Bot** & **WhatsApp Webhook**) when the remaining quota falls below **20%**.

APIQuota's architecture is designed with a **Security-First (Defense in Depth)** principle to protect sensitive user data and prevent major security vulnerabilities in the OWASP standard.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Core Security Pillars (Security-First)](#-core-security-pillars-security-first)
  - [1. SQL Injection Prevention](#1-sql-injection-prevention)
  - [2. Cross-Site Scripting (XSS) & CSP Prevention](#2-cross-site-scripting-xss--csp-prevention)
  - [3. Security Misconfiguration Prevention](#3-security-misconfiguration-prevention)
  - [4. Sensitive Credential Encryption (AES-256-GCM)](#4-sensitive-credential-encryption-aes-256-gcm)
- [Directory Structure](#-directory-structure)
- [System Prerequisites](#-system-prerequisites)
- [Environment Setup & .env Variables Guide](#-environment-setup--env-variables-guide)
- [Database Migration & Seeding](#-database-migration--seeding)
- [How to Run the Application](#-how-to-run-the-application)
- [Security Tests Verification](#-security-tests-verification)
- [API Endpoints Documentation](#-api-endpoints-documentation)

---

## 🏗️ System Architecture

APIQuota uses a *Decoupled Client-Server* architecture with an *asynchronous background worker*:

```
+-------------------------------------------------------------------------+
|                           REACT DASHBOARD                               |
|        (Vite + Tailwind CSS + Recharts + Strict CSP + HTML Escaping)     |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTPS / Strict CORS / Rate Limited
                                     v
+-------------------------------------------------------------------------+
|                           EXPRESS BACKEND                               |
|   +-----------------------------------------------------------------+   |
|   | Security Layer: Helmet.js, HSTS, Rate Limiters, Zod Validation  |   |
|   +-----------------------------------------------------------------+   |
|   | Crypto Service: AES-256-GCM (Auth Tag, IV per payload, 32B Key) |   |
|   +-----------------------------------------------------------------+   |
|   | Poller Worker: node-cron scheduler & live API sync (OpenAI/Gemini|   |
|   +-----------------------------------------------------------------+   |
|   | Alert Service: Telegram Bot API + WhatsApp Webhook Dispatcher   |   |
|   +-----------------------------------------------------------------+   |
|   | ORM Layer: Prisma ORM (Prepared Statements & Parameterized SQL) |   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                           DATABASE STORAGE                              |
|           SQLite (Default Dev) / PostgreSQL (Docker/Production)         |
|   - ApiProvider (Encrypted Keys, Key Masks, Quotas, Thresholds)         |
|   - UsageHistory (Time-series quota telemetry)                          |
|   - NotificationConfig (Telegram/WhatsApp channels)                     |
|   - AlertLog (Audit trail of dispatched warnings)                       |
+-------------------------------------------------------------------------+
```

---

## 🔒 Core Security Pillars (Security-First)

This application's security explicitly implements 4 security protections:

### 1. SQL Injection Prevention
- **Prisma ORM Prepared Statements**: All *database* interactions (read, create, update, and delete) use the *Prisma Query Engine*, which by default executes *Parameterized Queries / Prepared Statements*.
- **No String Concatenation**: The backend code **never** concatenates user input *strings* into database queries (`$queryRawUnsafe` is forbidden).
- **Zod Schema Validation**: All parameters (`id`, `totalQuota`, `alertThreshold`) are validated for type and format (UUID, positive integer) before the query is processed.

### 2. Cross-Site Scripting (XSS) & CSP Prevention
- **Strict Content Security Policy (CSP)**: Implemented at the HTTP Header level via Helmet.js on the backend and `<meta http-equiv="Content-Security-Policy">` on the frontend.
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:5000; object-src 'none'; base-uri 'self';
  ```
- **Automatic Output Escaping**: React JSX automatically sanitizes and *HTML-escapes* all strings rendered to the DOM. There is no usage of `dangerouslySetInnerHTML`.
- **Payload Truncation**: The body parser is limited to a size of 16 KB to prevent *buffer poisoning* and *denial of service*.

### 3. Security Misconfiguration Prevention
- **Helmet.js Hardening**:
  - `Strict-Transport-Security` (HSTS): `max-age=31536000; includeSubDomains; preload`
  - `X-Frame-Options: DENY` (Prevents Clickjacking)
  - `X-Content-Type-Options: nosniff` (Prevents MIME-sniffing)
  - `X-XSS-Protection: 1; mode=block`
  - Removes the `X-Powered-By` header so the server technology is not exposed to the public.
- **Strict CORS**: CORS only allows *origins* explicitly registered in the `CORS_ORIGIN` variable (for example `http://localhost:5173`).
- **Tiered Rate Limiting**:
  - *General Limiter*: Maximum 120 *requests* per 15 minutes per IP for public endpoints.
  - *Sensitive Write Limiter*: Maximum 10 *requests* per minute per IP for adding/changing API keys (`/api/providers`) and *test alert*.
  - *Sync Limiter*: Maximum 15 *requests* per 5 minutes per IP for manual synchronization to the provider.
- **Stack Trace Concealment**: In the *production* environment (`NODE_ENV=production`), internal error messages and *database stack traces* are hidden and replaced with generic messages.

### 4. Sensitive Credential Encryption (AES-256-GCM)
- **AES-256-GCM Algorithm (Authenticated Encryption)**:
  - Uses a 256-bit (32 byte) master key.
  - Every encryption produces a random 16-byte **Initialization Vector (IV)** via `crypto.randomBytes(16)`.
  - Produces a 16-byte **Authentication Tag (Auth Tag)** to guarantee integrity. If the ciphertext is manipulated by even 1 bit, decryption will fail (`decipher.setAuthTag(authTag)`).
  - Storage format in the DB: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
- **Zero-Knowledge Plaintext Return**:
  - The API Key is **NEVER** returned in *plaintext* or *ciphertext* form to the frontend.
  - The backend creates a safe *mask* upon creation (example: `sk-proj-••••••••••••••••8a9F`) and only returns the `keyMask` column.
  - Decryption is only performed instantly in server memory by the *background poller* when making API calls to OpenAI/Gemini.

---

## 📁 Directory Structure

```
apiquota/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma ORM Schema (ApiProvider, UsageHistory, NotificationConfig)
│   │   └── seed.ts                 # Initial data seeding with AES-256-GCM encrypted keys
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts              # Environment variable validation with Zod
│   │   ├── controllers/
│   │   │   ├── alert.controller.ts # Telegram & WhatsApp Webhook settings
│   │   │   ├── dashboard.controller.ts # Metric aggregation and Recharts feed
│   │   │   └── provider.controller.ts  # Provider CRUD and API key handling
│   │   ├── middleware/
│   │   │   ├── error.middleware.ts     # Production error masking
│   │   │   ├── rateLimiter.middleware.ts # Tiered rate limiting
│   │   │   ├── security.middleware.ts  # Helmet, CSP, and CORS configuration
│   │   │   └── validate.middleware.ts  # Zod request payload validation
│   │   ├── routes/
│   │   │   ├── alert.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── index.ts
│   │   │   └── provider.routes.ts
│   │   ├── services/
│   │   │   ├── alert.service.ts        # Telegram Bot & WA Webhook Dispatcher
│   │   │   ├── crypto.service.ts       # AES-256-GCM Encryption & Decryption
│   │   │   ├── poller.service.ts       # Automatic cron poller & remaining quota check
│   │   │   └── providerClient.service.ts # OpenAI & Gemini API Client
│   │   ├── utils/
│   │   │   ├── logger.ts               # Logger with automatic token redaction
│   │   │   └── mask.ts                 # API Key masking utility
│   │   ├── app.ts                  # Express application setup & security middleware
│   │   └── index.ts                # Server entrypoint & cron initialization
│   ├── tests/
│   │   └── crypto.test.ts          # AES-256-GCM encryption integrity testing
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddProviderModal.tsx    # Add/edit provider modal
│   │   │   ├── AlertSettingsModal.tsx  # Configuration & live Telegram/WA test modal
│   │   │   ├── Navbar.tsx              # Navigation & security status indicator
│   │   │   ├── ProviderCard.tsx        # Provider card & remaining quota gauge
│   │   │   ├── StatCard.tsx            # Quota statistics summary
│   │   │   └── UsageChart.tsx          # Interactive Recharts chart
│   │   ├── services/
│   │   │   └── api.ts                  # Frontend HTTP client
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript definitions
│   │   ├── App.tsx                     # Main Dashboard component
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html                      # HTML with Strict CSP Meta Header
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docker-compose.yml              # Optional PostgreSQL setup
└── README.md                       # Complete project documentation
```

---

## 💻 System Prerequisites

Before you begin, make sure your machine has the following installed:
- **Node.js**: Version `>= 18.0.0` (v20 LTS or v22+ recommended)
- **npm**: Version `>= 9.0.0`
- *(Optional)* **Docker & Docker Compose**: If you want to use a PostgreSQL container database.

---

## ⚙️ Environment Setup & .env Variables Guide

### 1. Enter the backend directory
```bash
cd backend
```

### 2. Duplicate the `.env.example` template file to `.env`
```bash
cp .env.example .env
```

### 3. Full Explanation of `.env` Variables

| Variable | Required? | Default Value | Description & Security Guidance |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port where the Express backend API runs. |
| `NODE_ENV` | Yes | `development` | Application mode (`development`, `production`, or `test`). In `production` mode, stack traces are hidden. |
| `DATABASE_URL` | Yes | `"file:./dev.db"` | Prisma database connection URL. By default it uses local SQLite (`file:./dev.db`). If using PostgreSQL, the format is: `postgresql://user:pass@localhost:5432/apiquota?schema=public`. |
| `ENCRYPTION_MASTER_KEY` | **YES (CRUCIAL)** | *64-Character Hex Key* | The 32-byte (256-bit) symmetric key for **AES-256-GCM** encryption. This key **must** be kept confidential and must never be committed to Git! |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | The React frontend origin address allowed to access the backend API. |
| `POLL_CRON_SCHEDULE` | No | `"*/15 * * * *"` | Cron expression for automatic quota polling to the provider (default: every 15 minutes). |
| `DEFAULT_ALERT_THRESHOLD` | No | `20.0` | Default threshold (in percent %). An automatic warning will be sent if the remaining quota is `<=` this value. |
| `TELEGRAM_BOT_TOKEN` | No | *(Empty)* | Telegram bot token from `@BotFather` to send warning messages. It can also be set via the Dashboard UI. |
| `TELEGRAM_CHAT_ID` | No | *(Empty)* | Telegram chat ID of the notification recipient (user ID or group ID, e.g. `-100123456789`). |
| `WHATSAPP_WEBHOOK_URL`| No | *(Empty)* | WhatsApp gateway Webhook URL (such as Evolution API, Baileys, or Twilio) that receives the JSON warning payload. |

#### How to Generate a New `ENCRYPTION_MASTER_KEY`:
Run the following Node.js command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the 64-character hex output into the `ENCRYPTION_MASTER_KEY` variable in the `.env` file.

---

## 🗄️ Database Migration & Seeding

The application uses **Prisma ORM**. Follow these steps to initialize the database schema and initial data:

### 1. Initialize the Database Schema
```bash
cd backend

# Sync the Prisma schema with the local SQLite database
npx prisma db push

# Generate the Prisma TypeScript client
npx prisma generate
```

### 2. Run the Database Seeder
This command will create initial *mock* data covering 3 providers (OpenAI Production, Gemini Pro, and OpenAI Fine-Tuning Cluster with low quota &lt; 20%), usage history, and keys that have been legitimately encrypted with AES-256-GCM:
```bash
npm run prisma:seed
```

Expected output:
```
🌱 Seeding APIQuota database with initial sample providers...
✅ Database seeded successfully with 3 providers, history records, and alert log.
```

*(Optional: Using PostgreSQL)*
If you want to use PostgreSQL instead of SQLite:
1. Run `docker compose up -d` in the root directory.
2. Change `provider = "sqlite"` to `provider = "postgresql"` in the `backend/prisma/schema.prisma` file.
3. Adjust `DATABASE_URL="postgresql://apiquota:apiquota_secret_password@localhost:5432/apiquota?schema=public"` in `.env`.
4. Run `npx prisma db push`.

---

## 🚀 How to Run the Application

The application consists of a Backend (Express) and a Frontend (React Vite).

### Running the Backend (Terminal 1)
```bash
cd backend
npm run dev
```
The backend server will run at: `http://localhost:5000`
- Health check: `http://localhost:5000/health`
- The automatic cron worker is active every 15 minutes.

### Running the Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
The React Dashboard will run at: `http://localhost:5173`

Open your browser and access `http://localhost:5173`. You will see:
- A summary of total quota, usage, and global remaining quota percentage.
- A red/yellow warning banner if any provider's quota is &lt; 20%.
- An interactive real-time usage trend chart using **Recharts**.
- A list of provider cards with a *gauge bar*, safely masked keys (`sk-proj-••••••••8a9F`), and an instant **Sync Now** button.
- An **Add Provider** modal to add a new OpenAI/Gemini API Key (automatically AES-256-GCM encrypted).
- An **Alert Settings** modal to configure the Telegram Bot Token, Chat ID, WhatsApp Webhook, and a direct **Test Telegram / WhatsApp** button.

---

## 🧪 Security Tests Verification

To verify that the credential encryption implementation meets military-grade AES-256-GCM and anti-tampering standards:

Run the cryptographic security tests:
```bash
cd backend
npm run test:crypto
```

This test automatically validates:
1. **Real Encryption/Decryption**: Plaintext is encrypted and decrypted perfectly.
2. **IV Randomness (Semantic Security)**: Encrypting two identical plaintexts produces completely different ciphertexts.
3. **Tampering Prevention (AEAD Integrity)**: If the ciphertext is changed by even 1 bit, the authentication tag refuses decryption and throws an `Authentication failed (tampered data)` error.

---

## 📡 API Endpoints Documentation

All endpoints are protected by rate-limiting and return a uniform JSON-formatted response:

```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": { ... }
}
```

### 1. Health Check
- **`GET /health`**
  - **Description**: Checks the health status of the backend server.
  - **Response**: `200 OK`
    ```json
    { "status": "ok", "timestamp": "2026-10-18T08:00:00.000Z" }
    ```

---

### 2. Dashboard Analytics
- **`GET /api/dashboard/summary`**
  - **Description**: Retrieves the global summary of SaaS quota metrics, time-series data for the Recharts chart, and the last 5 alert logs.
  - **Rate Limit**: General API Limiter (120 req / 15m)
  - **Example Response**:
    ```json
    {
      "success": true,
      "data": {
        "metrics": {
          "totalAllocatedQuota": 500.00,
          "totalUsedQuota": 329.10,
          "overallRemainingPercentage": 34.2,
          "activeProvidersCount": 3,
          "healthyCount": 1,
          "warningCount": 1,
          "criticalCount": 1
        },
        "chartData": [
          { "time": "12:00", "totalUsed": 150.00, "OpenAI Production": 120.00, "Gemini Pro": 30.00 }
        ],
        "recentAlerts": [ ... ]
      }
    }
    ```

---

### 3. API Providers Management
- **`GET /api/providers`**
  - **Description**: Retrieves the entire list of active providers. The API Key is always returned in the safe `keyMask` form.
  - **Example Response**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "c1f38d3e-9562-472e-bc8e-15d97e2832bc",
          "name": "OpenAI Production GPT-4o",
          "provider": "OPENAI",
          "keyMask": "sk-proj-••••••••••••••••efgg",
          "totalQuota": 250.00,
          "usedQuota": 198.50,
          "remainingPercentage": 20.6,
          "alertThreshold": 20.0,
          "status": "WARNING",
          "lastSyncedAt": "2026-10-18T08:05:00.000Z"
        }
      ]
    }
    ```

- **`POST /api/providers`**
  - **Description**: Registers a new provider. The API key is immediately encrypted using AES-256-GCM before being stored in the database.
  - **Rate Limit**: Sensitive Write Limiter (10 req / 1m)
  - **Request Body**:
    ```json
    {
      "name": "Google Gemini Workspace",
      "provider": "GEMINI",
      "apiKey": "AIzaSyD-YourRealOrDemoApiKeyHere9999",
      "totalQuota": 100.0,
      "alertThreshold": 20.0
    }
    ```
  - **Example Response**: `201 Created`
    ```json
    {
      "success": true,
      "message": "Provider registered and key securely encrypted.",
      "data": {
        "id": "e4a7a8d2-7489-498b-90f1-e1cbfa17b441",
        "name": "Google Gemini Workspace",
        "provider": "GEMINI",
        "keyMask": "AIzaSy••••••••••••••••9999",
        "totalQuota": 100.0,
        "remainingPercentage": 100.0,
        "status": "HEALTHY"
      }
    }
    ```

- **`PUT /api/providers/:id`**
  - **Description**: Updates the name, quota limit, alert threshold, or rotates the API key.
  - **Rate Limit**: Sensitive Write Limiter (10 req / 1m)
  - **Request Body**:
    ```json
    {
      "name": "OpenAI Main Cluster (Updated)",
      "totalQuota": 300.0,
      "alertThreshold": 15.0
    }
    ```

- **`DELETE /api/providers/:id`**
  - **Description**: Deletes a provider along with all its related usage history and alert logs in a cascading manner.

- **`POST /api/providers/:id/sync`**
  - **Description**: Triggers an instant manual quota synchronization for one specific provider.
  - **Rate Limit**: Sync Trigger Limiter (15 req / 5m)

---

### 4. Alerting & Notification Channels
- **`GET /api/alerts/config`**
  - **Description**: Retrieves the alert delivery configuration (the Telegram bot token is masked).

- **`PUT /api/alerts/config`**
  - **Description**: Updates the Telegram bot token, Chat ID, WhatsApp webhook URL, and the global alert threshold.
  - **Request Body**:
    ```json
    {
      "telegramBotToken": "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ",
      "telegramChatId": "-1001987654321",
      "whatsappWebhookUrl": "https://api.my-whatsapp-gateway.com/webhook",
      "defaultThreshold": 20.0,
      "isEnabled": true
    }
    ```

- **`POST /api/alerts/test`**
  - **Description**: Sends an instant test message to the Telegram or WhatsApp Webhook to verify the credentials.
  - **Request Body (Telegram)**:
    ```json
    {
      "channel": "TELEGRAM",
      "telegramBotToken": "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ",
      "telegramChatId": "-1001987654321"
    }
    ```
  - **Request Body (WhatsApp)**:
    ```json
    {
      "channel": "WHATSAPP",
      "whatsappWebhookUrl": "https://api.my-whatsapp-gateway.com/webhook"
    }
    ```

- **`GET /api/alerts/logs`**
  - **Description**: Retrieves the alert notification delivery history (status `SENT` or `FAILED`).

---

## 🛡️ OWASP API Security Compliance Standard Checklist

- [x] **Injection (API8:2023)**: Prevents SQLi via Prisma ORM Parameterized Statements & Zod Schema Validation.
- [x] **Broken Object Level Authorization / Sensitive Data Exposure**: Plaintext API Keys are never stored and never sent to the frontend. All credentials are AES-256-GCM encrypted.
- [x] **Security Misconfiguration (API7:2023)**: Uses Helmet.js with 1-year HSTS, X-Frame-Options DENY, server banner removal, and a strict Content-Security-Policy (CSP).
- [x] **Lack of Resources & Rate Limiting (API4:2023)**: Tiered Rate Limiting for general endpoints, sensitive key modifications, and manual synchronization.
- [x] **Cross-Site Scripting (XSS)**: Strict CSP policy + React automated context-aware output encoding.
