# TimeX PWA — Feature Specification

## Clarifications

The following ambiguities were identified in the issue and resolved with explicit decisions before planning:

1. **Magic link delivery mechanism**: The issue names Resend as the email provider. **Decision**: Use Resend's Node.js SDK for magic link email delivery in the Hono API.

2. **Tenant switching UX**: The issue mentions multi-tenant users see a "tenant picker". **Decision**: Implemented as a modal after successful login when `tenant_ids.length > 1`; re-issues a new JWT with the selected `active_tenant_id`.

3. **PWA push notification scope**: The issue mentions "timesheet status changes". **Decision**: Push notifications are sent on `app_submitted → qbo_approved`, `app_submitted → rejected`, and `qbo_approved → qbo_synced` transitions only (employee-facing). Manager/admin notifications are in-app only for MVP.

4. **QBO sync granularity**: The issue says "sync timesheet entries to QBO". **Decision**: Each approved `timesheet_entry` is synced as a QBO Time Activity. The `qbo_customer_id` on `clients` is the QBO Customer reference.

5. **Offline behaviour**: The issue says "API calls queue or fail gracefully". **Decision**: For MVP, API calls fail gracefully with a user-visible "You are offline" toast. Queuing (write-behind sync) is deferred to a future phase.

6. **Dynamic manifest per tenant**: The issue says "tenant name and brand color". **Decision**: The manifest is served dynamically by the Hono API at `/api/org/:slug/manifest.json`; it includes `name`, `short_name`, `theme_color` (from `tenants.primary_color`), and `background_color`.

7. **Neon preview branch teardown**: The issue says "delete Neon preview branch on PR close". **Decision**: GitHub Actions handles this using the Neon CLI in a `pull_request` closed event workflow.

8. **`CLAUDE.md` / `AGENTS.md` content scope**: These are AI guidance documents. **Decision**: Both are created as part of Phase 18 tasks with real content — they are not spec artifacts and not committed as part of spec generation.

---

## Overview

TimeX is a multi-tenant time and expense tracking platform for home health care agencies. This specification covers the complete greenfield implementation from the existing POC, delivering two production applications: an Employee PWA (`apps/app`) and an Admin Portal (`apps/portal`), backed by a Hono API (`apps/api`), Neon PostgreSQL, AWS S3, and RabbitMQ.

**First tenant:** Let's Thrive (`slug: lets-thrive`)
**Stack:** Neon · Hono · RabbitMQ · AWS S3 · Vercel · React 19 + Vite + shadcn/ui

---

## User Scenarios & Testing

### US1 — P1: Employee Logs In (Magic Link)
**Description:** A field employee receives a one-time login link by email and is redirected to their tenant's employee app without entering a password.
**Priority justification:** Authentication gates every other feature; magic link is the primary flow for the target user persona (mobile-first, low-tech friction).
**Independent test:** Can be tested end-to-end in isolation using a test email and a Neon preview database with seed data.

**Acceptance Scenarios:**
- *Given* an employee visits the login page for `/org/lets-thrive/` and enters their email; *When* they click the magic link in their inbox; *Then* they are redirected to `/org/lets-thrive/` with a valid JWT httpOnly refresh cookie and an access token.
- *Given* a magic link that has already been used; *When* the employee clicks it again; *Then* they receive a 401 "Link expired or already used" error.
- *Given* an employee whose account `status = 'inactive'`; *When* they request a magic link; *Then* the API returns a 403 and no email is sent.

---

### US2 — P1: Employee Logs In (Password Fallback)
**Description:** An employee who prefers a password can log in with email + password as a fallback to magic link.
**Priority justification:** Required for users who cannot access email during field work; also used by seed users in CI.

**Acceptance Scenarios:**
- *Given* an employee with a `password_hash` in `profiles`; *When* they submit correct credentials; *Then* they receive a JWT access token and refresh cookie.
- *Given* an employee submits an incorrect password; *When* the API processes the request; *Then* it returns a 401 "Invalid credentials" response (no indication of whether email exists).

