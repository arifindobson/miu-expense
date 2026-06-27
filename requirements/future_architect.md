# Miu Expense — Future Architecture: Multi-Tenant SaaS + Super-Admin Console

**Date:** 2026-06-27
**Status:** Forward-looking plan (not yet implemented)
**Related:** [`audit_improvement.md`](audit_improvement.md) (Phase 0 below depends on its Wave 2 refactor) · prior specs in [`archive/`](archive/)

---

## 1. The Vision

Today Miu Expense is a **single mobile-first app** for one family group, with a manual "request a trial via WhatsApp" flow. The target is a **multi-tenant SaaS**:

- **Many families ("tenants")** each get their own isolated group/ledger.
- Families can **self-serve sign up, start a trial, and subscribe** to a paid plan.
- A **super-admin console (desktop)** lets platform staff manage tenants, subscriptions, plans, users, trial requests, and view platform health.

This means two product surfaces with very different shapes:

| Surface | Audience | Device | Nature |
|---|---|---|---|
| **User app** | Family members | Mobile-first (current phone-frame UI) | High-frequency data entry, read-only/role-gated |
| **Admin console** | Platform staff (us) | Desktop-first | Dense data tables, cross-tenant management, billing ops |

These should **not** be the same UI. They share a data layer and types, but their layouts, navigation, and components diverge.

---

## 2. Where We Are Today (recap)

What already exists and is reusable:

- **Tenancy primitive:** `groups` + `group_members` tables. A group ≈ a tenant.
- **Tenant-level RBAC:** roles `owner` / `admin` / `member`, enforced **server-side** via `SECURITY DEFINER` helpers (`is_group_member`, `is_group_admin_or_owner`, `is_group_owner`) — these correctly avoid `group_members` RLS recursion. This is a strong base to build on.
- **Group-scoped resources:** `accounts`, `people`, `categories`, `transactions` all carry `group_id` and are RLS-isolated per group.
- **Auth:** Supabase email/password; profiles mirror `auth.users`.
- **Manual onboarding:** `request_trials` table (name, WhatsApp, reason) — a lead form, not real onboarding.

What is **missing** for the vision:

1. **No platform tier of RBAC.** Roles only exist *inside* a group. There is no concept of "platform super-admin" who can see across tenants.
2. **No billing / subscription model.** No plans, no subscription status, no seat limits, no payment integration. Trials are informal.
3. **No tenant lifecycle.** No active/suspended/expired states; the owner-membership bootstrap is even done client-side (see audit item 1.4).
4. **No admin surface at all**, and the codebase is a single mobile UI (`App.tsx` god component).
5. **Folder structure** has no separation between user-side and system-side concerns.

---

## 3. Target Architecture

### 3.1 Two-tier RBAC

We introduce a **platform tier above the existing tenant tier**. Crucially, super-admin is **not** a group role — it must live outside `group_members` so it can't be granted by a tenant owner.

```
PLATFORM TIER  (new — spans all tenants)
  ├── super_admin     full control: tenants, billing, plans, users, impersonation
  ├── support         read tenants + limited actions (reset, extend trial); no billing
  └── billing_admin   subscriptions/invoices/plans only            (optional, later)

TENANT TIER  (exists today — scoped to one group)
  ├── owner           manage members, billing for their group, all data
  ├── admin           manage data + members; no billing
  └── member          create own transactions; read group; no destructive ops
```

**Implementation (Supabase):** a `platform_admins(user_id, role, created_at)` table + a `SECURITY DEFINER` function `is_platform_admin()` / `is_platform_role(role text)`, mirroring the existing group helpers. Platform-admin reads are granted through dedicated RLS policies (`USING (is_platform_admin())`). **Privileged writes go through Edge Functions using the `service_role` key — never ship `service_role` to any client.** Optionally promote the platform role into a custom JWT claim via a Custom Access Token Hook so it's checkable cheaply in RLS.

### 3.2 Tenant lifecycle & subscriptions

A group gains a lifecycle and a subscription:

```
groups
  + status            text   -- 'trialing' | 'active' | 'past_due' | 'suspended' | 'canceled'
  + trial_ends_at     timestamptz
  + owner_user_id     uuid    -- denormalized for admin queries

plans            (id, name, price_idr, interval, max_seats, features jsonb, is_active)
subscriptions    (id, group_id, plan_id, status, current_period_end, seats, provider_ref, …)
invoices         (id, subscription_id, amount_idr, status, paid_at, provider_ref)   -- later
```

**Access gating principle:** gate **writes**, not reads. When a subscription lapses, the tenant becomes **read-only** (they can still see their data and re-subscribe) rather than locked out — locking owners out of their own history is a support nightmare and a churn trap. Implement with a `group_has_write_access(group_id)` helper used in INSERT/UPDATE policies; keep SELECT on `is_group_member`.

