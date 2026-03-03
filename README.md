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


---

## 24. Hooks Reference

### `frontend/hooks/useHaptic.ts`

Provides haptic (vibration) feedback on mobile devices. Uses the browser
Vibration API — silently ignored on iOS Safari and desktop browsers.

```typescript
import { haptic } from "@/hooks/useHaptic";

haptic();           // 6 ms — gentle tap (default, for most buttons/tabs)
haptic("soft");     // 6 ms — very subtle (toggles, tab switches)
haptic("medium");   // 12 ms — noticeable (primary actions, form submit)
haptic("heavy");    // [18,50,18] ms — strong pulse (destructive: delete/cancel)
haptic(20);         // custom millisecond number
haptic([10,30,10]); // custom pattern array
```

**Where it's used:** Every interactive element — buttons, tab switches, form
submissions, destructive actions. Call it at the start of any `onClick` handler.

---

### `frontend/hooks/useNotifications.ts`

Manages in-app notifications and Web Push subscriptions.

**Returns:**

| Property         | Type                   | Description                              |
|------------------|------------------------|------------------------------------------|
| `notifications`  | `AppNotification[]`    | All notifications for the logged-in user |
| `unreadCount`    | `number`               | Count of unread notifications            |
| `loading`        | `boolean`              | True while the first fetch is in progress|
| `markRead(id)`   | `(id: number) => void` | Mark a single notification as read       |
| `markAllRead()`  | `() => void`           | Mark all notifications as read           |

**`AppNotification` shape:**

```typescript
interface AppNotification {
  id: number;
  type: string;        // e.g. "invoice_paid", "new_message"
  title: string;       // Short heading
  body: string;        // Full description
  data: Record<string, unknown>; // e.g. { invoiceNumber, amount }
  is_read: boolean;
  created_at: string;  // ISO timestamp
}
```

**Behaviour:**
- Fetches notifications from `GET /notifications` on mount
- Polls again every **30 seconds**
- On first load also registers the Service Worker and subscribes to Web Push
  (requests browser permission if not yet granted)

---

## 25. Logging (`backend/src/utils/logger.js`)

Winston structured logger. All backend code should use this instead of
`console.log` so logs are searchable and structured.

```javascript
import logger from "../utils/logger.js";

logger.info("Payment confirmed", { invoiceNumber: "INV-001", amount: 5000 });
logger.warn("Cloudinary upload slow", { durationMs: 4200 });
logger.error("DB query failed", { error: err.message, stack: err.stack });
logger.debug("Webhook payload", { body: req.body }); // dev only
```

### Log output

| Environment   | Format        | Destination                              |
|---------------|---------------|------------------------------------------|
| Development   | Human-readable colourised | Console only                 |
| Production    | JSON          | Console + rotating files in `logs/`      |

### Log files (production only)

| File                       | Contents          | Retention |
|----------------------------|-------------------|-----------|
| `logs/combined-YYYY-MM-DD.log` | All levels    | 14 days   |
| `logs/error-YYYY-MM-DD.log`    | Errors only   | 14 days   |
| `logs/pm2-out.log`             | PM2 stdout    | PM2 managed |
| `logs/pm2-error.log`           | PM2 stderr    | PM2 managed |

> Log files rotate daily and are compressed (`.gz`) after rotation.
> The `logs/` directory is gitignored.

---

## 26. Platform Settings Utility (`backend/src/utils/platformSettings.js`)

Provides cached read/write access to the `platform_settings` database table.
Results are cached in-process for **10 seconds** to avoid a DB hit on every
request.

### Functions

| Function                  | Purpose                                            |
|---------------------------|----------------------------------------------------|
| `getSettings()`           | Returns all settings as `{ key: "true"/"false" }`. Uses cache if fresh. |
| `setSetting(key, value)`  | Upserts a setting and immediately busts the cache  |
| `invalidateCache()`       | Forces the next `getSettings()` to re-query the DB |
| `bool(settings, key)`     | Maps the stored string `"true"`/`"false"` to a real boolean |

### Settings keys

| Key                  | Default  | Effect when `true`                      |
|----------------------|----------|-----------------------------------------|
| `maintenance_mode`   | `false`  | Blocks all non-admin API routes (503)   |
| `payments_blocked`   | `false`  | Blocks `POST /api/requestPayment` (503) |
| `payouts_blocked`    | `false`  | Blocks `POST /api/release-funds` (503)  |

All three can be toggled in real time from the admin panel without redeploying.

---

## 27. Notification System Deep Dive

### `backend/src/middleware/notificationHelper.js`

The single function `notifyUser()` handles both in-app notifications (stored in
DB, shown in the bell) and browser push notifications simultaneously.

```javascript
import { notifyUser } from "../middleware/notificationHelper.js";

await notifyUser(
  userId,          // number — the recipient's user ID
  "invoice_paid",  // string — notification type (see table below)
  "Payment received!",  // title (shown in bell + push)
  "John paid XAF 25,000 for Invoice INV-001", // body
  { invoiceNumber: "INV-001", amount: 25000 } // extra data (optional)
);
```

**It never throws** — a notification failure will never crash the calling route.

### Notification types

| Type                  | Triggered when                                    |
|-----------------------|---------------------------------------------------|
| `invoice_paid`        | Campay webhook confirms a buyer payment           |
| `payout_sent`         | Escrow successfully released to seller's MoMo     |
| `dispute_opened`      | A buyer opens a dispute                           |
| `milestone_complete`  | Seller marks a milestone as complete              |
| `milestone_released`  | A milestone payout is sent                        |
| `new_message`         | A chat message is sent on an invoice              |
| `delivered_marked`    | Seller marks the invoice as delivered             |
| `referral_earned`     | A user earns a referral commission                |

### Push subscription lifecycle

1. `useNotifications` hook requests browser permission
2. Browser generates a `PushSubscription` object
3. Frontend calls `POST /notifications/subscribe` — subscription stored in
   `push_subscriptions` table
