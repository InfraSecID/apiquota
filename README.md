# 🛡️ APIQuota — Secure Multi-Provider API Quota Monitor & Alert SaaS

**APIQuota** adalah platform SaaS pemantau kuota, penggunaan kredit, dan sisa limit API dari berbagai *AI Provider* (seperti **OpenAI**, **Google Gemini**, dan **Anthropic**) secara otomatis dan *real-time*. Dilengkapi dengan sistem peringatan otomatis multi-kanal (**Telegram Bot** melalui `callmebot-notifier` & **WhatsApp Webhook**), manajemen sesi berbasis **JWT dengan httpOnly cookie**, kontrol akses berbasis peran (**Role-Based Access Control / RBAC: ADMIN & VIEWER**), serta brankas enkripsi tingkat tinggi **AES-256-GCM** yang dirancang dengan prinsip *Security-First (Defense in Depth)*.

---

## ✨ Fitur Utama

- **Autentikasi JWT & Sesi Aman**:
  - Endpoint registrasi (`POST /api/auth/register`) dan login (`POST /api/auth/login`) dengan hashing password menggunakan **bcrypt** (salt rounds = 10).
  - Middleware `authenticate` yang memverifikasi JSON Web Token (JWT) dari header `Authorization: Bearer <token>` maupun dari *httpOnly cookie*.
  - Penyimpanan token di sisi klien menggunakan **httpOnly cookie** (bukan `localStorage`) untuk mencegah serangan pencurian token melalui *Cross-Site Scripting (XSS)*.
  - Komponen frontend `ProtectedRoute` yang secara otomatis mengalihkan pengguna yang belum login ke halaman login.
- **Role-Based Access Control (RBAC)**:
  - Pembagian peran pengguna menjadi **ADMIN** dan **VIEWER**.
  - Hak cipta provider dibatasi ketat: hanya akun dengan peran **ADMIN** yang memiliki izin untuk membuat (`POST /api/providers`) dan menghapus (`DELETE /api/providers/:id`) data provider.
- **Cron Job Sinkronisasi Otomatis**:
  - Penjadwalan latar belakang menggunakan **node-cron** (`services/scheduler.ts`) yang berjalan setiap 15 menit (`*/15 * * * *`).
  - Fungsi `startScheduler()` otomatis aktif saat backend server dinyalakan.
  - Logging komprehensif pada setiap siklus eksekusi dengan penanganan error (*error isolation*) agar server tetap stabil dan tidak *crash*.
- **Notifikasi Telegram via callmebot-notifier**:
  - Integrasi pustaka `callmebot-notifier` di `services/notifications.ts` untuk pengiriman pesan instan ke Telegram.
  - Dipicu secara otomatis ketika sisa kuota API provider turun di bawah nilai ambang batas (*alert threshold*, default 20%).
  - Mengambil konfigurasi `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` dari environment variables (`.env`) atau preferensi runtime.
- **Monitoring Kuota Real-Time & Riwayat Penggunaan**:
  - Telemetri kuota dan estimasi sisa biaya/kredit secara akurat untuk provider OpenAI, Google Gemini, Anthropic, maupun custom endpoint.
- **Enkripsi Kredensial AES-256-GCM**:
  - Semua API key dienkripsi saat istirahat (*at rest*) dengan kunci master 32-byte (256 bit), Initialization Vector (IV) acak per payload, dan Authentication Tag 128-bit untuk mencegah modifikasi atau tampering.
- **Masking Kredensial**:
  - Kunci rahasia API key **tidak pernah** dikembalikan dalam bentuk plaintext di respon API; hanya bentuk tersamar (*masked key*, misalnya `sk-proj-••••••••••••8a9F`) yang diekspos ke klien.
- **Dashboard Modern & Redesign Dark Mode**:
  - Antarmuka pengguna baru bertema gelap minimalis dan futuristik terinspirasi dari gaya visual portofolio modern (seperti masdika.id).
  - Background hitam pekat (`#0a0a0a`), aksen warna cerah (neon emerald `#00ff88` / `#10b981`), tipografi sans-serif modern, teks marquee berjalan (*"MONITORING • QUOTA • ALERTS • SECURITY"*), kartu statistik besar, grafik interaktif Recharts bertema gelap, dan log riwayat peringatan status `SENT`/`FAILED`.

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+) & TypeScript
- **Framework**: Express.js (v4.21+)
- **Database & ORM**: SQLite (bawaan pengembangan) / PostgreSQL (didukung penuh) melalui **Prisma ORM** (v5.22+)
- **Security & Enkripsi**: Node.js Native `crypto` (AES-256-GCM), Helmet.js, Express Rate Limit, bcryptjs, jsonwebtoken, cookie-parser
- **Penjadwal & Notifikasi**: `node-cron`, `callmebot-notifier`, `axios`
- **Validasi Skema**: Zod

