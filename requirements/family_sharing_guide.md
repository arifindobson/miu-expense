# Family & Sharing — Setup Guide

**Audience:** whoever administers Miu Expense (you / platform admin).
**Last updated:** 2026-06-28

This guide explains how the family ledger is set up and shared, in what order to do
things, and which steps currently require the **Supabase SQL Editor / Dashboard** vs.
which can be done **in the app**.

> ⚠️ **Why some steps need SQL right now.** New-owner self-provisioning from the app
> is currently broken (a brand-new user's group creation is rejected by RLS — see
> [`audit_improvement.md`](audit_improvement.md) item 1.4, parked). Until that's
> fixed, a new family's first setup is done with the helper in
> [`migrations/provision_user.sql`](migrations/provision_user.sql). Existing groups
> mostly work from the app, with a SQL fallback noted where relevant.

---

## 1. Concepts — three things people often confuse

| Thing | What it is | Needs a login? | Where it's managed |
|---|---|---|---|
| **Group (family ledger)** | The shared workspace. All accounts, categories, people and transactions belong to one group. | — | Created once per family |
| **Group Member** | A **real person who logs in** and contributes to the ledger. Has a role. | ✅ Yes — must be a registered auth user | App → Settings → **Group Management** |
| **Sharing Profile** | A **label** to attribute/split an expense to (e.g. "Mom", "Sister"). Does **not** log in. | ❌ No | App → Settings → **Manage Resources → Sharing Profiles** |

**Roles** (apply to Group Members only):

| Role | Can do |
|---|---|
| **Owner** | Everything; rename group; manage members & roles. One per group (the creator). |
| **Admin** | Full create/read/update/delete on transactions; add/manage members. |
| **Member** | Read the group + create their **own** transactions. Cannot edit/delete others' (enforced in the database, not just the UI). |

**Rule of thumb:**
- Someone will **use the app** and log their own spending → add them as a **Member**.
- You just want to **tag/split** an expense to someone who won't use the app → create a **Sharing Profile**.

---

## 2. Guide A — New User Owner (brand-new family)

Use this when onboarding a **new family** whose owner has never used the app. This
creates the owner's login, their group, default accounts/people, and owner membership.

### Step 1 — Create the owner's login (Supabase Dashboard)
There is no self-signup in the app, so create the auth user manually:
1. Supabase Dashboard → **Authentication → Users → Add user**.
2. Enter **email** + a temporary **password**, and enable **Auto Confirm User**.
3. Click create. (A `profiles` row is created automatically by the `handle_new_user` trigger.)

### Step 2 — Get the new user's UID
Dashboard → Authentication → Users → click the user → copy **User UID**, or run:
```sql
select id, email from auth.users where email = 'newowner@example.com';
```