4. Backend uses `web-push` library to send pushes via `notifyUser()`
5. If a push returns **410 Gone** or **404** (subscription expired), the backend
   automatically deletes the stale subscription from the DB
6. Service Worker (`sw.js`) receives the push event and displays the
   system notification

---

## 28. PDF Receipt Generator (`backend/src/utils/generateReceipt.js`)

Generates a branded Fonlok PDF receipt using `pdf-lib`.

```javascript
import { generateReceiptPdf } from "../utils/generateReceipt.js";

const pdfBuffer = await generateReceiptPdf("INV-001");
// Returns a Buffer — send as attachment or HTTP response
```

### PDF contents

- Fonlok logo and branding (navy + amber)
- Invoice number and unique receipt hash (SHA-256 of invoice number)
- Seller name, username, country, phone
- Buyer name (if registered), email, MoMo phone
- Invoice description and amount breakdown
- Fonlok platform fee (2%)
- Milestone table (if `payment_type = "installment"`)
- Date issued and cryptographic verification note

### Where it's called

| Route                              | Usage                                  |
|------------------------------------|----------------------------------------|
| `GET /invoice/receipt/:invoice_number` | Download receipt (authenticated)  |
| Payout confirmation email          | Attached to seller payout email        |
| Payment webhook confirmation       | Attached to buyer payment confirm email|

---

## 29. AI Chat (`backend/src/routes/aiChat.js`)

Provides the floating AI assistant widget with **Gemini 2.0 Flash** as primary
and **Groq (llama-3.3-70b-versatile)** as automatic fallback.

### Rate limiting

- **30 AI messages per IP per hour** (independent of other rate limiters)

### Key rotation

To maximise free-tier quotas, both providers support multiple API keys:

```env
# Gemini (Google) — up to 5 keys, 1,500 req/day each = 7,500 req/day total
GEMINI_API_KEY=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...
GEMINI_API_KEY_4=AIzaSy...
GEMINI_API_KEY_5=AIzaSy...

# Groq — up to 5 keys, 14,400 req/day each = 72,000 req/day total
GROQ_API_KEY=gsk_...
GROQ_API_KEY_2=gsk_...
GROQ_API_KEY_3=gsk_...
GROQ_API_KEY_4=gsk_...
GROQ_API_KEY_5=gsk_...
```

### Routing logic

```
Request arrives at POST /api/ai-chat
  │
  ├─ Try Gemini keys one by one
  │    If key returns 429 (quota exceeded) → try next key
  │    If key returns success → return response ✓
  │    If all keys exhausted → fall through to Groq
  │
  └─ Try Groq keys one by one
       If all exhausted → return 503 "AI temporarily unavailable"
```

### System prompt

The AI is given a system prompt that makes it an expert on Fonlok specifically —
it knows the fee structure, how escrow works, how to create invoices, and how
to contact support. This prevents it from giving irrelevant general answers.

---

## 30. Process Management — PM2 (`backend/ecosystem.config.cjs`)

PM2 is used in production to keep the backend alive, auto-restart on crash, and
utilise all CPU cores.

### Commands

```bash
# Start in production mode
npm run start:prod
# equivalent to: pm2 start ecosystem.config.cjs --env production

# View live logs
npm run logs
# equivalent to: pm2 logs fonlok-backend

# Stop gracefully (waits 10 s for in-flight requests)
npm run stop
# equivalent to: pm2 stop fonlok-backend

# Restart (rolling — zero downtime in cluster mode)
pm2 restart fonlok-backend

# Live CPU/memory dashboard
pm2 monit

# Persist PM2 config so it survives a server reboot
pm2 save
pm2 startup  # generates the system startup command — run the outputted command
```

### Key configuration

| Setting              | Value         | Explanation                                   |
|----------------------|---------------|-----------------------------------------------|
| `instances`          | `"max"`       | One worker per CPU core (cluster mode)        |
| `exec_mode`          | `"cluster"`   | Load-balanced across workers                  |
| `max_memory_restart` | `512M`        | Restart worker if it uses more than 512 MB    |
| `kill_timeout`       | `10000 ms`    | Wait 10 s for in-flight requests before SIGKILL |
| `max_restarts`       | `10`          | Stop retrying after 10 consecutive crashes    |
| `min_uptime`         | `5s`          | Crash within 5 s counts as a failed start     |
| `autorestart`        | `true`        | Automatically restart on any crash            |

> **Note:** `instances: "max"` means multiple processes share the same port via
> Node.js cluster. If you ever add in-memory state (e.g. WebSocket rooms),
> switch to `instances: 1` or add a Redis adapter.

---

## 31. Service Worker (`frontend/public/sw.js`)

The Service Worker enables PWA offline support and handles push notifications.

### Caching strategy

- **App shell** (HTML, CSS, JS bundles) → Cache First with network fallback
- **API calls** → Network First (never serves stale API data from cache)
- **Images** → Cache First with 7-day expiry
- **Offline fallback** → If the network fails and the page isn't cached,
  the SW serves `/offline`

### Push notification handling

When the backend sends a push via `notifyUser()`, the SW:
1. Receives the `push` event
2. Parses the JSON payload `{ title, body, type, data }`
3. Displays a system notification with the Fonlok icon
4. On notification click → opens/focuses the app and navigates to the
   relevant page (e.g. the invoice that was just paid)

### Updating the Service Worker

When you deploy a new version:
1. The browser checks `/sw.js` on every page load (no-cache header is set)
2. If changed, the new SW installs in the background
3. On next browser close/reopen, the new SW activates and takes control
4. Old caches are cleaned up automatically

---

## 32. i18n Routing Details (`frontend/i18n/`)

### `i18n/request.ts` — Locale detection

On every server request, the locale is determined in this priority order:

1. **Cookie** — `NEXT_LOCALE` cookie set when the user clicks the language
   switcher in the Navbar. Persists across sessions.
2. **`Accept-Language` header** — Browser's preferred language. French (`fr`)
   is preferred if the header starts with `fr`. Otherwise defaults to English.