---

### US3 — P1: Employee Creates and Submits a Timesheet
**Description:** An employee creates a timesheet for the current pay period, adds daily entries per client, and submits it for manager review.
**Priority justification:** Core revenue-generating action; everything else in the approval workflow depends on this.

**Acceptance Scenarios:**
- *Given* an employee is logged in and a current pay period exists; *When* they navigate to Timesheets and click "New Timesheet"; *Then* a draft timesheet is created for the current pay period and they are shown the entry form.
- *Given* a draft timesheet; *When* an employee adds an entry with `work_date`, `client_id`, `service_type`, and `hours > 0`; *Then* the entry is saved and the total hours displayed updates.
- *Given* a timesheet with at least one entry; *When* the employee clicks "Submit"; *Then* the timesheet status changes to `app_submitted`, `submitted_at` is set, and the employee sees a confirmation.
- *Given* a timesheet in `draft` status; *When* the employee adds an entry for a client they are not assigned to; *Then* the API returns a 422 "Not assigned to this client" error.

---

### US4 — P1: Manager Approves or Rejects a Timesheet
**Description:** A manager views submitted timesheets, reviews the entries, and approves or rejects them with an optional note.
**Priority justification:** Approval triggers the QBO sync pipeline; without this, no payroll data flows to QuickBooks.

**Acceptance Scenarios:**
- *Given* a manager is logged in; *When* they navigate to the Approval Queue; *Then* all `app_submitted` timesheets for their tenant are visible with employee name and total hours.
- *Given* a manager views a submitted timesheet; *When* they click "Approve"; *Then* status becomes `qbo_approved`, `approved_by` and `approved_at` are set, and a RabbitMQ message is enqueued for QBO sync.
- *Given* a manager rejects a timesheet with a note; *When* the employee views their timesheet; *Then* status shows `rejected` and the note is visible.
- *Given* an employee-role user; *When* they attempt to PATCH a timesheet status to `qbo_approved`; *Then* the API returns a 403.

---

### US5 — P1: Employee Creates an Expense and Uploads a Receipt
**Description:** An employee creates an expense claim with merchant, amount, category, and an optional receipt photo upload.
**Priority justification:** Expense tracking is the second core workflow alongside timesheets.

**Acceptance Scenarios:**
- *Given* an employee is logged in; *When* they create an expense with all required fields; *Then* an expense record is saved with status `draft`.
- *Given* a draft expense; *When* the employee taps "Upload Receipt" and selects a photo; *Then* the app requests a presigned S3 URL, uploads directly to S3, and updates `receipt_key` on the expense.
- *Given* an employee submits an expense; *When* the request is processed; *Then* the expense status transitions to `submitted` and the employee sees confirmation.
- *Given* a receipt photo; *When* the employee attempts to view it; *Then* the app requests a presigned download URL from the API (not a public S3 URL).

---

### US6 — P2: Admin Connects QuickBooks Online
**Description:** An admin user connects their agency's QuickBooks Online account via OAuth 2.0. This enables timesheet sync.
**Priority justification:** Required before any QBO sync can occur; directly enables the core payroll integration.

**Acceptance Scenarios:**
- *Given* an admin on the Admin Portal; *When* they click "Connect to QuickBooks"; *Then* they are redirected to Intuit's authorization page with a CSRF state token stored in `oauth_states`.
- *Given* the admin grants access on Intuit; *When* Intuit redirects back with an authorization code; *Then* the API exchanges the code, encrypts the tokens with AES-256-GCM, and stores them in `qbo_credentials`.
- *Given* a connected QBO account; *When* the admin views the QBO settings page; *Then* they see connection status "Connected" with the realm ID and a "Disconnect" button.
- *Given* the admin clicks "Disconnect"; *When* the API processes the request; *Then* the QBO tokens are revoked at Intuit, the `qbo_credentials` row is deleted, and the action is written to `audit_logs`.

---