### Step 3 — Provision their group (SQL Editor)
Make sure the helper function exists once (run [`migrations/provision_user.sql`](migrations/provision_user.sql) if you haven't), then:
```sql
select public.provision_user_group(
  '<USER_UID>',            -- from Step 2
  'newowner@example.com',  -- their email
  null                     -- optional group name; null → "newowner's Ledger"
);
```
This creates the **group**, the **owner membership**, and seeds **default accounts &
categories/people**. It's safe to re-run (idempotent) and bypasses the RLS bug.

### Step 4 — Owner logs in
Hand them the email + temporary password. On login they land on their family ledger as
**Owner**. They can rename the group in **Settings → Group Management**.

### Step 5 — (Owner) add the rest of the family
Now follow **Guide B** below to add members and/or sharing profiles.

> ✅ **Done when:** the owner logs in and sees their own group name (not "Demo Family
> Ledger") with the default accounts. If they see demo/local data only, provisioning
> (Step 3) didn't run or didn't match their UID.

---

## 3. Guide B — Existing Group (add to a working family)

Use this when the family/group already exists and you want to add people to it. Decide
which kind you need (see §1), then follow the matching path.

### Path B1 — Add a **Member** (a real person who will log in)

**Order matters: the person must be a registered user *before* you add them.**

1. **Is the person already a registered user?**
   ```sql
   select id, email from auth.users where email = 'relative@example.com';
   ```
   - **No row?** Create their login first: Dashboard → **Authentication → Users → Add
     user** (email + temp password + Auto Confirm). This makes their `profiles` row.
   - **Row exists?** Continue.

2. **Add them to the group (in the app):**
   Settings → **Group Management** → **Add New Group Member** → enter their **email**,
   pick a **role** (Member or Admin) → **Add User**.
   - The app looks them up in `profiles` by email and adds the membership.
   - Only **Owner/Admin** can do this.

3. They log in with their own credentials and immediately see the shared ledger.

**SQL fallback** (use if the in-app "Add User" fails with a permission/RLS error — a
known side effect of the parked `auth.uid()` issue):
```sql
-- find the group id (e.g. via the owner's membership)
select g.id, g.name from public.groups g
join public.group_members m on m.group_id = g.id
where m.email = 'owner@example.com';

-- find the new member's UID
select id from auth.users where email = 'relative@example.com';

-- add the membership directly (role: 'member' or 'admin')
insert into public.group_members (group_id, user_id, email, role)
values ('<GROUP_ID>', '<MEMBER_UID>', 'relative@example.com', 'member')
on conflict (group_id, email) do nothing;
```

> ❗ Common error in-app: **"User email not found. Please ensure the user is registered
> before adding them to the group."** → You skipped step 1; create their login in the
> Dashboard first.

### Path B2 — Add a **Sharing Profile** (a label, no login)

No database/auth work needed — this is fully in-app and available to any group member:

1. Settings → **Manage Resources → Sharing Profiles** → **Add Profile**.
2. Enter a **Name** (e.g. "Mom"), optional **Associated Email**, pick an **icon**.
3. Save. The profile is now selectable as the "person" on a transaction (keypad → person button).

**Associated Email (optional but useful):** if a profile's email matches a logged-in
user's email, that profile is **auto-selected** as the submitter when they open the
input screen — handy so each family member's entries are tagged to them automatically.

---

## 4. Quick decision flow

```
Do they need to log in and add their own expenses?
├─ YES → Group Member
│         └─ Registered user already?
│              ├─ YES → App: Group Management → Add New Group Member
│              └─ NO  → Dashboard: Add user (auto-confirm) → then add as member
└─ NO  → Sharing Profile
          └─ App: Manage Resources → Sharing Profiles → Add Profile
```

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| New owner logs in but sees "Demo Family Ledger" / no real data | Group never provisioned (RLS bug) | Run `provision_user_group(uid, email)` (Guide A, Step 3) |
| `POST /groups … 403` / "new row violates row-level security policy for table groups" | Parked `auth.uid()` issue (audit 1.4) — client can't create the group | Provision via SQL (Guide A); don't rely on auto-create |
| "User email not found" when adding a member | The person isn't a registered auth user yet | Create their login in the Dashboard first (Path B1, step 1) |
| In-app "Add User" returns a permission error even though they're registered | RLS rejected the membership insert (auth-context issue) | Use the SQL fallback in Path B1 |
| A member can't edit/delete transactions | Working as designed — Members are create+read only | Promote them to Admin in Group Management (Owner/Admin only) |
| Person picker doesn't auto-select the right family member | No matching **Associated Email** on their sharing profile | Add their email to the sharing profile (Path B2) |

---

## 6. Reference

- Provisioning helper: [`migrations/provision_user.sql`](migrations/provision_user.sql)
- Owner-bootstrap fix (server-side, pending the `auth.uid()` investigation): [`migrations/wave1_owner_bootstrap.sql`](migrations/wave1_owner_bootstrap.sql)
- Schema & RLS policies: [`archive/schema.sql`](archive/schema.sql), [`archive/groups_migration.sql`](archive/groups_migration.sql), [`archive/group_onboarding_updates.sql`](archive/group_onboarding_updates.sql)
- Root-cause tracking for the manual SQL steps: [`audit_improvement.md`](audit_improvement.md) items **1.4** (parked) and **2.7**

> 🎯 **Target end state:** once audit **2.7** (fix `auth.uid()` + server-side
> provisioning) lands, Guide A collapses to "owner signs up in the app" and Path B1's
> SQL fallback disappears — invites and provisioning will work entirely in-app. This
> guide reflects the **current** (manual) reality.
