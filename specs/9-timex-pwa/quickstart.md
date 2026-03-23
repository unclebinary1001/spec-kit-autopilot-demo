# TimeX PWA — Quickstart Guide

This guide walks through the minimal steps to set up, run, and manually verify the TimeX platform locally. All acceptance scenarios from `spec.md` map to a verification step below.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| pnpm | 9.x | Package manager (`npm install -g pnpm`) |
| Docker | any | Local RabbitMQ (optional — CloudAMQP URL works too) |
| Neon account | — | Hosted PostgreSQL with branching |
| AWS account | — | S3 bucket for file uploads |
| Resend account | — | Magic link email delivery |
| CloudAMQP account | — | RabbitMQ hosting |
| Intuit Developer account | — | QBO OAuth app credentials |

---

## 1. Clone and Install

```bash
git clone https://github.com/<org>/timex.git
cd timex
pnpm install
```

Expected: All workspace dependencies install with zero errors. `node_modules` present in repo root and all `apps/` and `packages/` directories.

---

## 2. Environment Variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Fill in all required values in `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/timex?sslmode=require

# Auth
JWT_SECRET=<generate: openssl rand -hex 32>
JWT_REFRESH_SECRET=<generate: openssl rand -hex 32>
MAGIC_LINK_SECRET=<generate: openssl rand -hex 32>

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=timex-files

# RabbitMQ
AMQP_URL=amqps://user:pass@lemur.rmq.cloudamqp.com/vhost

# QuickBooks Online
QBO_CLIENT_ID=ABCxyz...
QBO_CLIENT_SECRET=...
QBO_TOKEN_ENCRYPTION_KEY=<generate: openssl rand -hex 32>
QBO_REDIRECT_URI=http://localhost:3000/api/org/lets-thrive/admin/quickbooks/callback
QBO_ENVIRONMENT=sandbox

# New Relic (production only — leave empty for local dev)
NEW_RELIC_LICENSE_KEY=
NEW_RELIC_APP_NAME=timex-local

# App URLs
EMPLOYEE_APP_URL=http://localhost:5173
PORTAL_APP_URL=http://localhost:5174
API_URL=http://localhost:3000
```

---

## 3. Database Setup

```bash
pnpm db:reset
```

This command:
1. Runs all Drizzle migrations (`drizzle-kit migrate`)
2. Enables `btree_gist` extension (required for pay period exclusion constraint)
3. Applies RLS policies via raw SQL migration
4. Seeds the Let's Thrive tenant and 4 users

Expected output:
```
✓ Migrations applied (13 tables created)
✓ RLS policies applied
✓ Seeded tenant: Let's Thrive (lets-thrive)
✓ Seeded users:
    admin@letsthrive.com     (admin)
    manager@letsthrive.com   (manager)
    employee1@letsthrive.com (employee)
    employee2@letsthrive.com (employee)