### US7 — P2: Approved Timesheets Sync to QuickBooks
**Description:** After a manager approves a timesheet, it is asynchronously synced to QuickBooks Online via a RabbitMQ consumer worker.
**Priority justification:** Core integration deliverable; completes the payroll pipeline end-to-end.

**Acceptance Scenarios:**
- *Given* a timesheet transitions to `qbo_approved`; *When* the approval handler completes; *Then* a message is published to `timex.qbo-sync` queue with `timesheetId` and `tenantId`.
- *Given* the QBO sync consumer picks up the message; *When* QBO sync succeeds; *Then* timesheet entries are created as Time Activities in QBO, timesheet status becomes `qbo_synced`, and the action is written to `audit_logs`.
- *Given* the QBO sync consumer fails after 3 retries; *When* the message is dead-lettered; *Then* the message lands in `timex.qbo-sync.dlq` and an alert is logged.

---

### US8 — P2: Employee PWA is Installable
**Description:** The employee app is installable as a PWA via the browser's "Add to Home Screen" prompt, showing tenant branding.
**Priority justification:** Mobile-first field workers need native app-like experience without App Store friction.

**Acceptance Scenarios:**
- *Given* an employee visits the app for the second time on a mobile browser; *When* the custom install prompt is shown; *Then* they can add the app to their home screen with the tenant's name and brand color.
- *Given* an installed PWA for "Let's Thrive"; *When* the employee opens the home screen icon; *Then* the app displays "Let's Thrive" as the name with the tenant's primary color in the toolbar.
- *Given* the device has no network connection; *When* the employee opens the installed PWA; *Then* the cached shell loads and an "offline" indicator is shown.

---

### US9 — P3: Employee Receives Push Notifications
**Description:** An employee receives push notifications when their timesheet status changes (approved or rejected).
**Priority justification:** Improves responsiveness without requiring employees to check the app manually.

**Acceptance Scenarios:**
- *Given* an employee has granted push notification permission; *When* their timesheet is approved; *Then* they receive a Web Push notification within 60 seconds.
- *Given* an employee has granted push notification permission; *When* their timesheet is rejected; *Then* they receive a Web Push notification with the rejection note.
- *Given* an employee has not granted push permission; *When* the app loads; *Then* a non-blocking "Enable notifications" prompt is shown (not the browser native dialog immediately).

---

### US10 — P3: Admin Portal Dashboard and Management
**Description:** Admins can manage employees, clients, assignments, and view aggregate stats via the Admin Portal.
**Priority justification:** Necessary for tenant onboarding and ongoing operations; lower priority than core employee workflows.

**Acceptance Scenarios:**
- *Given* an admin is logged into the portal; *When* they view the Dashboard; *Then* they see pending timesheet count, open expense count, and a pay period summary.
- *Given* an admin navigates to Employee Management; *When* they view the list; *Then* they see all `active` profiles for their tenant with role and status.
- *Given* an admin creates a client assignment; *When* the assignment is saved; *Then* the employee can create timesheet entries for that client.

---

## Requirements

### Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | The system must isolate all tenant data — no query or API response may return rows from a different tenant |
| FR-002 | The Employee PWA must be installable as a PWA on Android Chrome and iOS Safari 16.4+ |
| FR-003 | Magic link authentication must use one-time tokens with a 15-minute expiry |
| FR-004 | JWT access tokens expire in 1 hour; refresh tokens (httpOnly cookie) expire in 30 days |
| FR-005 | All file uploads must go through presigned S3 URLs — files must not pass through the API server |
| FR-006 | S3 presigned download URLs must validate the key prefix against the requesting tenant before signing |
| FR-007 | QBO OAuth tokens must be encrypted with AES-256-GCM before storage in `qbo_credentials` |
| FR-008 | Timesheet entry creation must be restricted to employee-client pairs with an active assignment |
| FR-009 | Timesheet status transitions must follow the defined state machine (see Timesheet Lifecycle) |
| FR-010 | Approved timesheets must enqueue a RabbitMQ message to `timex.qbo-sync` within the same HTTP response |
| FR-011 | All significant actions (timesheet status change, QBO connect/disconnect, expense approval) must be written to `audit_logs` |
| FR-012 | The API must cache tenant resolution by slug for 60 seconds in-process |
| FR-013 | The dynamic PWA manifest must include tenant `name`, `short_name`, `theme_color`, and `background_color` |
| FR-014 | The RabbitMQ consumer must retry failed QBO sync messages up to 3 times before dead-lettering |
| FR-015 | Push notifications must be sent via Web Push on timesheet approval and rejection events |
| FR-016 | `CLAUDE.md` and `AGENTS.md` must exist at repo root with substantive content for AI agents |
| FR-017 | CI must create a Neon preview branch per PR and delete it on PR close |
| FR-018 | All three Vercel projects must deploy with preview URLs on every PR |