### Frontend
- **Framework & Bundler**: React (v18+), TypeScript, Vite (v5.4+)
- **Styling**: Tailwind CSS (v3.4+), PostCSS, Autoprefixer
- **Visualisasi Grafik**: Recharts (v2.13+)
- **Ikon**: Lucide React

---

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah terpasang:
- **Node.js**: Versi `>= 18.18.0` (disarankan LTS v20 atau v22)
- **npm**: Versi `>= 9.0.0`
- **Git**

---

## 🚀 Panduan Instalasi Langkah Demi Langkah

### 1. Kloning Repositori
```bash
git clone https://github.com/username/apiquota.git
cd apiquota
```

### 2. Konfigurasi Environment Variable
Salin template konfigurasi `.env.example` ke file `.env` di folder `backend`:
```bash
cp .env.example backend/.env
```
Buka file `backend/.env` dan sesuaikan nilainya. Contoh konfigurasi:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
ENCRYPTION_KEY=3388b9ed773d4d66c637bd00bc54ffb2ef50e6787ee2ef9a0278dfafaec06392
JWT_SECRET=supersecret_jwt_vault_key_2026_apiquota
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

> [!TIP]
> Untuk menghasilkan `ENCRYPTION_KEY` 64-karakter heksadesimal baru secara acak:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Instal Dependensi Backend & Frontend

```bash
# Instal dependensi backend
cd backend
npm install

# Instal dependensi frontend
cd ../frontend
npm install
cd ..
```

### 4. Sinkronisasi Skema Database & Seeding

Jalankan perintah berikut di dalam direktori `backend`:
```bash
cd backend

# Sinkronkan skema Prisma ke database
npx prisma db push

# Generate Prisma Client TypeScript types
npm run prisma:generate

# Isi database dengan sample user (ADMIN & VIEWER), sample provider, dan riwayat
npm run prisma:seed

cd ..
```

---

## 🏃 Cara Menjalankan Aplikasi

Jalankan backend dan frontend di dua jendela terminal terpisah:

### Terminal 1: Backend Server (Port 5000)
```bash
cd backend
npm run dev
```
Backend akan berjalan di `http://localhost:5000`. Saat pertama kali aktif, scheduler otomatis dijadwalkan setiap 15 menit.

### Terminal 2: Frontend Client (Port 5173)
```bash
cd frontend
npm run dev
```
Frontend Vite akan berjalan di `http://localhost:5173`. Buka alamat tersebut di peramban Anda.

> **Kredensial Akun Default (Hasil Seeding):**
> - **Akun ADMIN**: `admin@apiquota.dev` | Password: `Password123!` *(Akses Penuh: Create, Edit, Delete, Sync Provider)*
> - **Akun VIEWER**: `viewer@apiquota.dev` | Password: `Password123!` *(Hanya Akses Baca & Telemetri)*

---

## 🔐 Tabel Environment Variables

| Variabel | Tipe Data | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | Ya | String koneksi database SQLite (`file:./dev.db`) atau PostgreSQL (`postgresql://...`). |
| `ENCRYPTION_KEY` | Hex String | Ya | Kunci master 32-byte (64 karakter hex) untuk enkripsi & dekripsi kredensial AES-256-GCM. |
| `PORT` | Number | Tidak | Port jaringan backend Express (default: `5000`). |
| `JWT_SECRET` | String | Ya | Kunci rahasia untuk tanda tangan dan validasi JSON Web Token. |
| `TELEGRAM_BOT_TOKEN` | String | Opsional | Token Bot Telegram dari BotFather untuk notifikasi `callmebot-notifier`. |
| `TELEGRAM_CHAT_ID` | String | Opsional | ID Obrolan/Grup Telegram target penerimaan notifikasi kuota kritis. |

---

## 📡 Daftar Endpoint API Utama

### 1. Autentikasi (`/api/auth`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Publik | Mendaftarkan akun baru (`email`, `password`, opsional `role: ADMIN/VIEWER`). Token disimpan di httpOnly cookie. |
| `POST` | `/api/auth/login` | Publik | Memvalidasi kredensial pengguna, menerbitkan JWT, dan menyetel httpOnly cookie. |
| `GET` | `/api/auth/me` | Authenticated | Mengambil profil dan data peran pengguna yang sedang login. |
| `POST` | `/api/auth/logout` | Authenticated | Menghapus httpOnly cookie sesi dan keluar. |