✓ Seeded pay period: 2026-03-01 → 2026-03-31
✓ Seeded clients: Maria Santos, Robert Chen, Grace Williams
```

---

## 4. Start All Apps

```bash
pnpm dev
```

This starts all three apps concurrently via Nx:

| App | URL | Description |
|---|---|---|
| Employee PWA | http://localhost:5173/org/lets-thrive/ | Field employee interface |
| Admin Portal | http://localhost:5174/org/lets-thrive/admin/ | Manager/admin interface |
| Hono API | http://localhost:3000 | REST API |

Expected: All three processes start without errors. Vite dev proxy routes `/api/*` from both frontends to port 3000.

---

## 5. Verification Steps (by User Story)

### US1 — Magic Link Login

1. Open http://localhost:5173/org/lets-thrive/
2. Enter `employee1@letsthrive.com`
3. Check your configured Resend account for the magic link email (or check Resend logs)
4. Click the link in the email
5. **Expected**: Redirected to the employee dashboard; user name shown in nav

**Alternatively (no email setup):** Query the database for the magic link token:
```sql
SELECT token FROM magic_link_tokens WHERE email = 'employee1@letsthrive.com' ORDER BY created_at DESC LIMIT 1;
```
Then navigate to: `http://localhost:3000/api/auth/verify?token=<token>`

---

### US2 — Password Login

1. Open http://localhost:5173/org/lets-thrive/
2. Click "Sign in with password" (fallback link)
3. Enter `employee1@letsthrive.com` / `password123` (seed password)
4. **Expected**: Logged in, redirected to employee dashboard

---

### US3 — Create and Submit Timesheet

1. Log in as `employee1@letsthrive.com`
2. Navigate to **Timesheets** → **New Timesheet**
3. Confirm the current pay period is pre-selected
4. Add an entry: today's date, client "Maria Santos", service type "Personal Care", 4.0 hours
5. Click **Submit**
6. **Expected**: Timesheet status shows `Submitted`; employee sees confirmation

Verify via API:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/org/lets-thrive/timesheets
```

---

### US4 — Manager Approves Timesheet

1. Log in as `manager@letsthrive.com` at http://localhost:5174/org/lets-thrive/admin/
2. Navigate to **Timesheets → Approval Queue**
3. Find employee1's submitted timesheet
4. Click **Approve**
5. **Expected**: Status changes to `Approved`; a RabbitMQ message is enqueued

Check RabbitMQ management UI (CloudAMQP or local Docker) for message in `timex.qbo-sync` queue.

---

### US5 — Create Expense with Receipt

1. Log in as `employee1@letsthrive.com`
2. Navigate to **Expenses** → **New Expense**
3. Fill in: merchant "CVS", category "Supplies", amount 12.50, today's date
4. Tap **Upload Receipt** and select a photo
5. Click **Submit**
6. **Expected**: Expense status shows `Submitted`; receipt thumbnail visible

Verify the S3 key was stored:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/org/lets-thrive/expenses
# receiptKey should be non-null
```

---

### US6 — Connect QuickBooks Online

1. Log in as `admin@letsthrive.com` at the Admin Portal
2. Navigate to **Settings → QuickBooks**
3. Click **Connect to QuickBooks**
4. **Expected**: Redirected to Intuit Sandbox authorization page
5. Complete authorization (use QBO sandbox credentials)
6. **Expected**: Redirected back to portal with "Connected" status and realm ID displayed

---

### US7 — QBO Sync (requires US4 + US6)

1. Start the sync worker: `pnpm worker:qbo`
2. Ensure a timesheet has status `qbo_approved`
3. **Expected**: Worker logs show sync in progress; timesheet status updates to `qbo_synced`

Verify in QBO sandbox: log in to https://sandbox.qbo.intuit.com and check Time Activities.

---

### US8 — PWA Install

1. Open http://localhost:5173/org/lets-thrive/ in Chrome on Android (or Chrome Dev Tools with mobile emulation)
2. First visit: close and reopen (second visit triggers install prompt)
3. **Expected**: Custom install banner appears with "Let's Thrive" name and brand color
4. Tap **Install**
5. **Expected**: App icon appears on home screen with "Let's Thrive" label

Offline test:
1. Open DevTools → Network → Offline
2. Reload the PWA
3. **Expected**: Cached shell loads; "You are offline" banner shown

---

### US9 — Push Notifications

1. Log in as `employee1@letsthrive.com`
2. Allow notifications when prompted (or click "Enable notifications" in the profile page)
3. In another browser/tab, log in as `manager@letsthrive.com` and approve employee1's timesheet
4. **Expected**: A push notification appears on the employee's device within 60 seconds

---

### US10 — Admin Dashboard

1. Log in as `admin@letsthrive.com` at the Admin Portal
2. Navigate to **Dashboard**
3. **Expected**: Shows pending timesheet count (should be 0 after approvals above), open expense count, and current pay period dates

---

## 6. Tenant Isolation Check

```bash
# Log in as tenant A user (lets-thrive)
TOKEN_A=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee1@letsthrive.com","password":"password123","slug":"lets-thrive"}' \
  | jq -r '.accessToken')

# Attempt to access a different tenant's data (create a second test tenant first)
curl -H "Authorization: Bearer $TOKEN_A" \
  http://localhost:3000/api/org/other-tenant/timesheets
# Expected: 403 Forbidden
```

---

## 7. Run All Tests

```bash
# Unit + integration tests
pnpm test

# E2E tests (requires all 3 apps running)
pnpm dev &
pnpm e2e

# Expected: All Playwright suites pass (auth, timesheets, expenses, approval, branding, tenant-isolation)
```

---

## 8. Build Check

```bash
pnpm build
# Expected: All 3 apps build successfully with no TypeScript errors
```

---

## 9. Lint

```bash
pnpm lint
# Expected: Zero errors, zero warnings
```