### Key Entities

- `tenants`, `profiles`, `user_tenant_roles`, `pay_periods`, `clients`, `assignments`
- `timesheets`, `timesheet_entries`, `expenses`
- `qbo_credentials`, `oauth_states`, `push_subscriptions`, `audit_logs`

---

## Success Criteria

| ID | Criterion |
|---|---|
| SC-001 | `pnpm install` succeeds from repo root with zero errors |
| SC-002 | `pnpm db:reset` migrates the full schema and seeds Let's Thrive tenant with 4 users |
| SC-003 | `pnpm dev` starts all three apps (employee on :5173, portal on :5174, API on :3000) |
| SC-004 | An employee can log in via magic link and access tenant-scoped data within 5s on desktop |
| SC-005 | A complete timesheet → submit → approve → QBO sync cycle completes end-to-end in E2E tests |
| SC-006 | A cross-tenant API call (valid JWT for tenant A requesting tenant B's data) returns 403 |
| SC-007 | The Employee PWA lighthouse PWA score ≥ 90 on mobile simulation |
| SC-008 | All Playwright E2E suites pass in CI (auth, timesheets, expenses, approvals, tenant isolation) |
| SC-009 | `pnpm lint` and `pnpm test` pass with zero errors |
| SC-010 | `pnpm build` succeeds for all three apps |
| SC-011 | QBO tokens are stored as ciphertext (AES-256-GCM) — plaintext tokens never appear in the DB |
| SC-012 | New Relic browser agent is active in production builds and inactive in Playwright runs |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| EC-001 | Employee submits a timesheet for a pay period that is `locked` | API returns 422 "Pay period is locked" |
| EC-002 | Employee adds a timesheet entry with `hours = 0` | API returns 422 "Hours must be greater than 0" (DB check constraint) |
| EC-003 | Magic link token used after 15-minute expiry | API returns 401 "Link expired"; token is deleted |
| EC-004 | QBO refresh token expires (>100 days since last refresh) | API returns 503 to the sync consumer; admin is notified via audit log to reconnect |
| EC-005 | S3 presigned download request for a key in a different tenant's prefix | API returns 403 "Access denied" without signing the URL |
| EC-006 | Two overlapping pay periods created for the same tenant | DB exclusion constraint returns a 409 conflict |
| EC-007 | Push notification subscription token is stale/revoked | Web Push returns 410; the `push_subscriptions` row is deleted automatically |
| EC-008 | A user belongs to two tenants and logs in via magic link | After JWT issuance, a tenant picker modal is shown; JWT is re-issued for selected tenant |
| EC-009 | QBO sync consumer receives a message for a tenant with no `qbo_credentials` | Message is dead-lettered; error logged with `tenantId` for investigation |
| EC-010 | Employee attempts to upload a receipt > 10 MB | Frontend validates before requesting presigned URL; API enforces via S3 bucket policy |
| EC-011 | Neon preview branch migration fails in CI | PR deployment is blocked; API deploy step does not proceed |
| EC-012 | Admin disconnects QBO while a sync message is in-flight in RabbitMQ | Consumer checks for `qbo_credentials` before sync; if absent, nacks and dead-letters |