### 2. Manajemen Provider (`/api/providers`)
*Semua endpoint `/api/providers` dilindungi oleh middleware `authenticate`.*
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/providers` | Authenticated | Mengambil daftar seluruh provider yang dimonitor (dengan masked API key). |
| `GET` | `/api/providers/:id` | Authenticated | Mengambil detail satu provider berdasarkan ID. |
| `POST` | `/api/providers` | **ADMIN Only** | Mendaftarkan API key baru. Plaintext langsung dienkripsi dengan AES-256-GCM sebelum disimpan. |
| `PUT` | `/api/providers/:id` | Authenticated | Memperbarui nama, budget kuota, atau nilai ambang batas provider. |
| `DELETE`| `/api/providers/:id` | **ADMIN Only** | Menghapus data provider beserta riwayat penggunaan dan log terkait. |
| `POST` | `/api/providers/:id/sync` | Authenticated | Memaksa sinkronisasi langsung (*on-demand*) kuota ke server provider. |

### 3. Dashboard Telemetri (`/api/dashboard`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Publik / Auth | Mengambil metrik agregat kuota, data deret waktu untuk grafik Recharts, dan riwayat alert terbaru. |

### 4. Pengaturan Alert (`/api/alerts`)
| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alerts/config` | Authenticated | Mengambil preferensi notifikasi (Telegram, Webhook, status toggle). |
| `PUT` | `/api/alerts/config` | Authenticated | Memperbarui token Telegram bot, chat ID, atau webhook URL. |
| `POST` | `/api/alerts/test` | Authenticated | Mengirim pesan pengujian (*test alert*) langsung ke Telegram atau WhatsApp Webhook. |
| `GET` | `/api/alerts/logs` | Authenticated | Mengambil daftar audit trail log pengiriman notifikasi. |

---

## 🔒 Catatan Keamanan (Security Deep Dive)

1. **Enkripsi Kredensial Otentik (AES-256-GCM)**:
   - Menggunakan mode *Galois/Counter Mode* (GCM) yang menyediakan kerahasiaan (*confidentiality*) sekaligus integritas otentikasi data (*integrity*).
   - Setiap kali data dienkripsi, dihasilkan IV acak 16-byte yang unik.
   - Format penyimpanan: `<IV_HEX>:<AUTH_TAG_HEX>:<CIPHERTEXT_HEX>`. Modifikasi satu bit pada ciphertext atau IV akan menggagalkan dekripsi secara langsung.
2. **Masking Kredensial**:
   - Plaintext API key didekripsi strictly secara temporer di memori prosesor hanya pada saat melakukan polling HTTP ke upstream AI Provider.
   - Respon REST API selalu mengaburkan kunci (misal: `sk-proj-••••••••••••8a9F`), sehingga data sensitif tidak pernah bocor ke browser inspektor.
3. **Autentikasi JWT & httpOnly Cookie**:
   - Menggunakan token JWT bertanda tangan digital dengan algoritma HMAC-SHA256.
   - Disimpan di browser melalui cookie bertanda `httpOnly: true`, `SameSite: 'lax'`, dan `secure: true` (saat mode produksi), sehingga JavaScript pihak ketiga atau script jahat XSS tidak dapat membaca token.
4. **Role-Based Access Control (RBAC)**:
   - Validasi ketat diterapkan di tingkat middleware Express (`requireAdmin`).
   - Upaya penulisan atau penghapusan provider oleh pengguna berlevel `VIEWER` akan langsung ditolak dengan kode status HTTP `403 Forbidden`.
5. **Mitigasi Penolakan Layanan (DoS) & Injection**:
   - Body parser dibatasi maksimal 16 KB.
   - Rate limiting bertingkat melindungi rute sensitif dari serangan *brute force*.
   - Prisma ORM menggunakan *parameterized queries* yang mengeliminasi celah SQL Injection.

---

## 🧪 Cara Pengujian Sistem

Proyek ini dilengkapi dengan suite pengujian otomatis untuk memverifikasi keamanan kriptografi dan end-to-end API:

### 1. Pengujian Kriptografi AES-256-GCM
Memverifikasi fungsionalitas enkripsi, dekripsi, keacakan semantik IV, dan deteksi tampering autentikasi:
```bash
cd backend
npm run test:crypto
```

