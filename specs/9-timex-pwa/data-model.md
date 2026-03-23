# TimeX PWA — Data Model

## Entity Overview

All business tables carry a `tenant_id` foreign key to `tenants` with a covering index. Row-Level Security (RLS) is enabled on all business tables except `audit_logs`.

---

## ASCII ERD

```
tenants
  │ id (PK)
  │ name, slug (UNIQUE), status, logo_url, logo_dark_url
  │ primary_color, secondary_color, config (JSONB)
  │
  ├──< profiles
  │      id (PK, matches auth user ID)
  │      tenant_id (FK → tenants)
  │      email, full_name, avatar_url, status
  │      password_hash (nullable)
  │      ├──< user_tenant_roles
  │      │      user_id (FK → profiles)
  │      │      tenant_id (FK → tenants)
  │      │      role: employee | manager | admin
  │      │      UNIQUE(user_id, tenant_id)
  │      │
  │      ├──< assignments
  │      │      employee_id (FK → profiles)
  │      │      client_id (FK → clients)
  │      │      tenant_id (FK → tenants)
  │      │      start_date, end_date (nullable)
  │      │
  │      ├──< timesheets
  │      │      employee_id (FK → profiles)
  │      │      pay_period_id (FK → pay_periods)
  │      │      tenant_id (FK → tenants)
  │      │      status: draft|app_submitted|qbo_approved|qbo_synced|rejected
  │      │      approved_by (FK → profiles, nullable)
  │      │      ├──< timesheet_entries
  │      │      │      timesheet_id (FK → timesheets)
  │      │      │      client_id (FK → clients, nullable)
  │      │      │      tenant_id (FK → tenants)
  │      │      │      work_date, service_type, hours, notes
  │      │
  │      ├──< expenses
  │      │      employee_id (FK → profiles)
  │      │      pay_period_id (FK → pay_periods, nullable)
  │      │      tenant_id (FK → tenants)
  │      │      merchant, category, amount, expense_date
  │      │      receipt_key (S3 key), status, approved_by, notes
  │      │
  │      └──< push_subscriptions
  │             user_id (FK → profiles)
  │             tenant_id (FK → tenants)
  │             token (UNIQUE per user), platform
  │
  ├──< pay_periods
  │      tenant_id (FK → tenants)
  │      start_date, end_date (EXCLUSION per tenant — no overlap)
  │      status: open | locked
  │
  ├──< clients
  │      tenant_id (FK → tenants)
  │      name (PHI), code, status, qbo_customer_id
  │
  ├──> qbo_credentials (1:1 per tenant)
  │      tenant_id (FK → tenants, UNIQUE)
  │      realm_id, access_token_enc, refresh_token_enc
  │      expires_at, connected_by (FK → profiles)
  │
  ├──< oauth_states (short-lived CSRF tokens)
  │      tenant_id (FK → tenants)
  │      user_id (FK → profiles)
  │      state (UNIQUE), expires_at
  │
  └──< audit_logs (append-only, no RLS)
         tenant_id (FK → tenants)
         user_id (FK → profiles, nullable)
         action, entity_type, entity_id, details (JSONB)
         created_at
```

---

## Entity Definitions

### `tenants`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | NOT NULL | "Let's Thrive" |
| `slug` | `text` | NOT NULL, UNIQUE | "lets-thrive" — used in URL path |
| `status` | `text` | NOT NULL, default `'active'`, CHECK in (`active`, `trial`, `suspended`, `deactivated`) | |
| `logo_url` | `text` | nullable | S3 key: `{id}/branding/logo.png` |
| `logo_dark_url` | `text` | nullable | S3 key: `{id}/branding/logo-dark.png` |
| `primary_color` | `text` | nullable | hex: `#2D6A4F` |
| `secondary_color` | `text` | nullable | hex: `#B7E4C7` |
| `config` | `jsonb` | NOT NULL, default `'{}'` | Tenant settings (Google Sheet ID, notification prefs) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:** `idx_tenants_slug ON tenants(slug)`

---

### `profiles`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | Matches auth user ID — no join needed |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `email` | `text` | NOT NULL | |
| `full_name` | `text` | NOT NULL | |
| `avatar_url` | `text` | nullable | S3 key |
| `status` | `text` | NOT NULL, default `'active'`, CHECK in (`active`, `inactive`) | |
| `password_hash` | `text` | nullable | null for magic-link-only users |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**RLS:** enabled
**Indexes:** `idx_profiles_tenant ON profiles(tenant_id)`, `idx_profiles_email ON profiles(email)`