**Seat limits:** enforce `count(group_members) <= subscription.seats` inside the invite Edge Function / a `before insert` check, not just in the UI.

**Billing provider:** given IDR pricing and the WhatsApp-first audience, recommend an Indonesian gateway — **Midtrans or Xendit** (support cards, VA, e-wallets, recurring). Use **Stripe** only if international expansion is on the roadmap. Provider webhooks (Edge Function) are the source of truth for `subscription.status`.

### 3.3 Two frontends, one data layer

**Recommended topology:** keep **one Vite repo** but split into two route trees behind a router, with a shared layer. Reasons: shared types/repos/auth, single deploy pipeline, lowest overhead for a small team. Promote to a true monorepo (separate `apps/user` + `apps/admin`) only if/when build times or team size demand it.

- Add **`react-router`** (not currently a dependency).
- Route resolution at the root: **`admin.miu.app` (subdomain) → Admin console**, everything else → User app. Subdomain split keeps the user bundle small (admin code is lazy-loaded / separate chunk) and simplifies access reasoning.
- The Admin console is **gated twice**: client route guard (`is_platform_admin`) **and** server-side RLS/Edge-Function checks. Client routing is UX, not security.

---

## 4. Proposed Folder Structure

Restructure `src/` into **shared / user / admin**. This also absorbs the `App.tsx` decomposition from the audit (Wave 2.2).

```
src/
├── main.tsx
├── AppRouter.tsx                  # resolves host/path + auth → UserApp | AdminApp
│
├── shared/                        # used by BOTH surfaces
│   ├── lib/
│   │   └── supabase.ts            # client (+ typed with generated DB types)
│   ├── types/
│   │   ├── database.ts            # generated: `supabase gen types`
│   │   └── domain.ts              # Account, Person, Transaction, Group, Plan, …
│   ├── constants/
│   │   ├── themes.ts              # THEMES (moved out of App.tsx)
│   │   ├── icons.ts               # ICON_MAP
│   │   └── defaults.ts            # DEFAULT_ACCOUNTS / PEOPLE / CATEGORIES
│   ├── data/                      # repository layer (audit Wave 2.1)
│   │   ├── transactionsRepo.ts
│   │   ├── resourcesRepo.ts
│   │   ├── groupsRepo.ts
│   │   ├── membersRepo.ts
│   │   └── subscriptionsRepo.ts
│   ├── auth/
│   │   ├── useAuth.ts
│   │   └── usePlatformRole.ts     # is_platform_admin / support
│   └── ui/                        # primitives shared across surfaces (Button, Modal, …)
│
├── user/                          # MOBILE-FIRST end-user app (today's app, refactored)
│   ├── UserApp.tsx                # thin shell: providers + bottom-tab router
│   ├── screens/
│   │   ├── InputScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── AnalyticsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/                # CategoryGrid, Keypad, ReceiptScanner,
│   │   │                          #   SwipeableTransaction, *Modal, GroupManagementModal …
│   └── hooks/
│       ├── useCalculator.ts
│       ├── useGeolocation.ts
│       └── useGroupData.ts
│
└── admin/                         # DESKTOP super-admin console (new)
    ├── AdminApp.tsx
    ├── layout/
    │   ├── DesktopShell.tsx       # sidebar + topbar, wide layout (NOT the phone frame)
    │   ├── Sidebar.tsx
    │   └── Topbar.tsx
    ├── pages/
    │   ├── DashboardPage.tsx      # platform KPIs (tenants, MRR, active users)
    │   ├── TenantsPage.tsx        # list/search all groups
    │   ├── TenantDetailPage.tsx   # one tenant: members, subscription, usage, actions
    │   ├── SubscriptionsPage.tsx
    │   ├── PlansPage.tsx
    │   ├── TrialRequestsPage.tsx  # work the request_trials queue → provision tenant
    │   ├── UsersPage.tsx
    │   └── AuditLogPage.tsx
    └── components/
        └── DataTable.tsx          # sortable/filterable/paginated table primitive
```

Key point: **`shared/` has no UI-shell opinions** (no phone frame, no desktop sidebar). The `max-w-md` phone frame lives in `user/`, the wide sidebar layout lives in `admin/`.

---

## 5. Phased Plan

Each phase is independently shippable and leaves the app working.