### `i18n/routing.ts` — Route config

```typescript
{
  locales: ["en", "fr"],
  defaultLocale: "en",
  localePrefix: "as-needed"
  // "as-needed" means:
  //   /dashboard         → English (default, no prefix)
  //   /fr/dashboard      → French
}
```

### Switching language

The Navbar has a globe icon button. Clicking it:
1. Sets the `NEXT_LOCALE` cookie to `"fr"` or `"en"`
2. Reloads the page → `request.ts` reads the cookie → serves the new locale

---

## 33. Backend Brand Configuration (`backend/src/config/brand.js`)

The backend has its own brand config that mirrors the frontend's. Used in emails,
logs, and API responses.

```javascript
import { BRAND } from "../config/brand.js";

// In email templates:
sgMail.send({
  from: BRAND.supportEmail,  // "support@fonlok.com"
  subject: `Your ${BRAND.name} receipt`,
});
```

### Key difference from frontend brand config

The backend `BRAND.siteUrl` is driven by the `FRONTEND_URL` environment variable:

```env
FRONTEND_URL=https://fonlok.com
```

This means all email links (invoice links, receipt links, password reset links)
automatically point to the correct URL in every environment — no hardcoded URLs
in email templates. Add this to your backend `.env`.

---

## 34. Complete Environment Variables Reference

### Backend `.env` — Updated complete list

```env
# ── Server ────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── Frontend URL (used in email links and backend brand config) ───────
FRONTEND_URL=https://fonlok.com

# ── CORS ─────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000

# ── PostgreSQL ────────────────────────────────────────────────────────
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fonlok

# ── JWT ───────────────────────────────────────────────────────────────
JWT_SECRET=your_long_random_jwt_secret
ADMIN_JWT_SECRET=your_long_random_admin_jwt_secret

# ── Admin accounts ────────────────────────────────────────────────────
ADMIN_EMAILS=admin@example.com,another@example.com

# ── Cloudinary ────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── SendGrid ──────────────────────────────────────────────────────────
SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM_EMAIL=noreply@fonlok.com

# ── Campay (Mobile Money) ─────────────────────────────────────────────
CAMPAY_USERNAME=your_username
CAMPAY_PASSWORD=your_password
CAMPAY_BASE_URL=https://demo.campay.net/api   # demo
# CAMPAY_BASE_URL=https://campay.net/api      # production

# ── Web Push VAPID ────────────────────────────────────────────────────
# Generate once: node backend/generate-vapid-keys.mjs
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=support@fonlok.com   # contact email shown in VAPID header

# ── Gemini AI (primary AI provider) ──────────────────────────────────
# Up to 5 keys from different Google Cloud projects (1,500 req/day each)
GEMINI_API_KEY=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...
GEMINI_API_KEY_4=AIzaSy...
GEMINI_API_KEY_5=AIzaSy...

# ── Groq AI (fallback AI provider) ───────────────────────────────────
# Up to 5 keys (14,400 req/day each)
GROQ_API_KEY=gsk_...
GROQ_API_KEY_2=gsk_...
GROQ_API_KEY_3=gsk_...
GROQ_API_KEY_4=gsk_...
GROQ_API_KEY_5=gsk_...
```

---

## 35. Component Deep Dive

### `Navbar.tsx`

The top navigation bar. Handles:
- Authenticated state (shows dashboard/logout links when logged in, login/register when not)
- Mobile hamburger menu with animated slide-in drawer
- Glass morphism scroll effect (subtle blur + opacity change on scroll)
- Language switcher (EN/FR) using `next-intl` + cookie
- Haptic feedback on all interactive elements
- Active route highlighting
- Notification bell (uses `useNotifications` hook)

**State managed:** `menuOpen`, `scrolled`

**Auth source:** `useAuth()` hook from `UserContext.tsx`

---

### `EscrowBalance.tsx`

Displays the seller's total pending escrow balance — the sum of all their `paid`
invoices that haven't been released yet.

Fetches from the backend on mount. Shown at the top of the seller dashboard.

---

### `CreateInvoice.tsx`

The invoice creation form. Supports:
- Basic invoice (single payment): name, description, amount, currency, client email, expiry
- Milestone/installment invoice: add multiple milestones each with their own
  label and amount
- Invoice templates: save/load from previously saved templates
- `onCreated` callback prop — called after successful creation so the dashboard
  can refresh the invoice list and switch to the invoices tab

---

### `GetAllInvoices.tsx`

Renders the seller's invoice list with:
- Status badges (`pending`, `paid`, `delivered`, `completed`, `expired`, `disputed`)
- Action buttons per invoice (edit, delete, mark delivered, download receipt, open chat)
- Registers a `setRefreshCallback` so the parent dashboard can trigger a refresh
  after creating a new invoice
- Accepts a `onRefreshStart` / `onRefreshEnd` to show the dashboard's loading spinner

---

### `FilterInvoice.tsx`

Search and filter the invoice list by:
- Status (all, pending, paid, delivered, completed, expired)
- Date range (from / to)
- Free-text keyword (matches invoice name, number, client email)

---

### `RevenueStats.tsx`

Shows aggregate revenue metrics for the seller:
- Total earned (sum of completed payouts)
- Pending escrow (sum of paid-but-not-released invoices)
- Total invoices created
- Completion rate

---

### `ChatWindow.tsx`

Inline seller chat widget embedded within invoice management pages. Features:
- 16rem scrollable message area with `overflowX: hidden`
- Word-break and overflow-wrap on message bubbles (prevents long URLs stretching layout)
- `<textarea>` input with `maxLength={1500}` and live character counter
  (counter turns amber at 1,200, red at 1,500)
- Image/file attachment button (uploads to Cloudinary `fonlok/chat`)
- Messages poll every 5 seconds

---

### `AiChatWidget.tsx` + `AiChatWidgetWrapper.tsx`

