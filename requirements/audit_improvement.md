# Miu Expense — Code Audit & Improvement Plan

**Date:** 2026-06-27
**Reviewer:** Engineering audit (Claude)
**Scope:** Full review of `src/`, Supabase SQL/RLS in `requirements/archive/`, build config, and repo hygiene.
**Stack:** Vite + React 19 + TypeScript + Tailwind v4 + Supabase (auth, Postgres/RLS, Storage). PWA (service worker + manifest).

> Older planning/spec docs (architecture, recipes, SQL migrations, setup/deployment guides) have been moved to [`archive/`](archive/). This file is the current working assessment.

---

## 1. Executive Summary

The app is **functional and visually polished**, with a genuinely good multi-tenant data model: group-scoped resources, RLS enforced through `SECURITY DEFINER` helper functions (`is_group_member`, `is_group_admin_or_owner`, `is_group_owner`) that correctly avoid the classic `group_members` RLS recursion trap, and role-based write restrictions enforced **server-side** (not just in the UI). That is a solid foundation.

The main risks are **not** in the database layer — they are in the **client architecture** and **a few repo-hygiene / privacy items**:

- `src/App.tsx` is a **1,768-line god component** holding all state, all data access, and the entire UI tree. This is the single biggest drag on maintainability.
- The **dual-persistence pattern** (Supabase + `localStorage` fallback) is hand-copied inline into every CRUD operation, with no abstraction. ~12 call sites re-run a full `loadAllResources()` after every mutation.
- **Repo hygiene:** `.env` is committed and not git-ignored; a stray 549-line `expensetracker (1).tsx` dead file sits in the repo root.
- **Privacy:** the `receipts` storage bucket is **public-read** — receipt images (which can contain names, amounts, locations) are world-readable by URL.
- **No tests, no error UI** (failures are `console.error`/`alert()`), and ~27 `any` casts erase type safety at the data boundary.
- **Inconsistent UI:** the expense-input screen is well-themed off the `THEMES` tokens, but `LoginScreen` and `ManageResources` hardcode white/indigo and ignore the theme system, and cards/buttons/inputs are re-implemented inline per screen.

None of these block usage today, but they compound as the app grows. The prioritized plan below is grouped into **three waves**.

---

## 2. Prioritization Method

Each item is scored **Impact** (value of fixing) and **Effort** (cost to fix), both Low/Med/High. Waves are ordered by impact-to-effort ratio:

- **Wave 1 — Do First:** high impact, low/medium effort. Security, privacy, and hygiene quick wins. ~1–2 days.
- **Wave 2 — Do Next:** high impact, medium/high effort. The architectural refactor that unblocks everything else. ~1–2 weeks.
- **Wave 3 — Later:** polish, robustness, and nice-to-haves once the foundation is clean.

---

## 3. Wave 1 — Do First (high impact / low effort)

