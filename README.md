# Fonlok — Secure Escrow Payments for Cameroon

**Fonlok** is a full-stack web application that acts as a trusted escrow intermediary between buyers and sellers in Cameroon. It holds a buyer's payment (via MTN Mobile Money or Orange Money) until the seller delivers the agreed product or service, then releases the funds. This eliminates scams in peer-to-peer transactions.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Repository Structure](#3-repository-structure)
4. [Prerequisites](#4-prerequisites)
5. [Environment Variables](#5-environment-variables)
6. [Local Development Setup](#6-local-development-setup)
7. [Database Setup](#7-database-setup)
8. [Frontend — Pages & Features](#8-frontend--pages--features)
9. [Backend — API Routes Reference](#9-backend--api-routes-reference)
10. [Middleware & Security](#10-middleware--security)
11. [Background Jobs (Scheduled Tasks)](#11-background-jobs-scheduled-tasks)
12. [Key Components Reference](#12-key-components-reference)
13. [Internationalisation (i18n)](#13-internationalisation-i18n)
14. [PWA (Progressive Web App)](#14-pwa-progressive-web-app)
15. [Admin Panel](#15-admin-panel)
16. [Brand & Design Configuration](#16-brand--design-configuration)
17. [File Storage (Cloudinary)](#17-file-storage-cloudinary)
18. [Email (SendGrid)](#18-email-sendgrid)
19. [Payment Processing (Campay)](#19-payment-processing-campay)
20. [Push Notifications (Web Push)](#20-push-notifications-web-push)
21. [Deployment](#21-deployment)
22. [Making Changes Safely](#22-making-changes-safely)
23. [Common Issues & Troubleshooting](#23-common-issues--troubleshooting)

---

## 1. Project Overview

| Property      | Value                                      |
|---------------|--------------------------------------------|
| Product name  | **Fonlok**                                 |
| Domain        | https://fonlok.com                         |
| Support email | support@fonlok.com                         |
| Support phone | +237 654 155 218                           |
| Target market | Cameroon (MTN MoMo + Orange Money)         |
| Languages     | English 🇬🇧 and French 🇫🇷                   |
| Currency      | XAF (Central African CFA franc)            |

### How it works (user flow)

```
Seller creates invoice  →  Sends link to buyer
Buyer visits link        →  Enters phone + email, pays via MoMo
Campay confirms payment  →  Fonlok marks invoice "paid"
Seller delivers service  →  Marks invoice "delivered"
Fonlok releases funds    →  Seller receives money (minus 2% fee)
```

Optionally the invoice can use **milestones** — the seller breaks the work into
phases and releases funds per milestone instead of all at once.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          VERCEL (Frontend)                          │
│                                                                     │
│   Next.js 16 App Router  ·  TypeScript  ·  Tailwind CSS v4         │
│   next-intl (EN/FR)      ·  PWA (Service Worker)                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS  (Axios + Bearer JWT)
┌───────────────────────────────▼─────────────────────────────────────┐
│                         RAILWAY (Backend)                           │
│                                                                     │
│   Express.js v5  ·  Node.js ESM  ·  PM2 process manager            │
│   Helmet  ·  CORS  ·  Rate limiting  ·  XSS sanitization           │
└──────────┬─────────────────────────────────┬────────────────────────┘
           │ pg Pool (TLS)                   │ REST
┌──────────▼────────────┐        ┌───────────▼──────────────┐
│  PostgreSQL Database   │        │  Third-party services     │
│  (Railway / any host)  │        │                           │
│                        │        │  Cloudinary  — images     │
│  users                 │        │  SendGrid    — emails     │
│  invoices              │        │  Campay      — MoMo pay   │
│  guests                │        │  Groq / Gemini — AI chat  │
│  chat_messages         │        │  Web Push    — notifs     │
│  reviews               │        └───────────────────────────┘
│  payouts               │
│  referral_earnings     │
│  platform_settings     │
│  + 8 more tables       │
└────────────────────────┘
```

### Auth strategy

- Users log in → backend signs a JWT → stored in **`localStorage`** as `token`
- Every Axios request attaches it as `Authorization: Bearer <token>`  
- Backend also sets an **httpOnly cookie** as a fallback for same-origin environments
- The `UserContext` React context holds `user_id` and `username` in memory

---

## 3. Repository Structure

```
fintech/
├── backend/                    Express.js API server
│   ├── src/
│   │   ├── auth/
│   │   │   └── authMiddleware.js        (legacy location, not used)
│   │   ├── config/
│   │   │   └── brand.js                 Server-side brand constants
│   │   ├── controllers/
│   │   │   ├── db.js                    PostgreSQL connection pool
│   │   │   └── server.js                App entry point, middleware setup
│   │   ├── jobs/
│   │   │   └── scheduledJobs.js         node-cron background tasks
│   │   ├── middleware/
│   │   │   ├── adminMiddleware.js        Admin JWT guard
│   │   │   ├── authMiddleware.js         User JWT guard
│   │   │   ├── notificationHelper.js     Web Push send helper
│   │   │   ├── platformGuard.js          Maintenance/payments/payouts toggles
│   │   │   ├── rateLimiters.js           express-rate-limit configs
│   │   │   ├── sanitize.js              XSS body sanitizer (xss library)
│   │   │   └── validate.js              express-validator error formatter
│   │   ├── routes/
│   │   │   ├── admin.js                 Admin panel API
│   │   │   ├── aiChat.js                AI assistant (Groq + Gemini fallback)
│   │   │   ├── chat.js                  Invoice chat messages
│   │   │   ├── dispute.js               Dispute open/resolve
│   │   │   ├── invoices.js              Invoice CRUD + milestones
│   │   │   ├── login.js                 Auth login + logout
│   │   │   ├── notifications.js         Web Push subscribe/send
│   │   │   ├── passwordReset.js         Forgot + reset password
│   │   │   ├── paymentWebhook.js        Campay webhook receiver
│   │   │   ├── payout.js                Escrow release (full + milestone)
│   │   │   ├── profile.js               Public profile + reviews
│   │   │   ├── referral.js              Referral code + earnings
│   │   │   ├── register.js              New user registration
│   │   │   ├── requestPayment.js        Initiate MoMo payment via Campay
│   │   │   ├── templates.js             Invoice templates CRUD
│   │   │   ├── transactions.js          Transaction history
│   │   │   ├── uploads.js               Legacy file serving (pre-Cloudinary)
│   │   │   └── user.js                  Account self-management
│   │   └── utils/
│   │       ├── cloudinary.js            Cloudinary SDK + upload helpers
│   │       ├── emailTemplate.js         HTML email builder
│   │       ├── generateReceipt.js       PDF receipt generator (pdf-lib)
│   │       ├── logger.js                Winston logger (file + console)
│   │       └── platformSettings.js     Read platform_settings from DB
│   ├── ecosystem.config.cjs             PM2 process config
│   └── package.json
│
└── frontend/                   Next.js application
    ├── app/
    │   ├── layout.tsx                   Root layout (fonts, metadata, providers)
    │   ├── page.tsx                     Homepage / landing page
    │   ├── globals.css                  Global CSS variables + base styles
    │   ├── manifest.ts                  PWA manifest (dynamic)
    │   ├── robots.ts                    robots.txt
    │   ├── sitemap.ts                   sitemap.xml
    │   │
    │   ├── admin/                       Admin panel (login + dashboard)
    │   ├── chat/[invoice_number]/       Buyer chat page (token auth)
    │   ├── contact/                     Contact page
    │   ├── dashboard/                   Seller dashboard + dashboard chat
    │   ├── faq/                         FAQ page
    │   ├── forgot-password/             Forgot password form
    │   ├── how-it-works/                How Fonlok works (marketing)
    │   ├── invoice/[invoice_number]/    Public invoice view for buyers
    │   ├── login/                       Login page
    │   ├── maintenance/                 Maintenance mode redirect page
    │   ├── offline/                     PWA offline fallback
    │   ├── payment-pending/             Post-payment waiting screen
    │   ├── pricing/                     Pricing / fees page
    │   ├── privacy/                     Privacy policy
    │   ├── profile/[username]/          Public seller profile + reviews
    │   ├── purchases/                   Buyer purchase history
    │   ├── referral/                    Referral dashboard
    │   ├── referral-programme/          Referral programme info page
    │   ├── register/                    Registration form
    │   ├── reset-password/              Password reset form
    │   ├── settings/                    Account settings
    │   ├── terms/                       Terms of service
    │   ├── transactions/                Seller transaction history
    │   └── verify/                      Account email verification
    │
    ├── app/components/                  Shared React components
    ├── config/
    │   └── brand.ts                     Single source of truth for brand data
    ├── context/
    │   └── UserContext.tsx              Global auth state (user_id, username)
    ├── hooks/
    │   ├── useHaptic.ts                 Haptic feedback helper
    │   └── useNotifications.ts         Web Push subscription hook
    ├── i18n/
    │   ├── request.ts                   next-intl server config
    │   └── routing.ts                   next-intl routing config
    ├── messages/
    │   ├── en.json                      All English UI strings
    │   └── fr.json                      All French UI strings
    ├── public/
    │   ├── sw.js                        Service Worker (PWA)
    │   └── icons/                       PWA icons (multiple sizes)
    ├── next.config.ts                   Next.js + next-intl config
    ├── postcss.config.mjs               Tailwind CSS PostCSS config
    └── package.json
```

---

## 4. Prerequisites

Make sure these are installed on your machine:

| Tool              | Version  | Purpose                             |
|-------------------|----------|-------------------------------------|
| **Node.js**       | ≥ 18.x   | Run both frontend and backend       |
| **npm**           | ≥ 9.x    | Package manager                     |
| **PostgreSQL**    | ≥ 14.x   | Database (local or hosted)          |
| **Git**           | any      | Version control                     |

You also need accounts on these external services (all have free tiers for dev):

| Service       | Purpose                         | Sign-up URL                        |
|---------------|---------------------------------|------------------------------------|
| Cloudinary    | Image storage                   | https://cloudinary.com             |
| SendGrid      | Transactional emails            | https://sendgrid.com               |
| Campay        | MTN/Orange MoMo integration     | https://campay.net                 |
| Groq          | AI chat responses               | https://console.groq.com          |

---

## 5. Environment Variables

### Backend (`backend/.env`)

Create a file called `.env` inside the `backend/` folder with these variables:

```env
# ── Server ────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── CORS — comma-separated list of allowed frontend origins ──────────
ALLOWED_ORIGINS=http://localhost:3000

# ── PostgreSQL Database ───────────────────────────────────────────────
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fonlok

# ── JWT ───────────────────────────────────────────────────────────────
# Generate a strong random string: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_long_random_jwt_secret
ADMIN_JWT_SECRET=your_long_random_admin_jwt_secret

# ── Cloudinary ────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ── SendGrid (email) ──────────────────────────────────────────────────
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@fonlok.com

# ── Campay (Mobile Money payments) ───────────────────────────────────
CAMPAY_USERNAME=your_campay_username
CAMPAY_PASSWORD=your_campay_password
CAMPAY_BASE_URL=https://demo.campay.net/api    # use https://campay.net/api in production

# ── Groq (AI chat) ────────────────────────────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# ── Web Push (push notifications) ────────────────────────────────────
# Generate these once with: node backend/generate-vapid-keys.mjs
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# ── Admin ────────────────────────────────────────────────────────────
# Comma-separated list of email addresses that can log in to the admin panel
ADMIN_EMAILS=your_admin_email@example.com
```

> **Never commit `.env` to Git.** It is already listed in `.gitignore`.

### Frontend (`frontend/.env.local`)

Create a file called `.env.local` inside the `frontend/` folder:

```env
# The full URL of your backend API (no trailing slash)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

In production set this to your Railway backend URL, e.g.:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.up.railway.app
```

---

## 6. Local Development Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/Bengche/Fonlok-Backend.git   # backend
git clone https://github.com/Bengche/fintech-frontend.git  # frontend
# Or if both live in one repo, just clone once
cd fintech
```

### Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

### Step 3 — Install frontend dependencies

```bash
cd ../frontend
npm install
```

### Step 4 — Set up environment variables

Copy the examples from [Section 5](#5-environment-variables) and fill in real values.

### Step 5 — Set up the database

```bash
# Create the database (PostgreSQL must be running)
psql -U postgres -c "CREATE DATABASE fonlok;"
```

Then run the backend once — it automatically creates all required tables on
first boot via the startup migrations inside `server.js`.

```bash
cd backend
npm run dev
# Watch the console — it logs every table it creates
```

### Step 6 — Start the frontend

Open a **second terminal**:

```bash
cd frontend
npm run dev
```

The app is now running at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 7. Database Setup

Fonlok uses **auto-migration** — all tables are created automatically when the
server starts. You do **not** need to run any SQL scripts manually. The tables
are created in `server.js` inside the `app.listen(...)` callback.

### Tables created automatically on first boot

| Table                   | Purpose                                          |
|-------------------------|--------------------------------------------------|
| `users`                 | Registered seller accounts                      |
| `invoices`              | All invoices created by sellers                  |
| `guests`                | Buyer records (email + phone per invoice)        |
| `chat_messages`         | Per-invoice chat between buyer and seller        |
| `reviews`               | Buyer reviews for sellers                        |
| `payouts`               | Payout records (when escrow is released)         |
| `referral_earnings`     | Referral commission tracking                     |
| `platform_settings`     | Maintenance mode / payment / payout toggles     |
| `processed_payments`    | Webhook idempotency (prevents double-payment)    |
| `invoice_reminders`     | Tracks which payment reminder emails were sent   |
| `dispute_escalations`   | Tracks which dispute escalation emails were sent |
| `admin_broadcasts`      | Admin mass email history                         |
| `balance_adjustments`   | Manual admin credit/debit audit log              |

### Key columns (users table)

| Column           | Type      | Notes                                  |
|------------------|-----------|----------------------------------------|
| `id`             | SERIAL PK |                                        |
| `name`           | TEXT      | Full name                              |
| `email`          | TEXT      | Unique, lowercase                      |
| `username`       | TEXT      | Unique, alphanumeric + underscores     |
| `phone`          | TEXT      | Cameroonian format `237XXXXXXXXX`      |
| `password`       | TEXT      | bcrypt hash                            |
| `profilepicture` | TEXT      | Full Cloudinary URL                    |
| `referral_code`  | TEXT      | 6-char unique code auto-generated      |
| `referred_by`    | INTEGER   | FK → users.id (the referrer)           |
| `wallet_balance` | NUMERIC   | Platform wallet for MoMo refunds       |
| `createdat`      | TIMESTAMPTZ |                                      |

---

## 8. Frontend — Pages & Features

### Public pages (no login required)

#### `/` — Homepage
The landing/marketing page. Contains the hero section, how-it-works overview,
benefits slider, social proof, and call-to-action buttons.

#### `/register` — Registration
New sellers create an account. Fields: full name, username, email,
Cameroonian phone number, date of birth, country, password, optional referral
code, optional profile picture.

> The profile picture is uploaded directly to **Cloudinary** (`fonlok/avatars`
> folder) during registration. A full HTTPS URL is stored in the database.

#### `/login` — Login
Email + password login. On success the backend returns a JWT which is stored in
`localStorage` under the key `token`. Every subsequent Axios request sends this
as `Authorization: Bearer <token>`.

#### `/forgot-password` and `/reset-password` — Password reset
Sellers enter their email → receive a reset link via SendGrid → click the link
→ enter a new password. The reset token is embedded in the link URL.

#### `/verify` — Email verification
Handles the email verification link sent after registration.

#### `/invoice/[invoice_number]` — Public invoice view
The page buyers land on when a seller sends them an invoice link. Shows invoice
details, seller info, price breakdown (including the 2% Fonlok fee), and the
payment form (phone number + email for MoMo confirmation).

#### `/chat/[invoice_number]` — Buyer chat (token-based)
After paying, buyers receive an email with a unique chat link. This page allows
buyers to message the seller without needing a Fonlok account.
Authentication is handled via a `?token=<chat_token>&invoice=<number>` query
parameter that is validated against the `guests` table.

#### `/profile/[username]` — Public seller profile
Shows a seller's name, profile picture, country, member-since date, completed
transactions count, average rating, all reviews, and recent completed invoices.
Publicly accessible — useful for buyers to verify a seller before paying.

#### `/payment-pending` — Post-payment waiting screen
After the buyer initiates a MoMo payment, they are redirected here while
waiting for the USSD push to be confirmed. Automatically redirects when the
payment is confirmed.

#### `/pricing` — Pricing
Explains Fonlok's fee structure (2% on each transaction).

#### `/how-it-works` — How it works
Step-by-step marketing explanation of the platform flow.

#### `/faq` — FAQ
Frequently asked questions.

#### `/contact` — Contact
Contact information and support form.

#### `/privacy` — Privacy policy
Full privacy policy page.

#### `/terms` — Terms of Service
Full terms of service page.

#### `/referral-programme` — Referral programme info
Marketing page explaining the referral system and commission structure.

#### `/maintenance` — Maintenance mode
Shown when the admin enables maintenance mode. All non-admin API requests return
HTTP 503 and the `UserContext` global interceptor redirects to this page.

#### `/offline` — PWA offline fallback
Displayed by the Service Worker when the user is offline and tries to load a
page that isn't cached.

---

### Authenticated seller pages (login required)

#### `/dashboard` — Seller dashboard
The main seller workspace. Contains four tabs:

| Tab         | Content                                                     |
|-------------|-------------------------------------------------------------|
| **Invoices**  | All invoices created by the seller. Links to invoice actions. |
| **Filter**    | Filter invoices by status, date range, keyword.             |
| **Payment**   | Manual escrow release form (invoice number + MoMo code).    |
| **Stats**     | Revenue statistics (total earned, pending, etc.).           |

Also shows the **EscrowBalance** widget and the **payments-disabled notice
banner** (amber warning when payments are suspended by admin).

#### `/dashboard/chat/[invoice_number]` — Seller full chat page
A full-page version of the chat interface for a specific invoice. Supports text
messages and image/file attachments (uploaded to Cloudinary). Input is a
`<textarea>` with a 1,500-character limit and a live character counter.
Messages auto-scroll. Supports word-wrap on long URLs.

#### `/transactions` — Transaction history
Shows all completed/paid invoices with amounts, buyer info, and timestamps.

#### `/purchases` — Purchase history
Shows invoices where the logged-in user was the buyer (via `guests` table match
on email/phone).

#### `/profile/[username]` — Own profile
When navigating to your own username the page is the same as the public view,
but future versions may show edit controls here.

#### `/settings` — Account settings
Logged-in users can update:
- Full name
- Email address
- Phone number (MoMo number used for payouts)
- Password (requires current password)
- Profile picture (uploads to Cloudinary `fonlok/avatars/user_<id>`)
- **Delete account** (permanent, requires password confirmation)

#### `/referral` — Referral dashboard
Shows the seller's personal referral code, referral link, number of people
referred, and total commission earned.

#### `/verify` — Verification
New accounts may need to complete email verification here.

---

### Admin pages (`/admin/*`)

See [Section 15 — Admin Panel](#15-admin-panel).

---

## 9. Backend — API Routes Reference

All API routes are prefixed with the base URL set in `NEXT_PUBLIC_API_BASE_URL`.

### Authentication (`/auth`)

| Method | Path                        | Auth | Description                              |
|--------|-----------------------------|------|------------------------------------------|
| POST   | `/auth/register`            | None | Create new seller account + upload photo |
| POST   | `/auth/login`               | None | Login, returns JWT                       |
| POST   | `/auth/logout`              | User | Clears auth cookie                       |
| POST   | `/auth/forgot-password`     | None | Send password reset email via SendGrid   |
| POST   | `/auth/reset-password`      | None | Accept reset token + new password        |
| GET    | `/auth/verify-email`        | None | Verify email address from link           |

### Invoices (`/invoice`)

| Method | Path                                        | Auth | Description                                    |
|--------|---------------------------------------------|------|------------------------------------------------|
| POST   | `/invoice/create`                           | User | Create new invoice                             |
| GET    | `/invoice/:invoice_number`                  | None | Get invoice details (public — for buyer view)  |
| PATCH  | `/invoice/edit/:invoice_number`             | User | Edit invoice (only if still pending)           |
| DELETE | `/invoice/delete/:invoice_number`           | User | Delete invoice                                 |
| PATCH  | `/invoice/deliver/:invoice_number`          | User | Mark invoice as delivered                      |
| GET    | `/invoice/all/:user_id`                     | User | Get all invoices for a seller                  |
| GET    | `/invoice/receipt/:invoice_number`          | Flex | Download PDF receipt                           |
| POST   | `/invoice/resend-email/:invoice_number`     | User | Resend invoice email to buyer                  |
| POST   | `/invoice/milestone/:invoice_number`        | User | Add milestone to invoice                       |
| PATCH  | `/invoice/milestone/:milestone_id/complete` | User | Mark milestone as complete                     |

### Payments (`/api` + `/payment`)

| Method | Path                                | Auth    | Description                                    |
|--------|-------------------------------------|---------|------------------------------------------------|
| POST   | `/api/requestPayment`               | None    | Initiate MTN/Orange MoMo payment via Campay    |
| POST   | `/payment/webhook`                  | Campay  | Campay calls this when payment is confirmed    |
| POST   | `/api/release-funds`                | User    | Release full escrow to seller                  |
| GET    | `/api/release-milestone/:token`     | Token   | Release single milestone (via email link)      |

### Chat (`/chat`)

| Method | Path                                | Auth         | Description                                 |
|--------|-------------------------------------|--------------|---------------------------------------------|
| GET    | `/chat/:invoice_number`             | User/Buyer   | Get all chat messages for an invoice        |
| POST   | `/chat/:invoice_number`             | User/Buyer   | Send a chat message (text or attachment)    |

Buyer authentication uses `?token=<token>&invoice=<number>` query params.
Attachments are uploaded to Cloudinary `fonlok/chat` folder.

### Disputes (`/dispute`)

| Method | Path                                | Auth | Description                                   |
|--------|-------------------------------------|------|-----------------------------------------------|
| POST   | `/dispute/open/:invoice_number`     | User | Open a dispute on an invoice                  |
| GET    | `/dispute/status/:invoice_number`   | User | Check dispute status                          |
| PATCH  | `/dispute/resolve/:invoice_number`  | Admin| Resolve a dispute (admin only)                |

### Transactions (`/transactions`)

| Method | Path                      | Auth | Description                             |
|--------|---------------------------|------|-----------------------------------------|
| GET    | `/transactions/:user_id`  | User | Get all completed transactions          |

### Profile (`/profile`)

| Method | Path                             | Auth | Description                             |
|--------|----------------------------------|------|-----------------------------------------|
| GET    | `/profile/:username`             | None | Public seller profile + reviews + stats |
| GET    | `/profile/user-info/:user_id`    | None | Get username by user ID                 |
| PATCH  | `/profile/update-phone`          | User | Update MoMo payout phone number         |
| POST   | `/profile/review`                | User | Submit a review for a seller            |

### Templates (`/templates`)

| Method | Path                        | Auth | Description                   |
|--------|-----------------------------|------|-------------------------------|
| GET    | `/templates/:user_id`       | User | Get saved invoice templates   |
| POST   | `/templates`                | User | Save a new template           |
| DELETE | `/templates/:template_id`   | User | Delete a template             |

### Referral (`/referral`)

| Method | Path                        | Auth | Description                            |
|--------|-----------------------------|------|----------------------------------------|
| GET    | `/referral/code/:user_id`   | User | Get the user's referral code + link    |
| GET    | `/referral/earnings/:user_id`| User | Get referral earnings history          |

### User Account (`/user`)

| Method | Path                              | Auth | Description                            |
|--------|-----------------------------------|------|----------------------------------------|
| PATCH  | `/user/update-name`               | User | Update display name                    |
| PATCH  | `/user/update-email`              | User | Update email address                   |
| PATCH  | `/user/update-phone`              | User | Update phone number                    |
| PATCH  | `/user/update-profile-picture`    | User | Upload new profile picture → Cloudinary|
| PATCH  | `/user/change-password`           | User | Change password (requires current pwd) |
| DELETE | `/user/delete-account`            | User | Permanently delete account             |

### Notifications (`/notifications`)

| Method | Path                          | Auth | Description                               |
|--------|-------------------------------|------|-------------------------------------------|
| POST   | `/notifications/subscribe`    | User | Subscribe to Web Push notifications       |
| DELETE | `/notifications/unsubscribe`  | User | Unsubscribe from push notifications       |

### AI Chat (`/api`)

| Method | Path              | Auth | Description                                    |
|--------|-------------------|------|------------------------------------------------|
| POST   | `/api/ai-chat`    | User | Send message to AI assistant (Groq / Gemini)   |

### Uploads (`/uploads`)

| Method | Path                    | Auth         | Description                              |
|--------|-------------------------|--------------|------------------------------------------|
| GET    | `/uploads/:filename`    | User/Buyer   | Serve legacy files from disk (pre-Cloudinary migration) |

---

## 10. Middleware & Security

### `authMiddleware.js` — User authentication guard
Verifies a JWT on every protected route. Checks both:
1. `Authorization: Bearer <token>` header (production cross-domain)
2. `authToken` / `token` httpOnly cookie (same-origin fallback)

Sets `req.user = { id, email }` on success. Returns HTTP 401 if missing or
invalid.

### `adminMiddleware.js` — Admin authentication guard
Same as authMiddleware but validates against `ADMIN_JWT_SECRET` and verifies
the user's email is in the `ADMIN_EMAILS` env var list.

### `rateLimiters.js` — Rate limiting
Multiple limiters protect different routes:

| Limiter                | Applied to                   | Limit         |
|------------------------|------------------------------|---------------|
| `generalLimiter`       | All routes                   | 100 req/15min |
| `loginLimiter`         | POST /auth/login             | 10 req/15min  |
| `registerLimiter`      | POST /auth/register          | 5 req/hour    |
| `forgotPasswordLimiter`| POST /auth/forgot-password   | 5 req/hour    |
| `resetPasswordLimiter` | POST /auth/reset-password    | 5 req/hour    |
| `paymentByIpLimiter`   | POST /api/requestPayment     | 20 req/hour   |
| `paymentByInvoiceLimiter`| Same route                 | 5 per invoice |
| `invoiceCreateLimiter` | POST /invoice/create         | 10 req/hour   |
| `actionLimiter`        | Dispute/payout/milestone     | 20 req/hour   |
| `adminLoginLimiter`    | POST /admin/login            | 5 req/15min   |
| `adminApiLimiter`      | All /admin/* routes          | 200 req/15min |

### `platformGuard.js` — Platform switches
Three middleware functions that block routes based on flags in the
`platform_settings` database table:

| Guard              | Blocks when                    | HTTP code |
|--------------------|--------------------------------|-----------|
| `maintenanceGuard` | `maintenance_mode = true`      | 503       |
| `paymentsGuard`    | `payments_blocked = true`      | 503       |
| `payoutsGuard`     | `payouts_blocked = true`       | 503       |

These can be toggled from the admin panel without redeploying.

### `sanitize.js` — XSS prevention
Uses the `xss` library to strip HTML/JavaScript from all incoming request body
strings. Runs before all route handlers.

### `validate.js` — Input validation errors
Reads `express-validator` results and returns a structured 422 response if any
field validation fails. Used after `body(...)` chains in route definitions.

### Helmet (HTTP security headers)
Adds these headers to every response:
- `X-Frame-Options: DENY` (blocks iframe embedding / clickjacking)
- `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing)
- `Content-Security-Policy` (restrictive policy — no external scripts)
- Removes `X-Powered-By: Express` (hides technology fingerprint)

---

## 11. Background Jobs (Scheduled Tasks)

Located in `backend/src/jobs/scheduledJobs.js`. Runs two cron jobs every hour
using `node-cron`.

### Job 1 — Invoice payment reminders

Sends email reminders to buyers who started a payment but haven't completed it:

| Level | Trigger          | Email                                  |
|-------|------------------|----------------------------------------|
| 1     | 24 h after init  | "Your payment is pending" reminder     |
| 2     | 48 h after init  | Second reminder                        |
| 3     | 72 h after init  | Final reminder before invoice expires  |

Never sends duplicates — tracked in `invoice_reminders` table.

### Job 2 — Dispute escalation

Alerts the admin when disputes are not resolved:

| Level | Trigger               | Email                              |
|-------|-----------------------|------------------------------------|
| 1     | 72 h after opening    | Warning email to admin             |
| 2     | 7 days after opening  | Strong escalation email to admin   |

Never sends duplicates — tracked in `dispute_escalations` table.

---

## 12. Key Components Reference

| Component                  | File                              | Purpose                                              |
|----------------------------|-----------------------------------|------------------------------------------------------|
| `Navbar`                   | `components/Navbar.tsx`           | Top navigation bar with auth state, language switcher, mobile drawer |
| `EscrowBalance`            | `components/EscrowBalance.tsx`    | Shows seller's pending escrow amount on dashboard    |
| `CreateInvoice`            | `components/createInvoice.tsx`    | Invoice creation form with milestone support         |
| `GetAllInvoices`           | `components/getAllInvoices.tsx`   | Invoice list with status badges and action buttons   |
| `FilterInvoice`            | `components/filterInvoice.tsx`   | Invoice filter/search UI                             |
| `RevenueStats`             | `components/RevenueStats.tsx`     | Revenue chart and summary stats for the dashboard    |
| `ChatWindow`               | `components/ChatWindow.tsx`       | Inline seller chat widget (embedded in invoice page) |
| `AiChatWidget`             | `components/AiChatWidget.tsx`     | Floating AI assistant widget                         |
| `AiChatWidgetWrapper`      | `components/AiChatWidgetWrapper.tsx`| Client-only wrapper for the AI widget              |
| `NotificationBell`         | `components/NotificationBell.tsx` | Push notification bell + unread badge                |
| `BenefitsSlider`           | `components/BenefitsSlider.tsx`   | Auto-scrolling benefits carousel on homepage         |
| `CookieConsent`            | `components/CookieConsent.tsx`    | GDPR cookie consent banner                           |
| `DisputeButton`            | `components/DisputeButton.tsx`    | Button to open a dispute on a paid invoice           |
| `FonlokLogo`               | `components/FonlokLogo.tsx`       | SVG logo component                                   |
| `LayoutShell`              | `components/LayoutShell.tsx`      | Wraps every page — renders Navbar + Footer           |
| `PwaInstallBanner`         | `components/PwaInstallBanner.tsx` | "Add to Home Screen" prompt for PWA                  |
| `PwaRegister`              | `components/PwaRegister.tsx`      | Registers the Service Worker                         |
| `Spinner`                  | `components/Spinner.tsx`          | `<InlineSpinner>` loading indicator                  |
| `clientPay`                | `components/clientPay.tsx`        | Buyer payment form (phone + email entry)             |
| `editInvoice`              | `components/editInvoice.tsx`      | Edit existing invoice                                |
| `deleteInvoice`            | `components/deleteInvoice.tsx`    | Delete invoice with confirmation                     |

---

## 13. Internationalisation (i18n)

The frontend supports **English** and **French** using
[next-intl](https://next-intl-docs.vercel.app/).

### Adding a new translation string

1. Add the English string to `frontend/messages/en.json` under the correct
   namespace key.
2. Add the French translation to `frontend/messages/fr.json` under the same key.
3. In the component, import `useTranslations` and use `t("namespace.key")`.

**Example:**
```json
// en.json
{
  "Dashboard": {
    "myNewString": "Hello, this is new!"
  }
}

// fr.json
{
  "Dashboard": {
    "myNewString": "Bonjour, c'est nouveau!"
  }
}
```

```tsx
// In a component
const t = useTranslations("Dashboard");
return <p>{t("myNewString")}</p>;
```

### Namespace → Component mapping

| Namespace       | Used in                                              |
|-----------------|------------------------------------------------------|
| `Navbar`        | `components/Navbar.tsx`                              |
| `Dashboard`     | `app/dashboard/page.tsx`                             |
| `Chat`          | `components/ChatWindow.tsx`, `app/dashboard/chat/`   |
| `BuyerChat`     | `app/chat/[invoice_number]/page.tsx`                 |
| `Settings`      | `app/settings/page.tsx`                              |
| `Register`      | `app/register/page.tsx`                              |
| `Login`         | `app/login/page.tsx`                                 |
| `Profile`       | `app/profile/[username]/page.tsx`                    |
| `Invoice`       | `app/invoice/[invoice_number]/page.tsx`              |
| `Pricing`       | `app/pricing/page.tsx`                               |

---

## 14. PWA (Progressive Web App)

Fonlok is installable as a mobile/desktop app.

- **Service Worker**: `frontend/public/sw.js`  
  Caches the app shell for offline use. The `/offline` page is served when the
  user is offline and tries to reach an uncached page.

- **Manifest**: generated dynamically at `app/manifest.ts`  
  Defines app name, icons, theme colour, display mode (`standalone`).

- **Icons**: `frontend/public/icons/`  
  Multiple sizes (16px to 512px) for all device types.

- **Install banner**: `components/PwaInstallBanner.tsx`  
  Detects `beforeinstallprompt` and shows a custom "Add to Home Screen" banner.

> To regenerate PWA icons from the SVG source, run:
> ```bash
> cd frontend
> node generate-pwa-icons.mjs
> ```

---

## 15. Admin Panel

The admin panel lives at `/admin` and is **separate from the seller dashboard**.
Access is restricted to email addresses listed in the `ADMIN_EMAILS` environment
variable.

### Admin login (`/admin/login`)
Uses a separate JWT signed with `ADMIN_JWT_SECRET`. The admin JWT is stored
separately from the seller JWT.

### Admin dashboard (`/admin/dashboard`)
Features include:

| Feature                  | Description                                                      |
|--------------------------|------------------------------------------------------------------|
| Platform toggles         | Enable/disable maintenance mode, payments, payouts in real time  |
| User management          | Search users, view accounts, adjust wallet balances              |
| Invoice management       | View any invoice, override status                                |
| Dispute management       | Resolve open disputes                                            |
| Mass email               | Broadcast emails to all users or individual accounts             |
| Balance adjustments      | Credit or debit a user's wallet with an audit trail              |
| Transaction overview     | View all platform transactions                                   |

### Platform settings (toggles)

The admin can flip these switches without redeploying:

| Key                  | Effect when enabled                          |
|----------------------|----------------------------------------------|
| `maintenance_mode`   | Returns HTTP 503 to all non-admin requests   |
| `payments_blocked`   | Blocks new MoMo payment initiations          |
| `payouts_blocked`    | Blocks escrow releases to sellers            |

---

## 16. Brand & Design Configuration

### Frontend brand config — `frontend/config/brand.ts`

**This is the single source of truth for all brand identity.**  
If you need to update the app name, domain, support contact, or colours,
**edit only this file** — it is imported everywhere else.

```typescript
import { BRAND } from "@/config/brand";

// Example usage
<a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
<p>{BRAND.tagline}</p>
```

### CSS variables — `frontend/app/globals.css`

The colour system uses CSS custom properties defined under `@theme`:

| Variable                | Default value  | Usage                        |
|-------------------------|----------------|------------------------------|
| `--color-primary`       | `#0F1F3D`      | Main navy blue (buttons, headings) |
| `--color-accent`        | `#F59E0B`      | Amber gold (highlights, badges)    |
| `--color-cloud`         | `#F8F9FB`      | Page background                    |
| `--color-border`        | `#E2E8F0`      | Borders and dividers               |
| `--color-text`          | `#1A202C`      | Primary text                       |
| `--color-text-muted`    | `#718096`      | Secondary / muted text             |

To change the primary colour across the entire app, update `--color-primary`
in `globals.css` and `BRAND.colors.primary` in `brand.ts`.

---

## 17. File Storage (Cloudinary)

All image uploads go to **Cloudinary**. Local disk is not used for production.

### Folders

| Cloudinary folder   | Contents                             |
|---------------------|--------------------------------------|
| `fonlok/avatars`    | Profile pictures                     |
| `fonlok/chat`       | Chat image/file attachments          |

### Helper functions (`backend/src/utils/cloudinary.js`)

| Function                | Purpose                                      |
|-------------------------|----------------------------------------------|
| `uploadToCloudinary(buffer, options)` | Upload a Buffer to Cloudinary, returns `{ url, publicId }` |
| `deleteFromCloudinary(publicId)` | Delete a file from Cloudinary by its public_id |
| `publicIdFromUrl(url)` | Extract the public_id from a Cloudinary URL  |

### Important notes

- **Registration** (`register.js`): uploads profile picture to Cloudinary and
  stores the full HTTPS URL in `users.profilepicture`.
- **Profile update** (`user.js`): overwrites the avatar using `public_id:
  user_<id>` so Cloudinary always has exactly one image per user.
- **Legacy uploads**: files uploaded before the Cloudinary migration are served
  by `routes/uploads.js` from disk. These are authenticated routes.

---

## 18. Email (SendGrid)

All transactional emails are sent via **SendGrid**.

### Emails sent by the platform

| Trigger                          | Recipients   | Content                               |
|----------------------------------|--------------|---------------------------------------|
| New invoice created              | Buyer        | Invoice details + payment link        |
| Payment confirmed                | Seller       | "You received a payment" notification |
| Invoice delivered                | Buyer        | "Your seller marked as delivered"     |
| Escrow released (seller payout)  | Seller       | Receipt + amount received             |
| Dispute opened                   | Admin        | Dispute details                       |
| Dispute escalated (72h / 7d)     | Admin        | Escalation alert                      |
| Payment reminder (24h/48h/72h)   | Buyer        | Reminder to complete payment          |
| Password reset                   | Seller       | Password reset link                   |
| Admin mass email                 | All / single | Custom message                        |

### Email templates — `backend/src/utils/emailTemplate.js`

All emails use a shared HTML builder with the Fonlok logo, brand colours, and
responsive layout. To modify the email design, edit `emailTemplate.js`.

---

## 19. Payment Processing (Campay)

Fonlok integrates with [Campay](https://campay.net) to process Mobile Money
payments in Cameroon (MTN MoMo and Orange Money).

### Payment flow

```
1. Buyer submits phone number on invoice page
   →  POST /api/requestPayment
   →  Backend calls Campay API to initiate payment
   →  Campay sends USSD push to buyer's phone

2. Buyer confirms on their phone
   →  Campay sends a webhook to POST /payment/webhook
   →  Backend verifies the webhook, marks invoice as "paid"
   →  Buyer + seller notified by email and push notification

3. Seller delivers the product/service
   →  Seller clicks "Mark as Delivered" in dashboard
   →  Invoice status → "delivered"

4. Escrow release
   →  Seller enters MoMo code via dashboard → POST /api/release-funds
   →  OR individual milestone released via token link
   →  Backend calls Campay payout API
   →  2% fee deducted, rest transferred to seller's phone
   →  Invoice status → "completed"
```

### Environment variables required

```env
CAMPAY_USERNAME=your_username
CAMPAY_PASSWORD=your_password
CAMPAY_BASE_URL=https://demo.campay.net/api   # demo
# or
CAMPAY_BASE_URL=https://campay.net/api         # production
```

### Webhook idempotency

To prevent double-payment from duplicate webhook calls, every `payment_uuid` is
inserted into the `processed_payments` table. If the same UUID arrives twice,
the `INSERT` fails on the primary key constraint and the second call is
silently ignored.

---

## 20. Push Notifications (Web Push)

Fonlok uses the W3C Web Push API to send browser/PWA push notifications.

### Setup (one-time)

Generate VAPID keys:
```bash
cd backend
node generate-vapid-keys.mjs
```

Copy the output into `.env`:
```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

The same `VAPID_PUBLIC_KEY` must also be available in the frontend (via the
`useNotifications` hook) to subscribe.

### How it works

1. User visits the site and grants notification permission
2. Browser generates a **push subscription** object
3. Frontend sends it to `POST /notifications/subscribe` → stored in DB
4. Backend uses `web-push` library to send notifications on events (payment
   confirmed, message received, etc.)
5. Service Worker (`sw.js`) receives and displays the notification even when
   the browser tab is closed

---

## 21. Deployment

### Frontend — Vercel

The `frontend/` directory is deployed to [Vercel](https://vercel.com).

1. Connect your GitHub repository to a Vercel project.
2. Set the **root directory** to `frontend`.
3. Set the environment variable: `NEXT_PUBLIC_API_BASE_URL=https://your-backend.up.railway.app`
4. Vercel automatically deploys on every push to `main`.

### Backend — Railway

The `backend/` directory is deployed to [Railway](https://railway.app).

1. Connect the `backend/` folder as a Railway service.
2. Set all environment variables from [Section 5](#5-environment-variables) in
   the Railway dashboard.
3. Add the Vercel URL to `ALLOWED_ORIGINS`.
4. Railway automatically deploys on push to `main`.

The backend uses **PM2** in production (configured in `ecosystem.config.cjs`):
```bash
# Start with PM2
npm run start:prod

# View logs
npm run logs

# Stop
npm run stop
```

### Database — PostgreSQL

Use Railway's built-in PostgreSQL plugin, or any hosted PostgreSQL service
(Supabase, Neon, etc.).

Set the `DB_*` variables in Railway to point to your database. The backend
creates all tables automatically on first boot — no manual SQL required.

---

## 22. Making Changes Safely

### Before editing any file

1. **Pull the latest changes**: `git pull`
2. **Check for errors**: look at the VS Code Problems panel (View → Problems)
3. **Never edit files that are open with unsaved external changes** — use
   "Revert File" to reload from disk first (right-click the tab → Revert File)

### Changing text / copy in the UI

All visible text strings live in:
- `frontend/messages/en.json` (English)
- `frontend/messages/fr.json` (French)

**Do not hardcode text directly into components.** Add the string to both JSON
files and reference it with `useTranslations`.

### Changing colours or brand info

- **Brand constants** (name, email, phone, URLs): edit `frontend/config/brand.ts`
- **CSS colours**: edit CSS variables in `frontend/app/globals.css`

### Adding a new page (frontend)

1. Create a folder under `frontend/app/`, e.g. `frontend/app/my-new-page/`
2. Create `page.tsx` inside it
3. The page is automatically routed to `/my-new-page`
4. Add any new translation strings to `en.json` and `fr.json`
5. If the page needs auth, use the `useAuth()` hook to check for `user_id`

### Adding a new API route (backend)

1. Create a new file in `backend/src/routes/`, e.g. `myRoute.js`
2. Build your Express router:
   ```javascript
   import express from "express";
   const router = express.Router();
   import authMiddleware from "../middleware/authMiddleware.js";

   router.get("/my-endpoint", authMiddleware, async (req, res) => {
     // your logic
   });

   export default router;
   ```
3. Import and mount it in `backend/src/controllers/server.js`:
   ```javascript
   import myRoute from "../routes/myRoute.js";
   app.use("/my-route", myRoute);
   ```

### Adding a new database column

Add an `ALTER TABLE` statement inside the `app.listen(...)` callback in
`server.js`. Use `ADD COLUMN IF NOT EXISTS` so it is safe to run on every boot:
```javascript
await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS new_column TEXT");
```

### Changing email content

Edit `backend/src/utils/emailTemplate.js`. All emails use the shared builder
function. Test by triggering the relevant flow locally.

---

## 23. Common Issues & Troubleshooting

### "The content of the file is newer" error in VS Code

This happens when an external script or tool modifies a file while VS Code has
it open. **Do not click Overwrite** — it will discard the external changes.

**Fix:** Right-click the file tab → **Revert File**. Then re-apply any
in-editor edits you had.

### Profile picture shows as broken image

Old accounts registered before the Cloudinary migration have a bare filename
(e.g. `1741234567890-photo.jpg`) stored in the database instead of a full URL.

**Fix for affected users:** Go to **Settings** and re-upload the profile picture.
This overwrites the old value with a valid Cloudinary URL.

### CORS errors in the browser console

This means the backend is not allowing the frontend's origin. Check:
1. `ALLOWED_ORIGINS` in `backend/.env` includes your exact frontend URL
   (no trailing slash)
2. The backend is running and accessible

### Payments not going through (local dev)

Campay requires a real Cameroon phone number for live payments. In development:
1. Use `CAMPAY_BASE_URL=https://demo.campay.net/api` for sandbox mode
2. Use Campay's test credentials and test phone numbers from their docs

### "JWT malformed" or 401 errors

The JWT in `localStorage` may be expired or corrupted.

**Fix:** Log out and log back in. The token is refreshed on each login.

### Maintenance mode is stuck on

An admin accidentally enabled maintenance mode and can't reach the admin panel.

**Fix:** Directly update the database:
```sql
UPDATE platform_settings SET value = 'false' WHERE key = 'maintenance_mode';
```

### Push notifications not working

1. Make sure `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set in `.env`
2. They must match — regenerating keys requires all existing subscriptions to
   re-subscribe
3. Notifications require HTTPS — they do not work on plain HTTP

### Backend won't start — "Pool error" / DB connection refused

Check that PostgreSQL is running and all `DB_*` variables are correct. The
backend logs detailed pool errors via Winston to `logs/` on startup.

### Email not sending

1. Check `SENDGRID_API_KEY` is valid and the account is active
2. Check `SENDGRID_FROM_EMAIL` matches a verified sender identity on SendGrid
3. In development you can `console.log` the email object in `emailTemplate.js`
   to inspect it without actually sending

---

## Quick Reference — Most Edited Files

| What you want to change               | File to edit                                       |
|---------------------------------------|----------------------------------------------------|
| Any UI text (English)                 | `frontend/messages/en.json`                        |
| Any UI text (French)                  | `frontend/messages/fr.json`                        |
| App name, email, phone, colours       | `frontend/config/brand.ts`                         |
| CSS colours / spacing                 | `frontend/app/globals.css`                         |
| Homepage / landing page               | `frontend/app/page.tsx`                            |
| Seller dashboard                      | `frontend/app/dashboard/page.tsx`                  |
| Account settings                      | `frontend/app/settings/page.tsx`                   |
| Email template design                 | `backend/src/utils/emailTemplate.js`               |
| Payment logic                         | `backend/src/routes/requestPayment.js`             |
| Payout / escrow release               | `backend/src/routes/payout.js`                     |
| Invoice creation/editing              | `backend/src/routes/invoices.js`                   |
| Fee percentage (currently 2%)         | `backend/src/routes/requestPayment.js` (search `0.02`) |
| Background email jobs                 | `backend/src/jobs/scheduledJobs.js`                |
| Admin panel API                       | `backend/src/routes/admin.js`                      |
| Database connection pool              | `backend/src/controllers/db.js`                    |

---

*Documentation written for Fonlok v1 — March 2026.*