Floating AI assistant available on all authenticated pages. `AiChatWidget.tsx`
contains the full chat logic. `AiChatWidgetWrapper.tsx` is a thin client-only
wrapper (`"use client"`) that prevents server-side hydration errors since the
widget uses browser APIs.

Features:
- Collapsed bubble (bottom-right corner) / expanded chat panel
- Calls `POST /api/ai-chat`
- Markdown-like message rendering
- Rate-limited (30 messages/hour per IP)

---

### `NotificationBell.tsx`

Bell icon in the Navbar with:
- Red badge showing unread count
- Dropdown panel with notification list
- Click notification → marks it read + navigates to relevant page
- "Mark all as read" button

Uses `useNotifications()` hook internally.

---

### `clientPay.tsx`

The buyer-facing payment form on the invoice page. Collects:
- Buyer's MoMo phone number (Cameroonian format)
- Buyer's email address (for receipt + chat token)

On submit → calls `POST /api/requestPayment` → Campay initiates USSD push →
buyer confirms on their phone → webhook fires.

---

### `DisputeButton.tsx`

Shown on paid invoices. Allows the buyer to open a formal dispute if the seller
has not delivered. Calls `POST /dispute/open/:invoice_number`.

---

### `BenefitsSlider.tsx`

Auto-scrolling carousel on the homepage showing Fonlok's key selling points
(security, mobile money, zero buyer account needed, etc.).

---

### `CookieConsent.tsx`

GDPR-compliant cookie consent banner. Shown on first visit. Accepts/declines
cookies. Decision stored in `localStorage`. Does not block any functionality —
Fonlok does not use tracking cookies.

---

### `LayoutShell.tsx`

Wraps every page. Renders the `<Navbar>` at the top and the `<Footer>` at the
bottom. Also conditionally renders the `<AiChatWidgetWrapper>`.

Import chain:
```
layout.tsx → AuthProvider + LayoutShell → Navbar + (page content) + Footer
```

---

### `Spinner.tsx`

Exports `<InlineSpinner />` — a small animated spinner used inside buttons and
loading states throughout the app.

---

### `FonlokLogo.tsx`

SVG logo component. Renders the Fonlok icon (navy rectangle with amber + white
geometric shapes). Used in the Navbar and email templates.

---

### `PwaRegister.tsx`

Calls `navigator.serviceWorker.register('/sw.js')` on mount. A very small
client-side component that must be rendered in the root layout.

---

### `PwaInstallBanner.tsx`

Listens for the `beforeinstallprompt` browser event and shows a custom
"Add to Home Screen" banner (matching the brand design) instead of the browser's
default prompt.

---

## 36. All Frontend Pages — Detailed Reference

### Admin pages (`/admin/*`)

#### `/admin/login`
Separate login form for admin accounts. Uses `ADMIN_JWT_SECRET`. Only accounts
whose email is in the `ADMIN_EMAILS` env var can log in. The admin JWT is stored
separately from the user JWT.

#### `/admin/dashboard`
The admin control panel. Sections:
- **Overview** — Platform-wide stats (total users, invoices, revenue)
- **Platform controls** — Toggle maintenance mode, payments, payouts in real time
- **Users** — Search and view any user account, adjust wallet balance
- **Invoices** — View and override status of any invoice
- **Disputes** — List all open disputes, mark as resolved
- **Broadcast** — Send email to all users or a specific user
- **Balance adjustments** — Manually credit/debit a user's wallet with reason + audit trail

---

### Seller pages (require login)

#### `/dashboard`
Main seller workspace. Contains:
- Amber ⚠️ notice banner (shown when payments are suspended — toggleable via admin)
- `EscrowBalance` — live pending escrow total
- `CreateInvoice` — invoice creation form
- Four-tab workspace: Invoices / Filter / Payment / Stats
- Profile navigation button (top-right, loads `/profile/:username`)

#### `/dashboard/chat/[invoice_number]`
Full-page chat for a specific invoice. Seller-only. Features:
- Full-height message history with overflow protection
- Textarea input (max 1,500 chars) with character counter
- File/image attachment (Cloudinary)
- Auto-scroll to latest message

#### `/transactions`
Table of all completed/paid invoices with amounts, buyer info, timestamps, and
PDF receipt download links.

#### `/purchases`
Shows invoices where the logged-in user's email was on the `guests` table —
i.e., past purchases they made as a buyer.