---

### `user_tenant_roles`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` ON DELETE CASCADE | |
| `role` | `text` | NOT NULL, CHECK in (`employee`, `manager`, `admin`) | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| | | UNIQUE(`user_id`, `tenant_id`) | One role per user per tenant |

**RLS:** enabled
**Indexes:** `idx_utr_user ON user_tenant_roles(user_id)`, `idx_utr_tenant ON user_tenant_roles(tenant_id)`

---

### `pay_periods`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `start_date` | `date` | NOT NULL | |
| `end_date` | `date` | NOT NULL | |
| `status` | `text` | NOT NULL, default `'open'`, CHECK in (`open`, `locked`) | |
| | | EXCLUDE USING gist(`tenant_id` WITH =, `daterange(start_date, end_date, '[]')` WITH &&) | No overlapping periods per tenant |

**RLS:** enabled
**Indexes:** `idx_pay_periods_tenant ON pay_periods(tenant_id)`
**Migration note:** requires `btree_gist` extension for the exclusion constraint

---

### `clients`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `name` | `text` | NOT NULL | **PHI** — full name of care recipient |
| `code` | `text` | nullable | Short code: "MS-001" |
| `status` | `text` | NOT NULL, default `'active'`, CHECK in (`active`, `inactive`, `discharged`) | |
| `qbo_customer_id` | `text` | nullable | QuickBooks Online customer ID |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

**RLS:** enabled
**Indexes:** `idx_clients_tenant ON clients(tenant_id)`

---

### `assignments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `employee_id` | `uuid` | NOT NULL, FK → `profiles(id)` | |
| `client_id` | `uuid` | NOT NULL, FK → `clients(id)` | |
| `start_date` | `date` | NOT NULL, default `current_date` | |
| `end_date` | `date` | nullable | null = still active |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| | | UNIQUE(`tenant_id`, `employee_id`, `client_id`) | One assignment per employee-client pair per tenant |

**RLS:** enabled
**Indexes:** `idx_assignments_tenant ON assignments(tenant_id)`, `idx_assignments_employee ON assignments(employee_id)`

---

### `timesheets`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `employee_id` | `uuid` | NOT NULL, FK → `profiles(id)` | |
| `pay_period_id` | `uuid` | NOT NULL, FK → `pay_periods(id)` | |
| `status` | `text` | NOT NULL, default `'draft'`, CHECK in (`draft`, `app_submitted`, `qbo_approved`, `qbo_synced`, `rejected`) | |
| `approved_by` | `uuid` | nullable, FK → `profiles(id)` | |
| `submitted_at` | `timestamptz` | nullable | |
| `approved_at` | `timestamptz` | nullable | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| | | UNIQUE(`tenant_id`, `employee_id`, `pay_period_id`) | One timesheet per employee per period |

**RLS:** enabled
**Indexes:** `idx_timesheets_tenant`, `idx_timesheets_employee`, `idx_timesheets_status`, `idx_timesheets_pay_period`

**State machine:**
```
draft → app_submitted (employee submits)
app_submitted → qbo_approved (manager approves)
app_submitted → rejected (manager rejects)
rejected → app_submitted (employee resubmits)
qbo_approved → qbo_synced (RabbitMQ consumer)
```

---

### `timesheet_entries`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `timesheet_id` | `uuid` | NOT NULL, FK → `timesheets(id)` ON DELETE CASCADE | |
| `work_date` | `date` | NOT NULL | |
| `client_id` | `uuid` | nullable, FK → `clients(id)` | |
| `service_type` | `text` | nullable | "Personal Care", "Companion", etc. |
| `hours` | `numeric(5,2)` | NOT NULL, CHECK > 0 | |
| `notes` | `text` | nullable | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**RLS:** enabled
**Indexes:** `idx_te_tenant ON timesheet_entries(tenant_id)`, `idx_te_timesheet ON timesheet_entries(timesheet_id)`

---