### 2. Pengujian End-to-End API, JWT & RBAC
Memverifikasi header keamanan Helmet, rute terlindungi 401 unauthenticated, registrasi/login JWT, penolakan 403 bagi peran VIEWER, serta operasi penuh bagi peran ADMIN:
```bash
cd backend
npx tsx tests/api.test.ts
```

---

## 📂 Struktur Direktori Proyek

```
apiquota/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Skema Prisma (User, ApiProvider, UsageHistory, NotificationConfig, AlertLog)
│   │   └── seed.ts              # Script pengisian data awal pengguna dan provider
│   ├── src/
│   │   ├── config/              # Validasi variabel lingkungan Zod (env.ts)
│   │   ├── controllers/         # Kontroler logika bisnis (auth, provider, dashboard, alert)
│   │   ├── middleware/          # Keamanan (auth, rateLimiter, security, validate, error)
│   │   ├── routes/              # Rute Express (auth, provider, dashboard, alert)
│   │   ├── services/            # Service kripto, poller, scheduler (node-cron), notifications (callmebot)
│   │   ├── utils/               # Utilitas logger, masking
│   │   ├── app.ts               # Inisialisasi Express & middleware pipeline
│   │   └── index.ts             # Entrypoint server & inisialisasi cron scheduler
│   ├── tests/
│   │   ├── api.test.ts          # E2E Backend, JWT, RBAC & API security test
│   │   └── crypto.test.ts       # Validasi algoritma AES-256-GCM
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, StatCard, ProviderCard, UsageChart, Modals, LoginPage, ProtectedRoute
│   │   ├── services/            # Klien HTTP api.ts dengan fetch dan httpOnly credentials
│   │   ├── types/               # Definisi TypeScript (User, ApiProvider, DashboardSummary, dll.)
│   │   ├── App.tsx              # Tampilan utama Dashboard masdika.id dark mode
│   │   ├── index.css            # Styling kustom Tailwind & infinite marquee keyframes
│   │   └── main.tsx             # Entrypoint React
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── .env.example                 # Template variabel lingkungan root
├── LICENSE                      # Lisensi resmi MIT (Copyright (c) 2026 Hidayat)
└── README.md                    # Dokumentasi lengkap proyek
```

---

## ❓ Troubleshooting

Tabel berikut merangkum masalah umum yang sering dihadapi, penyebab teknis, dan solusi penyelesaiannya:

| Masalah | Penyebab | Solusi |
| :--- | :--- | :--- |
| **Port 5000 sedang dipakai (`EADDRINUSE`)** | Ada proses backend lain atau service lokal (seperti AirPlay / daemon server) yang menduduki port 5000. | Matikan proses yang menggunakan port tersebut dengan perintah `lsof -i :5000` lalu `kill -9 <PID>`, atau ubah konfigurasi `PORT=5001` di file `backend/.env`. |
| **Prisma Migrate / Push Gagal** | File database SQLite `dev.db` terkunci oleh proses lain, atau skema Prisma mengalami *drift*. | Hentikan server yang sedang berjalan, pastikan izin direktori dapat ditulis (`chmod 755 prisma`), lalu jalankan ulang `npx prisma db push` di dalam folder `backend`. |
| **CORS Error di Browser** | Nilai `CORS_ORIGIN` di `backend/.env` tidak sesuai dengan alamat host atau port frontend Vite. | Pastikan `CORS_ORIGIN=http://localhost:5173` telah disetel di `backend/.env` dan pastikan peramban mengakses dari origin yang sama. |
| **JWT Expired / Sesi Berakhir** | Token autentikasi JWT telah melewati batas waktu kedaluwarsa (24 jam). | Lakukan login ulang melalui antarmuka halaman login untuk mendapatkan token JWT baru yang segar di cookie. |
| **Telegram tidak mengirim pesan alert** | Nilai `TELEGRAM_BOT_TOKEN` atau `TELEGRAM_CHAT_ID` salah, bot belum di-start via `/start` oleh user di Telegram, atau kuota provider belum melewati threshold. | Buka bot Anda di Telegram dan kirim pesan `/start`. Verifikasi token bot via BotFather, periksa chat ID melalui bot get-id, lalu coba tombol **Test Send** di modal *Alert Settings*. |
| **Role Forbidden (403 saat Create/Delete Provider)** | Pengguna yang sedang masuk berstatus sebagai akun dengan peran `VIEWER`. | Masuk menggunakan akun berstatus `ADMIN` (misalnya `admin@apiquota.dev` / `Password123!`), karena hak penambahan dan penghapusan kunci provider hanya diberikan kepada ADMIN. |