#### `/referral`
Shows the seller's:
- Unique referral code (e.g. `X7K2MN`)
- Shareable referral link (`https://fonlok.com/register?ref=X7K2MN`)
- Number of people referred
- Total commission earned (percentage of each referred user's transaction fee)
- QR code for the referral link

#### `/settings`
Account self-management. Sections:
- Change name
- Change email
- Change MoMo/payout phone number
- Change password (requires entering current password)
- Upload new profile picture (→ Cloudinary)
- Delete account (permanently removes all data — requires password confirmation)

---

### Public seller pages

#### `/profile/[username]`
Public seller profile. Shows:
- Profile picture, name, username, country
- Member since date
- Completed transactions count
- Average star rating (1–5 from buyer reviews)
- All reviews with reviewer name, rating, comment, date
- Recent completed invoices (name, amount, delivery date)

Useful for buyers to vet a seller before making a payment.

---

### Buyer pages (no account needed)

#### `/invoice/[invoice_number]`
The buyer's entry point. Shows:
- Invoice name, description, amount
- Seller info (profile picture, name, username, rating)
- Itemised amount breakdown with Fonlok 2% fee
- Milestone table if `payment_type = "installment"`
- Payment form (`clientPay.tsx`): phone + email
- Dispute button (shown if invoice is `paid` and not yet `delivered`)

#### `/chat/[invoice_number]?token=<token>&invoice=<number>`
Buyer chat. After paying, the buyer receives an email link containing a unique
`chat_token`. This page validates the token against the `guests` table and loads
the conversation. No Fonlok account required.

#### `/payment-pending`
Post-payment waiting screen. Shown after the buyer submits their phone number.
Polls `GET /invoice/:invoice_number` every few seconds. When the status
changes from `pending` to `paid`, it shows a success message.

---

### Utility pages

#### `/maintenance`
Shown when `maintenance_mode = true` in `platform_settings`. The `UserContext`
global Axios interceptor detects any HTTP 503 response with `maintenanceMode: true`
and redirects to this page automatically.

#### `/offline`
PWA offline fallback. Served by the Service Worker when the user is offline and
tries to navigate to a page that isn't in the cache.

#### `/verify`
Handles the email verification link. Token is passed as a URL query parameter.

#### `/forgot-password`
Single email input form. Calls `POST /auth/forgot-password`. Sends a SendGrid
email with a password reset link valid for a limited time window.

#### `/reset-password`
Form for entering a new password. The reset token is in the URL. Calls
`POST /auth/reset-password`.

---

## 37. Database Tables — Full Reference

### `users`
| Column           | Type           | Constraints              | Notes                     |
|------------------|----------------|--------------------------|---------------------------|
| id               | SERIAL         | PRIMARY KEY              |                           |
| name             | TEXT           | NOT NULL                 | Full display name         |
| email            | TEXT           | UNIQUE, NOT NULL         | Lowercase, normalised     |
| username         | TEXT           | UNIQUE, NOT NULL         | Alphanumeric + underscore |
| phone            | TEXT           | NOT NULL                 | `237XXXXXXXXX` format     |
| password         | TEXT           | NOT NULL                 | bcrypt hash               |
| dob              | DATE           |                          | Must be 18+               |
| country          | TEXT           |                          |                           |
| profilepicture   | TEXT           |                          | Full Cloudinary HTTPS URL |
| referral_code    | VARCHAR(12)    | UNIQUE                   | Auto-generated 6-char     |
| referred_by      | INTEGER        | FK → users.id            | Referrer's user ID        |
| wallet_balance   | NUMERIC(12,2)  | DEFAULT 0                | Admin-credited MoMo refunds |
| createdat        | TIMESTAMPTZ    | DEFAULT NOW()            |                           |

### `invoices`
| Column          | Type          | Notes                                         |
|-----------------|---------------|-----------------------------------------------|
| id              | SERIAL PK     |                                               |
| userid          | INTEGER       | FK → users.id (seller)                        |
| invoicenumber   | TEXT          | Unique human-readable ID (e.g. INV-00123)     |
| invoicename     | TEXT          | Invoice title                                 |
| description     | TEXT          | What the seller is selling                    |
| amount          | NUMERIC       | In XAF (CFA francs)                           |
| currency        | TEXT          | Always XAF for now                            |
| clientemail     | TEXT          | Buyer's email                                 |
| status          | TEXT          | pending → paid → delivered → completed / expired / disputed |
| payment_type    | TEXT          | `single` or `installment`                     |
| expiry_date     | TIMESTAMPTZ   | Invoice expiry (buyer must pay before this)   |
| createdat       | TIMESTAMPTZ   | DEFAULT NOW()                                 |
| delivered_at    | TIMESTAMPTZ   | When seller marked as delivered               |

### `guests`
Buyers do not need a Fonlok account. Each payment attempt creates a `guests` row.

| Column          | Type     | Notes                                             |
|-----------------|----------|---------------------------------------------------|
| id              | SERIAL PK|                                                   |
| invoicenumber   | TEXT     | FK-like reference to invoices.invoicenumber       |
| email           | TEXT     | Buyer's email                                     |
| momo_number     | TEXT     | Buyer's phone (used for MoMo payment)             |
| chat_token      | TEXT     | Unique token for buyer chat access                |
| payment_uuid    | TEXT     | Campay payment UUID                               |
| user_id         | INTEGER  | FK → users.id (if buyer has a Fonlok account)     |
| registered_userid| INTEGER | Set when a guest later registers an account       |
| created_at      | TIMESTAMPTZ | DEFAULT NOW()                                  |

### `chat_messages`
| Column          | Type     | Notes                                             |
|-----------------|----------|---------------------------------------------------|
| id              | SERIAL PK|                                                   |
| invoicenumber   | TEXT     | Which invoice this message belongs to              |
| sender_type     | TEXT     | `seller` or `buyer`                               |
| message         | TEXT     | Text content (may be null if attachment-only)     |
| attachment_url  | TEXT     | Cloudinary URL of attached image/file             |
| attachment_name | TEXT     | Original filename of attachment                   |
| created_at      | TIMESTAMPTZ | DEFAULT NOW()                                  |

### `reviews`
| Column          | Type     | Notes                                             |
|-----------------|----------|---------------------------------------------------|
| id              | SERIAL PK|                                                   |
| reviewer_userid | INTEGER  | FK → users.id                                     |
| seller_userid   | INTEGER  | FK → users.id                                     |
| invoice_number  | TEXT     | The invoice the review is for                     |
| rating          | INTEGER  | 1–5                                               |
| comment         | TEXT     | Optional free-text (max 1,000 chars)              |
| created_at      | TIMESTAMPTZ | DEFAULT NOW()                                  |

### `payouts`
| Column          | Type          | Notes                                         |
|-----------------|---------------|-----------------------------------------------|
| id              | SERIAL PK     |                                               |
| userid          | INTEGER       | FK → users.id (recipient seller)              |
| amount          | NUMERIC(12,2) | Net amount paid out (after 2% fee)            |
| phone           | TEXT          | MoMo number funds were sent to                |
| reference       | TEXT          | Campay payout reference                       |
| invoice_id      | INTEGER       | FK → invoices.id                              |
| invoice_number  | TEXT          | Human-readable invoice number                 |
| created_at      | TIMESTAMPTZ   | DEFAULT NOW()                                 |

### `referral_earnings`
| Column          | Type          | Notes                                         |
|-----------------|---------------|-----------------------------------------------|
| id              | SERIAL PK     |                                               |
| referrer_id     | INTEGER       | FK → users.id (who gets the commission)       |
| referred_id     | INTEGER       | FK → users.id (who was referred)              |
| invoice_number  | TEXT          | UNIQUE — prevents double-crediting            |
| amount          | NUMERIC       | Commission amount                             |
| created_at      | TIMESTAMPTZ   | DEFAULT NOW()                                 |

### `platform_settings`
| Column    | Type          | Notes                                              |
|-----------|---------------|----------------------------------------------------|
| key       | VARCHAR(100)  | PRIMARY KEY                                        |
| value     | TEXT          | `'true'` or `'false'`                              |
| updated_at| TIMESTAMPTZ   | DEFAULT NOW()                                      |

### `processed_payments`
| Column        | Type        | Notes                                            |
|---------------|-------------|--------------------------------------------------|
| payment_uuid  | TEXT        | PRIMARY KEY — ensures webhook idempotency        |
| processed_at  | TIMESTAMPTZ | DEFAULT NOW()                                    |

### `notifications`
| Column   | Type        | Notes                                               |
|----------|-------------|-----------------------------------------------------|
| id       | SERIAL PK   |                                                     |
| userid   | INTEGER     | FK → users.id (recipient)                           |
| type     | TEXT        | Notification type (see Section 27)                  |
| title    | TEXT        |                                                     |
| body     | TEXT        |                                                     |
| data     | JSONB       | Extra context (invoiceNumber, amount, etc.)         |
| is_read  | BOOLEAN     | DEFAULT false                                       |
| created_at | TIMESTAMPTZ | DEFAULT NOW()                                    |

### `push_subscriptions`
| Column       | Type    | Notes                                              |
|--------------|---------|----------------------------------------------------|
| id           | SERIAL PK|                                                   |
| userid       | INTEGER | FK → users.id                                      |
| subscription | JSONB   | Full browser PushSubscription object               |
| created_at   | TIMESTAMPTZ | DEFAULT NOW()                                  |

### `invoice_milestones`
| Column           | Type         | Notes                                     |
|------------------|--------------|-------------------------------------------|
| id               | SERIAL PK    |                                           |
| invoice_id       | INTEGER      | FK → invoices.id                          |
| milestone_number | INTEGER      | Order within the invoice (1, 2, 3...)     |
| label            | TEXT         | Description of this milestone             |
| amount           | NUMERIC      | Amount released when this milestone is done|
| status           | TEXT         | `pending` → `completed` → `released`     |
| release_token    | TEXT         | UNIQUE token for the release email link   |

### `invoice_templates`
| Column      | Type        | Notes                                            |
|-------------|-------------|--------------------------------------------------|
| id          | SERIAL PK   |                                                  |
| userid      | INTEGER     | FK → users.id                                    |
| name        | TEXT        | Template display name                            |
| data        | JSONB       | Invoice fields saved as JSON                     |
| created_at  | TIMESTAMPTZ | DEFAULT NOW()                                    |

### `invoice_reminders` (scheduled jobs tracking)
| Column          | Type        | Notes                                        |
|-----------------|-------------|----------------------------------------------|
| id              | SERIAL PK   |                                              |
| invoicenumber   | TEXT        |                                              |
| reminder_level  | INTEGER     | 1, 2, or 3 (24h, 48h, 72h)                  |
| sent_at         | TIMESTAMPTZ | DEFAULT NOW()                                |
| UNIQUE          |             | (invoicenumber, reminder_level)              |

### `dispute_escalations` (scheduled jobs tracking)
| Column        | Type        | Notes                                          |
|---------------|-------------|------------------------------------------------|
| id            | SERIAL PK   |                                                |
| invoicenumber | TEXT        |                                                |
| level         | INTEGER     | 1 = 72h warning, 2 = 7-day escalation          |
| sent_at       | TIMESTAMPTZ | DEFAULT NOW()                                  |
| UNIQUE        |             | (invoicenumber, level)                         |

### `admin_broadcasts`
| Column            | Type       | Notes                                       |
|-------------------|------------|---------------------------------------------|
| id                | SERIAL PK  |                                             |
| recipient_type    | VARCHAR(10)| `all` or `single`                           |
| recipient_user_id | INTEGER    | FK → users.id (nullable for broadcast-all)  |
| recipient_email   | TEXT       |                                             |
| subject           | TEXT       |                                             |
| body              | TEXT       |                                             |
| recipients_count  | INTEGER    |                                             |
| sent_at           | TIMESTAMPTZ| DEFAULT NOW()                               |

### `balance_adjustments`
| Column      | Type         | Notes                                          |
|-------------|--------------|------------------------------------------------|
| id          | SERIAL PK    |                                                |
| admin_email | VARCHAR(255) | Which admin performed the adjustment           |
| user_id     | INTEGER      | FK → users.id (affected user)                  |
| amount      | NUMERIC(12,2)|                                                |
| type        | VARCHAR(10)  | `credit` or `debit`                            |
| reason      | TEXT         | Required explanation for audit trail           |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()                                  |

---

*Documentation last updated: March 2026. Covers Fonlok v1 complete codebase.*


---

## 38. Development & Maintenance Utility Scripts

These scripts exist in the project root and were used (and may be reused) during active development to perform one-off surgical fixes. They are **not part of the production build** but are committed to the repo for audit and reproducibility.

| File | Language | Purpose |
|---|---|---|
| `fix_banner.py` | Python | Byte-level restore of the amber ⚠️ notice banner above `EscrowBalance` in `dashboard/page.tsx` after an accidental VS Code overwrite. Uses raw byte replacement to avoid UTF-8 encoding corruption in that file. |
| `fix_encoding.py` | Python | Replaces non-ASCII typographic characters (en-dashes `–`, em-dashes `—`) with ASCII-safe equivalents in backend email/notification strings. Applied to `payout.js` and others. |
| `fix_glass.py` | Python | Diagnostic script — reads `NotificationBell.tsx` and prints lines containing `panelWidth`, `rightEdge`, or `On narrow` to locate glass-effect positioning code. No writes. |
| `fix_navbar.js` | JavaScript (Node) | One-off patch script for `Navbar.tsx`: adjusts glass-scroll opacity/blur values, makes the inner container `position: relative`, removes `NotificationBell` from right mobile cluster, and re-inserts a centred bell using absolute positioning. |
| `fix_notif.mjs` | ESM JavaScript (Node) | Patches lines 186–195 of `NotificationBell.tsx` to add mobile-first panel overflow protection: panels on screens ≤640 px use `left: 8px; right: 8px; width: auto`; wider screens use the bell-aligned right-offset calculation. |
| `nav_fix.py` | Python | Python port of `fix_navbar.js` — applies the same glass opacity/blur/border and `position: relative` fixes to `Navbar.tsx` via string replacement. |
| `nav_fix2.py` | Python | Follow-up to `nav_fix.py` — removes a duplicated `position: relative` attribute, removes the bell from the right mobile controls cluster if still present, and inserts a centred mobile bell using absolute positioning before the desktop links block. |
| `strip_nav.ps1` | PowerShell | Bulk removes `import Navbar`, `import SiteFooter`, `<Navbar />`, and `<SiteFooter />` lines from 17 page files when the layout was refactored to render those components via `LayoutShell` instead. Uses a regex pattern and `[System.IO.File]::WriteAllLines` with UTF-8-no-BOM encoding. |
| `swap_hero.py` | Python | Replaces the `HeroIllustration` function in `app/page.tsx` with a new premium SVG phone mockup (321 lines). Removes old placeholder, injects new `<svg>` with gradients, shadow glows, and a status-bar UI. |
| `test_gemini.mjs` | ESM JavaScript (Node) | Manual connectivity test for the Gemini AI API — sends a single "hello" message using `GEMINI_API_KEY_1` and logs the response. Used to verify API key validity. |
| `write_readme.py` | Python | Generator script that originally wrote the initial `README.md` content. Now superseded; kept for history. |
| `Navbar_backup.tsx` | TypeScript/TSX | Backup snapshot of `Navbar.tsx` taken before refactoring. Used as a restoration reference if the live file is corrupted or truncated. |
| `audit_readme.py` | Python | Scans `README.md` for mentions of all known source files and reports any that are missing. Used to verify documentation completeness. |

> **Note:** These scripts should not be deleted — they document the history of surgical fixes and can be re-run if the same issue recurs.

---

## 39. Backend Utility & Migration Scripts

### `backend/migrate_milestones.js`

**Run command:** `node migrate_milestones.js` (from `backend/` directory)  
**Safe:** Yes — uses `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` throughout; idempotent.

Adds installment/milestone payment support to the database schema. Operations performed:

1. **`invoices.payment_type`** — `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) NOT NULL DEFAULT 'full'`  
   Values: `'full'` (standard lump-sum) | `'milestone'` (split into phases)

2. **`milestones` table** — creates it if not present:
   ```sql
   CREATE TABLE IF NOT EXISTS milestones (
     id            SERIAL PRIMARY KEY,
     invoice_id    INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
     title         TEXT    NOT NULL,
     amount        NUMERIC(12,2) NOT NULL,
     status        VARCHAR(20) NOT NULL DEFAULT 'pending',
     due_date      DATE,
     paid_at       TIMESTAMPTZ,
     created_at    TIMESTAMPTZ DEFAULT NOW()
   )
   ```

3. Inserts any default platform settings rows (via `ON CONFLICT DO NOTHING`) to ensure `platform_settings` table is pre-populated.

**When to re-run:** After a fresh DB creation or when deploying to a new Railway environment.

---

### `backend/test-groq.mjs`

Manual integration test for the Groq AI fallback. Reads `GROQ_API_KEY` from `.env`, sends "hi" to `llama-3.3-70b-versatile`, and prints the HTTP status + response text or error object. Use this to verify a Groq key is active before adding it to `GROQ_API_KEY_1` through `GROQ_API_KEY_5`.

---

## 40. TypeScript & Linting Configuration

### `frontend/tsconfig.json`

| Option | Value | Notes |
|---|---|---|
| `target` | `ES2017` | Compiled JS target |
| `strict` | `true` | Full strict mode — no implicit `any`, no non-null skips |
| `noEmit` | `true` | Type-checking only; Next.js handles actual compilation |
| `module` / `moduleResolution` | `esnext` / `bundler` | Modern ESM + Turbopack-compatible resolution |
| `paths` | `@/*` → `./*` | Workspace-root alias — `@/app/...` resolves from `frontend/` |
| `incremental` | `true` | Caches type-check state in `.next/` for faster rebuilds |
| `plugins` | `["next"]` | Enables Next.js-specific TS diagnostics (Server/Client component rules) |
| `include` | `next-env.d.ts`, all `.ts`/`.tsx`/`.mts`, `.next/types/**` | |
| `exclude` | `node_modules` | |

### `frontend/eslint.config.mjs`

Uses ESLint flat config format (ESLint v9+). Extends two Next.js presets:
- `eslint-config-next/core-web-vitals` — Core Web Vitals rules (image optimisation, `<Link>` correctness, etc.)
- `eslint-config-next/typescript` — TypeScript-aware rules

Default ignores (`.next/`, `out/`, `build/`, `next-env.d.ts`) are preserved.  
Run: `npx eslint .` from `frontend/`.

### `frontend/next-env.d.ts`

Auto-generated by Next.js. Adds global TypeScript types for:
- `*.module.css` imports
- `next/image` and `next/link` overloads
- App Router specific types (`PageProps`, `LayoutProps`, etc.)

**Do not edit this file manually** — it is regenerated every `next dev`/`next build`.

---

## 41. Admin Section — Full Detail

### `frontend/app/admin/layout.tsx`

Sets `robots: { index: false, follow: false }` for the entire `/admin/*` subtree so search engines never index admin pages. Renders children with no additional wrapper HTML.

### `frontend/app/admin/login/page.tsx`

Simple PIN-based admin login page. Submits a hashed PIN to `POST /admin/login`. On success, stores the `admin_token` (a short-lived JWT with `role: "admin"`) in `localStorage` and redirects to `/admin/dashboard`.

### `frontend/app/admin/dashboard/page.tsx`

Full admin control panel. Authenticated via `admin_token` from localStorage, sent as `Authorization: Bearer <token>`. Features:

- **User management** — list all users, suspend/unsuspend accounts, view user details
- **Transaction overview** — list all escrow transactions with status filters
- **Platform toggles** — enable/disable registration, enable/disable payments, maintenance mode (calls `PATCH /admin/settings`)
- **Statistics** — total users, active invoices, revenue summaries

### `frontend/app/admin/dispute/[admin_token]/page.tsx`

682-line dispute resolution page. The `[admin_token]` segment is the JWT embedded directly in the dispute-resolution link that is emailed to the admin. This means no separate admin login is required to resolve a dispute — the link is self-authenticating (token expires after 24 hours).

Features:
- Fetches dispute details by token from `GET /dispute/admin/:admin_token`
- Displays: invoice details, buyer username, seller username, dispute reason, evidence files, timestamps
- Action buttons: **Release to Seller** (`POST /dispute/resolve/seller`) | **Refund Buyer** (`POST /dispute/resolve/buyer`)
- Each action sends the `admin_token` in the request body and updates the invoice status to `released` or `refunded`
- Uses `useTranslations("AdminDispute")` for i18n strings

---

## 42. Dashboard Sub-Files

### `frontend/app/dashboard/layout.tsx`

Sets `robots: { index: false, follow: false }` for the entire `/dashboard/*` subtree. Renders children with no additional wrapper.

### `frontend/app/dashboard/loading.tsx`

Next.js loading UI shown while `dashboard/page.tsx` is being streamed. Renders `<PageLoader message="Loading dashboard…" />` (the full-screen spinner from `Spinner.tsx`).

### `frontend/app/dashboard/chat/[invoice_number]/page.tsx`

Dashboard-namespaced chat route — renders the same `<ChatWindow />` component as the public `chat/[invoice_number]` route but within the authenticated dashboard layout. Exists so deep-links from the dashboard stay within the dashboard URL tree (`/dashboard/chat/INV-xxxx`).

---

## 43. Additional Components — Full Detail

### `HeroStatsTabs` (`frontend/app/components/HeroStatsTabs.tsx`)

**Props:** `{ tabs: StatTab[] }` where `StatTab = { value: string; label: string; detail: string }`

Renders a horizontal tab bar on the hero section of the landing page displaying live platform statistics (e.g. "XAF 12M+ secured", "4 200+ transactions"). Clicking a tab activates it with a primary-colour underline and swaps the visible detail text below. Uses inline styles + `var(--color-primary)` for theming.

Used in: `frontend/app/page.tsx` (landing page hero).

### `InvoiceTemplates` (`frontend/app/components/InvoiceTemplates.tsx`)

**Props:** `{ onLoadTemplate: (t: { invoicename, currency, amount, description }) => void }`

Allows sellers to save and reuse invoice configurations. Toggle button shows/hides the template list. On open, fetches templates from `GET /templates/:user_id`. Each template row shows name, amount, currency, and a **Load** button that calls `onLoadTemplate` to pre-fill the invoice creation form. Templates can be deleted via `DELETE /templates/:id`.

State: `templates`, `showTemplates`, `loading`, `error`, `deleteSuccess`

Used in: `frontend/app/components/createInvoice.tsx`.

### `SiteHeader` (`frontend/app/components/SiteHeader.tsx`)

383-line public-facing navigation bar used on all marketing/static pages (`/`, `/pricing`, `/faq`, `/how-it-works`, `/contact`, `/privacy`, `/terms`). Adapts based on auth state — shows **Login / Register** buttons for guests and a **Dashboard →** button for authenticated users. Handles mobile menu open/close. Distinct from `Navbar.tsx` which is used inside authenticated app pages.

### `SiteFooter` (`frontend/app/components/SiteFooter.tsx`)

263-line footer rendered on all public-facing pages via `LayoutShell`. Contains:
- Logo + tagline
- Navigation columns: Product, Company, Legal
- Social icons (Twitter/X, LinkedIn)
- Copyright line with current year
- Language switcher (EN ↔ FR) using next-intl locale routing

Started with a UTF-8 BOM (`\ufeff`) — handle with `encoding='utf-8-sig'` if reading in Python.

### `markDelivered` (`frontend/app/components/markDelivered.tsx`)

**Props:** `{ invoice_id: number; onDelivered: () => void }`

"Mark as Delivered" confirmation flow for sellers. Shows a modal asking for confirmation before calling `PATCH /invoice/mark-delivered/:invoice_id`. On success, calls `onDelivered()` to trigger a list refresh and shows a success toast for 6 seconds. On error, shows an error toast. Uses `useTranslations("MarkDelivered")`.

Used in: invoice detail pages where `seller_id === user_id`.

### `ContactForm` (`frontend/app/contact/ContactForm.tsx`)

Client-side contact form with three fields: name, email, message. On submit:
1. Attempts `POST /contact` to backend
2. If the backend call fails or endpoint is unavailable, falls back to `mailto:support@fonlok.com` with pre-filled subject/body
3. On success, renders a success alert (from `useTranslations("Contact.form")`)

Used by: `frontend/app/contact/page.tsx`.

### `FAQAccordion` (`frontend/app/faq/FAQAccordion.tsx`)

**Props:** `{ items: FAQItem[] }` where `FAQItem = { q: string; a: string }`

Accessible accordion component for the FAQ page. Only one item can be open at a time (`openIndex` state). Open items have a primary-colour border; closed items have the default `--color-border`. Uses `aria-expanded` on buttons and smooth height transitions. Renders items from i18n-translated strings passed by `faq/page.tsx`.

---