> **✅ Executed 2026-06-27** — code items done & verified (`tsc -b` + `vite build` pass). DB-side items (1.3 bucket flip, 1.4) are prepared as migrations under [`migrations/`](migrations/) and need to be applied + verified against Supabase. See the [Execution Log](#wave-1-execution-log-2026-06-27) below.

| # | Item | Impact | Effort | Status |
|---|------|--------|--------|--------|
| 1.1 | Stop tracking `.env`; add to `.gitignore` | High | Low | ✅ Done |
| 1.2 | Delete stray `expensetracker (1).tsx` dead file | Med | Low | ✅ Done |
| 1.3 | Lock down the `receipts` storage bucket (privacy) | High | Low | 🟡 Partial — code done; bucket-privacy SQL pending apply |
| 1.4 | Fix new-user group bootstrap (RLS) | High | Low | ⏸️ Parked — manual provisioning workaround in place; root-cause fix → Wave 2 |
| 1.5 | Persist selected theme; restore on load | Low | Low | ✅ Done |
| 1.6 | Fix `setState`-during-render in `ManageResources` | Med | Low | ✅ Done |

**1.1 — `.env` is committed.** `git ls-files` shows `.env` is tracked, and `.gitignore` does not exclude it. The current values are only the Supabase URL + anon key (which are public-by-design and protected by RLS, so this is **not** an immediate breach), but committing `.env` is how a `service_role` key or other real secret gets leaked later. **Action:** `git rm --cached .env`, add `.env` to `.gitignore`, add a committed `.env.example` with placeholder keys. *(If this repo was ever public, rotate the anon key as a precaution.)*

**1.2 — Dead file.** `expensetracker (1).tsx` (549 lines) sits in the repo root, is tracked by git, and is not imported anywhere. It's an earlier monolithic draft. **Action:** delete it.

**1.3 — Public receipts bucket.** `archive/storage_policies.sql` creates the `receipts` bucket with `public: true` and an `Allow Public Select` policy. Anyone with (or guessing) the URL can read any receipt image. Filenames use `Math.random().toString(36).substring(7)` — weak entropy. Receipts can contain sensitive financial/personal data. **Action:** make the bucket private and serve via **signed URLs**, or at minimum add a select policy scoped to group membership and use stronger filename entropy (`crypto.randomUUID()`). Also note the insert policy only checks `authenticated`, not folder ownership — any signed-in user can write into any user's folder.

**1.4 — Owner bootstrap vs. RLS.** In `App.tsx` `loadAllResources()`, when a user has no membership the client creates a group and then inserts a `group_members` row with `role: 'owner'`. But the `group_members` INSERT policy requires `is_group_admin_or_owner(group_id)` — which is **false** for a user who isn't a member yet. This bootstrap insert may only succeed by accident of timing/caching. **Action:** verify this path works for a brand-new user; if it doesn't, seed the owner membership inside the `handle_new_group` trigger (server-side, `SECURITY DEFINER`) instead of from the client.

**1.5 — Theme not persisted.** `currentTheme` defaults to `'white-blue'` on every load and is never written to `localStorage`, so the user's theme choice is lost on refresh. **Action:** read/write `currentTheme` to `localStorage`.

**1.6 — `setState` during render.** `ManageResources.tsx:77-79` calls `setSelectedIcon(...)` directly in the render body. This works but triggers an extra render and is a React anti-pattern. **Action:** initialize via `useState(iconsToChoose[0])` / `useEffect`.

### Wave 1 Execution Log (2026-06-27)

Checklist of what was actually changed. Verified with `npx tsc -b` (exit 0) and `npx vite build` (success).

- [x] **1.1 — `.env` untracked.** `git rm --cached .env` (file kept on disk); added an `.env` / `.env.*` / `!.env.example` block to [`.gitignore`](../.gitignore); added [`.env.example`](../.env.example) with placeholder keys. *Note: the staged removal is not yet committed — commit it to finalize. The current anon key is public-by-design, so no rotation needed unless the repo was public.*
- [x] **1.2 — Stray file deleted.** `git rm "expensetracker (1).tsx"` (removed from index + disk).
- [~] **1.3 — Receipts bucket.** Code half **done**: `ReceiptScanner.tsx` now uses `crypto.randomUUID()` for unguessable filenames. DB half **prepared, not applied**: [`migrations/wave1_storage_hardening.sql`](migrations/wave1_storage_hardening.sql) — part (A) tightens uploads to the user's own folder (safe to run now); part (B), flipping the bucket to private + signed URLs, is deferred to Wave 2 because it needs a receipt-display refactor + data migration.
- [⏸️] **1.4 — New-user bootstrap. PARKED 2026-06-28 (workaround in place).** Investigation timeline:
  - A live new-user session failed at the **`groups` INSERT**: `POST /groups?select=*` → **403, "new row violates row-level security policy for table groups"** (the first failing statement — not `group_members` as originally assumed). So a brand-new user can't provision at all and silently falls back to localStorage.
  - Applied [`migrations/wave1_owner_bootstrap.sql`](migrations/wave1_owner_bootstrap.sql) (reliable `groups` INSERT policy `with check (auth.uid() is not null)` + `on_group_created` trigger to seed owner membership & defaults). **It did not fix it.** Confirmed the policy is present and correct (`PERMISSIVE`, `roles {public}`, `with_check (auth.uid() IS NOT NULL)`) and the user is `confirmed_at`.
  - An in-DB simulation that injected a valid `sub` claim (`set request.jwt.claims` + `set role authenticated`) **also failed** with `42501`. ⇒ **`auth.uid()` resolves to NULL even when claims are present** — a deeper auth-context / `auth.uid()`-definition issue, not a policy bug. (Lead to chase later: mismatch between this project's `auth.uid()` definition and the claim key GoTrue/PostgREST actually sets, e.g. `request.jwt.claim.sub` vs `request.jwt.claims`.) This would make *all* `auth.uid()`-based RLS unreliable, so it deserves a dedicated session — out of scope for Wave 1.
  - **Decision: parked.** It's an edge case for the current single-tenant phase. Interim workaround: provision each new user manually with [`migrations/provision_user.sql`](migrations/provision_user.sql) — a `SECURITY DEFINER` function `provision_user_group(uid, email, name)` that **bypasses RLS** (so it's immune to the `auth.uid()` bug), creates the group + owner membership + default accounts/people, and is idempotent.
  - **Proper fix → Wave 2:** move provisioning server-side (call this function from a post-signup hook / RPC) as part of the data-layer + onboarding work; also investigate and repair `auth.uid()` so client-side RLS is trustworthy. This aligns with the self-serve onboarding phase in `future_architect.md`.
  - *Note:* the `App.tsx` bootstrap tweak from the prior step (reading back the trigger-seeded membership) is left in but is effectively inert until the `auth.uid()` issue is resolved — the `groups` insert fails before it matters.
- [x] **1.5 — Theme persisted.** `App.tsx` lazily initializes `currentTheme` from `localStorage('miu_theme')` (validated against `THEMES`) and writes it on change via `useEffect`.
- [x] **1.6 — Render fix.** `ManageResources.tsx` no longer calls `setSelectedIcon` during render; default/reset now runs in a `useEffect` keyed on `type` (also fixes a latent bug where the icon didn't reset when switching account/category/person).

**Remaining manual steps for the owner of the Supabase project:**
1. Commit the staged `.env` removal + new files.
2. Run [`migrations/wave1_storage_hardening.sql`](migrations/wave1_storage_hardening.sql) part (A).
3. **New users (1.4 parked):** auto-provisioning is broken (see log above), so for each new user run [`migrations/provision_user.sql`](migrations/provision_user.sql) once, then call e.g. `select public.provision_user_group('<uid>', '<email>', null);`. This bypasses the `auth.uid()` issue and sets up their group + membership + defaults. The root-cause `auth.uid()` fix is deferred to Wave 2.

---

## 4. Wave 2 — Do Next (high impact / medium-high effort)

This is the core refactor. Everything here pays for itself in every future feature and bug fix.

> **✅ Executed 2026-06-28** — App.tsx decomposed (1,768 → 31 lines), repository layer + hooks + themed UI kit added, three screens redesigned. Verified with `tsc -b`, `vite build`, and a dev-server boot smoke test (all green). See the [Wave 2 Execution Log](#wave-2-execution-log-2026-06-28). 2.7 remains parked (needs the `auth.uid()` investigation).

| # | Item | Impact | Effort | Status |
|---|------|--------|--------|--------|
| 2.1 | Extract a data/repository layer (kill inline dual-persistence) | High | High | ✅ Done |
| 2.2 | Break up the 1,768-line `App.tsx` god component | High | High | ✅ Done |
| 2.3 | Replace full `loadAllResources()` refetch with targeted/optimistic updates | High | Med | 🟡 Targeted refetch done; optimistic pending |
| 2.4 | Add generated DB types; remove `any` at the data boundary | High | Med | 🟡 Hand-written row types + typed mappers; `gen types` pending |
| 2.5 | Add real error + loading UI (replace `alert()`/silent `console.error`) | Med | Med | ✅ Done |
| 2.6 | Standardize a themed UI kit; make the expense-input screen the reference | High | Med | 🟡 Kit built + used in new screens; `LoginScreen` migration pending |
| 2.7 | Fix `auth.uid()`/RLS auth context + move user provisioning server-side (from parked 1.4) | High | Med | ⏸️ Parked (depends on 1.4 investigation) |

**Redesign (requested alongside Wave 2):** Home, Analytics, and the Others/Settings pages were rebuilt for mobile — see the execution log.

**2.1 — Repository layer.** Today every operation (save tx, update tx, delete tx, add/delete person, invite member, etc.) hand-writes the same `if (userId && userId !== 'demo-local-user') { supabase… } else { localStorage… }` branch, including nested helpers like `saveToLocalStorageFallback` and `updateLocalStorageTransaction`. This is duplicated across `App.tsx`, `ManageResources.tsx`, and others. **Action:** introduce a `src/data/` layer — e.g. `transactionsRepo`, `resourcesRepo`, `groupsRepo` — each exposing `list/create/update/remove`, with the Supabase-vs-local decision made **once** behind the interface. The magic string `'demo-local-user'` should become a single `isOnline(userId)` helper. This alone removes a large fraction of the code and all the copy-paste drift risk.

**2.2 — Decompose `App.tsx`.** The file mixes: theme config (~65 lines of literals), all `useState` (~30 hooks), auth lifecycle, data loading, calculator logic, the geolocation handler, transaction CRUD, group management handlers, and four full screens of JSX. **Action:** split into:
- `screens/InputScreen`, `screens/HomeScreen`, `screens/AnalyticsScreen`, `screens/SettingsScreen`
- hooks: `useAuth`, `useGroupData`, `useCalculator`, `useGeolocation`
- a `ThemeContext` so `t` isn't threaded as a prop into every component
- move `THEMES` and `DEFAULT_*` constants into their own modules

Target: `App.tsx` becomes a thin shell (<150 lines) wiring providers + tab router.

**2.3 — Stop refetching everything on every write.** `loadAllResources()` is called from ~12 places, and it re-fetches memberships, all members, accounts, people, categories, **and** all transactions — even after a single transaction insert. On a busy group this is many round-trips and a visible lag. **Action:** after a mutation, update local state optimistically (or refetch only the affected collection). This pairs naturally with the repo layer (2.1).

**2.4 — Type the data boundary.** ~27 `any` usages (`(acc: any) =>`, `onAuthStateChange((_event: any, session: any))`, the entire `mockSupabase as any`). **Action:** generate types from the DB (`supabase gen types typescript`) into `src/types/database.ts`, type the Supabase client with them, and remove the row-mapping `any` casts. Catches schema drift at compile time.

**2.5 — Error & loading UX.** Currently: save failures `console.error` and silently fall through (the *update* path doesn't even fall back to localStorage); permission denials and the "sync"/"about" buttons use `alert()`; there's no loading state for data fetches or saves (only the 2-second success overlay). This is inconsistent with the otherwise-polished UI. **Action:** add a lightweight toast/inline-error mechanism and per-action loading states; surface failed saves to the user instead of swallowing them.

**2.6 — Standardized themed UI kit (expense-input screen as the reference standard).** The expense-input screen is the most refined surface in the app — it consistently drives every color, surface, border, and control off the `THEMES` token object (`t.surface`, `t.surfaceBorder`, `t.border`, `t.primary`, `t.inputCard`, `t.keypadContainer`, `t.toggleActive`, etc.), with a coherent radius/shadow/spacing language (`rounded-2xl`/`rounded-3xl` cards, soft shadows, `active:scale-95` press states). The other surfaces **drift from it**:

- **`LoginScreen` ignores the theme system entirely** — it hardcodes `bg-white`, `from-violet-600 … to-blue-600`, and `indigo` focus rings instead of consuming `t`. It can never match the user's selected theme.
- **`ManageResources` hardcodes** `bg-white`, `focus:ring-indigo-500`, and `border-indigo-500` selection states rather than `t.primary*` / `t.inputCard` tokens, so its inputs look different from the input screen's.
- **The Home dashboard** balance card uses a one-off `from-violet-600 via-indigo-600 to-blue-600` gradient unrelated to the active theme.
- Cards, buttons, inputs, toggles, banners (success/error/edit), and bottom-sheet modals are **re-implemented inline** on each screen with subtly different padding, radius, and border tokens.

**Action:** promote the input screen's patterns into a small, theme-driven **UI kit** under `shared/ui/` (pairs with 2.2's `ThemeContext`), and refactor every screen to consume it:

- **Primitives** — `Card`, `Button` (variants: `primary` / `surface` / `ghost` / `danger`), `IconButton`, `TextField` / `Select` (the themed input-card style), `Toggle`, `Banner` (success/error/info/edit), `BottomSheet` / `Modal`, `ListRow`, `Badge`, `EmptyState`.
- Each primitive reads the active theme from context (no `t` prop-drilling) and encodes the **single source of truth** for radius, shadow, spacing, press states, and the `t.primary*`/`t.surface*`/`t.border` token mapping — so a new theme automatically restyles the whole app.
- **Migrate `LoginScreen` and `ManageResources` onto the kit first** (biggest visual drift), then Home/Analytics/Settings.
- Optionally document the kit on one scratch "component gallery" route to keep it visually regression-checkable.

This makes the polish of the input screen the baseline everywhere, removes dozens of bespoke class strings, and means future screens (and the admin console in `future_architect.md`) start from a consistent, themeable foundation. *Sequence it right after 2.2* — the kit and the `ThemeContext`/decomposition are mutually reinforcing.

**2.7 — Fix `auth.uid()`/RLS auth context + server-side provisioning (promoted from parked 1.4).** Wave 1 surfaced a real backend defect: a new user's `groups` INSERT is rejected (`42501`), and an in-DB simulation with injected claims showed **`auth.uid()` resolves to NULL even when a `sub` claim is present** — so the failure is not a policy bug but an auth-context issue. If `auth.uid()` is unreliable, every `auth.uid()`-based policy (`is_group_member`, transaction reads/writes, etc.) is suspect, and parts of the app may be silently running on the localStorage fallback rather than real Supabase. **Action:**
- **Diagnose `auth.uid()`** — confirm the project's `auth.uid()` definition matches the claim key the current GoTrue/PostgREST sets (`request.jwt.claim.sub` vs `request.jwt.claims->>'sub'`); check the Supabase client/session attaches the bearer token on requests; verify against the real (non-fallback) data path.
- **Move provisioning server-side** — promote [`migrations/provision_user.sql`](migrations/provision_user.sql)'s `provision_user_group()` into a post-signup auth hook / `SECURITY DEFINER` RPC the client calls once, removing the fragile client-side group creation entirely.
- This is the durable replacement for the parked 1.4 workaround and a prerequisite for the self-serve onboarding phase in `future_architect.md`. Until it lands, new users are onboarded with the manual SQL workaround.

### Wave 2 Execution Log (2026-06-28)

Verified with `npx tsc -b` (exit 0), `npx vite build` (success), and a dev-server boot smoke test (root + module graph return 200). `App.tsx` went from **1,768 → 31 lines**.

**New foundation**
- `src/constants/` — `themes.ts` (`THEMES` + `ThemeKey`), `icons.ts` (`ICON_MAP`, `AVAILABLE_ICONS`, `iconKeyFor`), `defaults.ts`. `ManageResources` now re-exports `ICON_MAP` from here.
- `src/utils/` — `date.ts` (`getLocalYMD`, `getTransactionDateLabel` — folds in 3.3), `format.ts` (`formatDisplayAmount`, `formatCompact`, `rupiah`, `deduplicateByName`).
- `src/context/` — `ThemeContext` (provider + `useTheme`, persists theme → also satisfies 1.5) and `ToastContext` (provider + `useToast`).
- `src/ui/kit.tsx` — themed primitives: `Card`, `Button`, `IconButton`, `Banner`, `EmptyState`, `SectionLabel`, `Avatar` (**2.6**).

**2.1 — Data/repository layer.** `src/data/persistence.ts` (`isOnline`, `DEMO_USER`, `lsRead/lsWrite`, `LS_KEYS`) centralizes the Supabase-vs-localStorage decision; `transactionsRepo.ts` owns transaction save/delete with the local fallback. The `'demo-local-user'` magic string is now the single `isOnline()` helper (**folds in 3.6**).

**2.2 — Decomposition.** Logic extracted into hooks — `useAuth`, `useAppData` (loading + all mutations), `useCalculator`, `useGeolocation` — and four screens (`InputScreen`, `HomeScreen`, `AnalyticsScreen`, `SettingsScreen`) under `src/screens/`. `AuthedApp.tsx` is the orchestrator (shared modals + nav); `App.tsx` is now a thin auth gate. `AnalyticsDashboard.tsx` was removed (replaced by `AnalyticsScreen`).

**2.3 — Targeted refetch.** `useAppData` exposes `reloadTransactions()`; transaction save/delete now refetch only transactions instead of the full `reload()` of every collection. Full optimistic UI still pending.

**2.4 — Typed data boundary.** `src/types/database.ts` holds hand-written row types; mappers in `useAppData` are fully typed (no `any` in the Supabase→domain mapping). `gen types` from the live DB still recommended. Residual `any` remains in `localStorage` parsing helpers.

**2.5 — Error & loading UX.** Added a toast system (`useToast`) and a top loading bar driven by `dataLoading`. Failed transaction saves/deletes now surface a toast instead of a silent `console.error`; the Settings page's two fake `alert()` buttons ("Supabase Sync", "About") were replaced with a real About card.

**2.6 — Themed UI kit (partial).** Kit built and consumed by all four screens (banners, empty states, avatars, section labels) and the new shell. `LoginScreen` and parts of `ManageResources` still hardcode indigo/white — full migration deferred.

**Redesigns**
- **Home** — cleaner header, hero balance card, **per-account balance chips** (horizontal scroll), clearer Group/My-Ledger segmented toggle, and member **avatars** on group transactions.
- **Analytics** — same charts, plus an **insight strip** (avg spend/day + top category) and tighter mobile spacing.
- **Others → Settings** — profile card with **role badge**, **inline theme swatches** (no modal round-trip), grouped sections, sign-out, and a real About card (no more `alert()`).

**Add-ons (requested during Wave 2)**
- **More category icons** — `constants/icons.ts` `ICON_MAP` expanded from 23 → ~60 icons (food, transport, bills, health, education, entertainment, etc.); the category picker (`AVAILABLE_ICONS.category`) now offers ~50 choices. Verified each icon exists in the installed `lucide-react` before importing.
- **Drag-to-sort accounts** — new `components/SortableAccounts.tsx` (pointer-events based, works on touch + desktop, no new dependency) lets you reorder accounts via a grip handle in **Settings → Accounts**. Order persists to `localStorage` (`miu_account_order`) and is applied on every load by `useAppData` (`applyOrder` in `persistence.ts` + `reorderAccounts`), so it **reflects in the expense-input account picker** order. Device-local for now; a `sort_order` DB column is the eventual multi-device path.
- **Coin sound on submit** — `hooks/useSound.ts` synthesizes a "cha-ching" via the Web Audio API (two ascending square-wave notes — no audio asset, no network). Plays on a **successful** expense submit (`InputScreen`). Settings → Sound has an on/off toggle, a volume slider, and a Test button; preferences are saved **per user** in `localStorage` (`miu_sound_<userId>`) and reload on login. Server-side sync (a `profiles` preferences column) is the eventual cross-device path.

**Known follow-ups:** full optimistic updates (2.3), `supabase gen types` (2.4), `LoginScreen` theme migration (2.6), 2.7, and persisting account order server-side. Repo lint (strict `eslint-plugin-react-hooks` v7) was already red before this work and remains so on pre-existing files; new code's only intentional deviations are `set-state-in-effect`/`exhaustive-deps` in data/prefill hooks.

---

## 5. Wave 3 — Later (polish & robustness)

| # | Item | Impact | Effort |
|---|------|--------|--------|
| 3.1 | Add a test setup + cover money math, filters, repo layer | Med | Med |
| 3.2 | Reconsider money as floating-point | Med | Med |
| 3.3 | De-duplicate helpers (`getLocalYMD` defined twice, etc.) | Low | Low |
| 3.4 | `localStorage` quota risk from base64 receipts | Low | Med |
| 3.5 | Don't `.trim()` passwords on login | Low | Low |
| 3.6 | Centralize the `'demo-local-user'` sentinel (folds into 2.1) | Low | Low |
| 3.7 | Accessibility pass (aria-labels on icon-only buttons) | Low | Med |
| 3.8 | Tidy `package.json` name (`"vite-project"`) & versions | Low | Low |

**3.1 — Tests.** There are zero test files. Highest-value first targets: the calculator (`performCalculation`/`handleOperator`), the `filteredTransactions` memo logic, `deduplicateByName`, and the new repo layer. Vitest + React Testing Library fit the Vite stack.

**3.2 — Money as floats.** Amounts use `parseFloat` and JS numbers, with `Math.round(res * 1_000_000) / 1_000_000` to paper over float error in the calculator. For IDR (typically no decimals) this rarely bites, but multi-currency (USD/SGD options exist) plus float math is a latent rounding bug. **Action:** store/compute in integer minor units, or document the IDR-only assumption.

**3.3 — Duplicated helpers.** `getLocalYMD` is defined both inside the `App` component and again inside `getTransactionDateLabel`. Consolidate into a `utils/date.ts`.

**3.4 — `localStorage` receipts.** In offline mode, receipts are stored as base64 inside the transactions blob. A handful of photos can blow past the ~5 MB quota and cause silent `setItem` failures. **Action:** cap count/size offline, or warn the user.

**3.5 — Password trimming.** `LoginScreen` calls `password.trim()` before sign-in, which silently breaks valid passwords that contain leading/trailing spaces. Trim email, not password.

**3.7 — Accessibility.** Many icon-only buttons (theme, location toggle, delete, camera) lack `aria-label`s; the success/error banners aren't announced. Low effort per item, improves the experience for assistive tech.

---

## 6. What's Already Good (keep it)

- **RLS done right.** Group policies route through `SECURITY DEFINER` helpers, sidestepping `group_members` self-reference recursion — a trap most implementations hit.
- **Server-enforced roles.** Transaction update/delete require `is_group_admin_or_owner`; the client-side `userRole === 'member'` `alert()` checks are belt-and-suspenders, not the sole defense.
- **Graceful offline degradation** exists (even if the implementation is duplicated) — the mock Supabase client + localStorage fallback means the app runs without backend config.
- **Cohesive, well-componentized UI** below `App.tsx` — `ReceiptScanner`, `GroupManagementModal`, `TransactionFilters`, etc. are reasonably sized and focused.
- **Sensible schema:** FKs with `on delete set null`/`cascade`, unique indexes on category names, default seeding via triggers.

---

## 7. Suggested Order of Execution

1. **Wave 1** in a single hygiene/security PR (≈1–2 days): `.env`, dead file, receipts bucket, theme persistence, render bug, plus verify the owner-bootstrap path.
2. **Wave 2.1 + 2.2 together** — extract the repo layer *while* decomposing `App.tsx` (they reinforce each other), then **2.6** (build the themed UI kit on the new `ThemeContext` and migrate `LoginScreen`/`ManageResources` first), then **2.3 / 2.4 / 2.5** on the cleaner base.
3. **Wave 3** opportunistically, with **3.1 (tests)** ideally started during Wave 2 so the refactor is covered as it lands.