### `expenses`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `employee_id` | `uuid` | NOT NULL, FK → `profiles(id)` | |
| `pay_period_id` | `uuid` | nullable, FK → `pay_periods(id)` | |
| `merchant` | `text` | NOT NULL | |
| `category` | `text` | NOT NULL | "Mileage", "Supplies", "Meals", etc. |
| `amount` | `numeric(10,2)` | NOT NULL, CHECK > 0 | |
| `expense_date` | `date` | NOT NULL | |
| `receipt_key` | `text` | nullable | S3 key: `{tenant_id}/receipts/{id}/{filename}` |
| `status` | `text` | NOT NULL, default `'draft'`, CHECK in (`draft`, `submitted`, `approved`, `rejected`) | |
| `approved_by` | `uuid` | nullable, FK → `profiles(id)` | |
| `notes` | `text` | nullable | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**RLS:** enabled
**Indexes:** `idx_expenses_tenant ON expenses(tenant_id)`, `idx_expenses_employee ON expenses(employee_id)`

---

### `push_subscriptions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE | |
| `token` | `text` | NOT NULL | Web Push subscription JSON |
| `platform` | `text` | NOT NULL, CHECK in (`web-mobile`, `web-portal`, `ios`, `android`) | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |
| | | UNIQUE(`user_id`, `token`) | One subscription per device per user |

**RLS:** enabled
**Indexes:** `idx_push_subs_tenant ON push_subscriptions(tenant_id)`

---

### `qbo_credentials`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` ON DELETE CASCADE, UNIQUE | One QBO connection per tenant |
| `realm_id` | `text` | NOT NULL | Intuit company (realm) ID |
| `access_token_enc` | `text` | NOT NULL | AES-256-GCM encrypted |
| `refresh_token_enc` | `text` | NOT NULL | AES-256-GCM encrypted |
| `expires_at` | `timestamptz` | NOT NULL | Access token expiry |
| `connected_by` | `uuid` | NOT NULL, FK → `profiles(id)` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | |

**RLS:** enabled
**Indexes:** `idx_qbo_creds_tenant ON qbo_credentials(tenant_id)`

---

### `audit_logs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` | |
| `user_id` | `uuid` | nullable, FK → `profiles(id)` | null for system/worker actions |
| `action` | `text` | NOT NULL | e.g. `timesheet.approved`, `qbo.connected` |
| `entity_type` | `text` | NOT NULL | e.g. `timesheet`, `expense` |
| `entity_id` | `uuid` | nullable | |
| `details` | `jsonb` | default `'{}'` | before/after values, metadata |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**RLS:** NONE — append-only, read via admin Hono routes using service role
**Indexes:** `idx_audit_tenant ON audit_logs(tenant_id)`, `idx_audit_created ON audit_logs(created_at)`

---

### `oauth_states`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `tenant_id` | `uuid` | NOT NULL, FK → `tenants(id)` ON DELETE CASCADE | |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` | |
| `state` | `text` | NOT NULL, UNIQUE | Random CSRF state token |
| `expires_at` | `timestamptz` | NOT NULL | 10 minutes from creation |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |

**Indexes:** `idx_oauth_state ON oauth_states(state)`

---

## Indexing Strategy

| Index | Purpose |
|---|---|
| All `tenant_id` columns indexed | Primary data isolation and filtering |
| `timesheets(status)` | Fast approval queue queries (`WHERE status = 'app_submitted'`) |
| `timesheets(pay_period_id)` | Pay period summary queries |
| `profiles(email)` | Auth lookup on magic link request |
| `oauth_states(state)` | Fast CSRF validation on OAuth callback |
| `audit_logs(created_at)` | Time-range queries in admin audit views |

---

## Migration Considerations

1. **Extension:** `CREATE EXTENSION IF NOT EXISTS btree_gist;` — required before the `pay_periods` exclusion constraint.
2. **RLS setup:** Drizzle does not generate RLS policy SQL. Raw SQL migration files needed for each `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements.
3. **Migration order:** `tenants` → `profiles` → `user_tenant_roles` → `pay_periods` → `clients` → `assignments` → `timesheets` → `timesheet_entries` → `expenses` → `push_subscriptions` → `qbo_credentials` → `oauth_states` → `audit_logs`
4. **Neon branching:** `drizzle-kit push` is run against a Neon branch URL in CI (not `drizzle-kit migrate` with SQL files) for speed. Production uses generated SQL migration files applied via `drizzle-kit migrate`.