### Phase 0 — Foundation Refactor *(prerequisite; ~1–2 weeks)*
Do the audit's **Wave 1 + Wave 2** first. Nothing below is sane on a 1,768-line god component with copy-pasted persistence.
- Extract the **repository layer** (`shared/data/`) — single place for Supabase-vs-local decisions.
- Decompose `App.tsx` → `user/` screens + hooks; introduce `ThemeContext`.
- Create `shared/`, move types/constants/client; generate DB types, remove `any` at the boundary.
- Move the existing app under `src/user/`; add `AppRouter.tsx` (single route for now).
- **Fix the owner-membership bootstrap server-side** (audit 1.4) — provision the owner row in `handle_new_group`, not the client. This is load-bearing for self-serve onboarding.
- **Exit criteria:** identical behavior, but mobile app now lives in `user/` over a clean data layer.

### Phase 1 — Platform RBAC + Admin Shell (read-only) *(~1 week)*
- DB: `platform_admins` table; `is_platform_admin()` / `is_platform_role()` SECURITY DEFINER functions; admin SELECT policies across `groups`, `group_members`, `transactions` (read-only).
- Add `react-router`; `AppRouter` resolves admin subdomain → `AdminApp` behind a platform-role guard.
- Build `DesktopShell` + `TenantsPage` (list groups) + `TenantDetailPage` (read-only).
- **Exit criteria:** a super-admin can log in to the desktop console and browse every tenant read-only. No tenant user can reach it.

### Phase 2 — Tenant Lifecycle & Self-Serve Onboarding *(~1–2 weeks)*
- DB: add `groups.status`, `trial_ends_at`, `owner_user_id`.
- Self-serve signup → server-side tenant provisioning (group + owner membership + defaults via trigger/Edge Function) → group enters `trialing`.
- Convert `request_trials` from a dead-end lead form into a real queue worked from `TrialRequestsPage` (approve → provision / extend / reject).
- Admin actions (via Edge Functions): suspend / reactivate / extend trial.
- **Exit criteria:** a new family can sign up and get a working trial tenant with no manual SQL.

### Phase 3 — Subscriptions & Billing *(~2–3 weeks)*
- DB: `plans`, `subscriptions` (+ `invoices` if needed).
- Integrate payment provider (**Midtrans/Xendit** for IDR); webhook Edge Function is the source of truth for status.
- `group_has_write_access()` helper → expired tenants go **read-only** (not locked out).
- Seat-limit enforcement on invite (server-side).
- User-side: plan picker, subscription status, upgrade/downgrade; owner-only billing screen.
- Admin-side: `SubscriptionsPage`, `PlansPage`, manual overrides.
- **Exit criteria:** a tenant can subscribe, pay, hit seat limits, and lapse to read-only on non-payment.

### Phase 4 — Admin Operations & Observability *(~1–2 weeks)*
- Full admin CRUD on tenants/subscriptions/users; `DashboardPage` KPIs (tenant count, MRR, active users, trial conversion).
- **Audit log** of platform-admin actions; **support impersonation** (scoped, logged, time-boxed) for debugging tenants.
- **Exit criteria:** day-to-day platform ops need no direct DB access.

### Phase 5 — Hardening & Scale *(ongoing)*
- All privileged mutations behind Edge Functions; rate limiting; webhook signature verification.
- Storage: private receipts bucket + signed URLs (audit 1.3); per-tenant storage accounting.
- Tests around RBAC boundaries and billing state machine; backups/DR; observability/alerting.

---

## 6. Security Notes (carry through every phase)

- **`service_role` never reaches the browser.** All cross-tenant / billing writes run in Edge Functions.
- **Defense in depth:** client route guards are UX; RLS + Edge-Function checks are the real boundary. Every admin capability must be denied by the database even if the UI is bypassed.
- **Super-admin is not a group role** — it lives in `platform_admins`, grantable only by another super-admin (or seeded out-of-band).
- **Tenant isolation is sacred:** new tables (`subscriptions`, `invoices`, …) need `group_id` + RLS from day one. Default-deny.
- **Impersonation must be logged and time-boxed**, never a silent capability.
- **Webhooks are untrusted input** — verify provider signatures before mutating subscription state.

---

## 7. Open Decisions (confirm before Phase 1)

| Decision | Recommendation | Why it matters |
|---|---|---|
| Single repo vs monorepo (separate user/admin apps) | **Single Vite repo, split route trees** | Lowest overhead now; revisit at scale |
| Admin entry point | **`admin.` subdomain** + lazy-loaded chunk | Keeps user bundle lean; clean access boundary |
| Privileged writes | **Edge Functions (`service_role`)** | Avoids elevated keys in client; auditable |
| Payment provider | **Midtrans / Xendit (IDR)**; Stripe if global | Matches audience & currency |
| Access on lapse | **Read-only**, not locked out | Reduces churn & support load |
| Platform role in JWT | Custom Access Token Hook (optional) | Cheaper RLS checks vs table lookup |

> These are recommendations, not commitments — each is a genuine fork worth a quick sign-off before building Phase 1.
