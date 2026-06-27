# Implementation Plan: Dynamic Resource Connection and Resource Management Settings

We will update the application to dynamically fetch accounts, categories, and people from Supabase, link their database UUIDs when creating transactions (to resolve null foreign keys), and build a management subview inside the "Others" tab to allow users to add and delete these items.

---

## User Review Required

> [!IMPORTANT]
> **Database Foreign Key Cascades & Triggers**
> - When a user deletes an account, category, or person, any transactions referencing that ID will have their foreign keys set to `NULL` (due to the `ON DELETE SET NULL` constraints in `schema.sql`). 
> - To prevent information loss, the application saves the text descriptions (`account_name`, `category_name`, `person_name`) in the transaction rows. If the referenced entity is deleted, the transaction details will remain fully descriptive, but the foreign key relation will resolve to `NULL`.
> - **Default Categories**: We will add default category insert queries to `requirements/schema.sql` so that every new deployment starts with populated default categories.

---

## Open Questions

> [!NOTE]
> No critical open questions. We will use the existing icons (`lucide-react`) and style selectors (colors) for custom items created by the user.

---

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.sql](file:///Users/arifindobson/Documents/arifinProject/miu-expense/requirements/schema.sql)
- Append insert queries to seed default categories (Food, Communicat, Daily, Transport, Tip, Fees, SaaS Subs, Social, Housing, Gifts, Clothing, Entertainme) where `user_id` is `null` (system-wide defaults).
- Ensure RLS policies on all tables allow `insert`, `select`, and `delete` operations for their owners.

### Component Layer

#### [MODIFY] [types/index.ts](file:///Users/arifindobson/Documents/arifinProject/miu-expense/src/types/index.ts)
- Update typescript interface definitions to align database models:
  - Add optional `user_id` to `Category`, `Account`, and `Person`.
  - Enforce `id` as `string` (UUID) across all components (instead of number string `'1'`, `'2'`, etc.).
  - Support string representations of icons for storage, mapping them back to Lucide components at runtime.

#### [NEW] [components/ManageResources.tsx](file:///Users/arifindobson/Documents/arifinProject/miu-expense/src/components/ManageResources.tsx)
- Create a beautiful, full-screen slide-in management overlay component.
- Supports managing `'account' | 'category' | 'person'`.
- Features:
  - **List View**: Displays all items retrieved from the database. Shows a "Lock" icon for system defaults (which cannot be deleted) and a "Trash" icon for custom user-created items.
  - **Delete Action**: Triggers a database delete query and updates local state.
  - **Create Action Form**: Allows adding a new resource with:
    - **Name input field**.
    - **Icon Picker grid** (selection of standard Lucide icons: CreditCard, Wallet, Landmark, Utensils, Smile, Users, etc.).
    - **Color Picker grid** (selection of Tailwind text color styles: blue, green, pink, purple, orange, red, slate).
    - **Currency & Initial Balance selectors** (only visible when managing accounts).

### Application Container

#### [MODIFY] [App.tsx](file:///Users/arifindobson/Documents/arifinProject/miu-expense/src/App.tsx)
- **Replace Static Arrays**: Change `accounts`, `people`, and `categories` from static hardcoded arrays to state arrays (`accountsState`, `peopleState`, `categoriesState`) populated dynamically.
- **Dynamic Loading Hooks**:
  - Add a fetching routine inside the anonymous auth `useEffect` block.
  - Query:
    - `accounts`: Filter by `user_id` equal to current session user ID.
    - `people`: Filter by `user_id` equal to current session user ID.
    - `categories`: Filter by `user_id is null OR user_id = auth.uid()`.
  - **Offline Local Storage Fallbacks**: If Supabase is unconfigured, fallback to loading/storing these custom resources in `localStorage` keys (`miu_custom_accounts`, `miu_custom_people`, `miu_custom_categories`).
- **Update Insert Logic**:
  - During transaction insertion (`handleActionClick`), map selected item database `id` (UUIDs) to `account_id`, `category_id`, and `person_id`.
  - Keep the descriptive `account_name`, `category_name`, and `person_name` text mappings active.
- **Others Tab Menu Updates**:
  - Under the "Others" configuration tab, add settings triggers to open the resource management overlay:
    - `Manage Accounts`
    - `Manage Categories`
    - `Manage Sharing Profiles`

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify there are no typescript compiling or bundling errors.

### Manual Verification
1. **Fetch Validation**:
   - Run the application. Verify that standard initial accounts and people (seeded via db trigger) and default categories show up inside the selection grids.
2. **Transaction Database Link Validation**:
   - Save a transaction. Inspect the Supabase `transactions` table. Verify that `account_id`, `category_id`, and `person_id` are successfully populated with UUIDs matching the referenced items.
3. **Creation & Deletion Validation**:
   - Navigate to the **Others** tab and click **Manage Categories**.
   - Add a custom category (e.g. name: "Pets", icon: "Dog", color: "pink"). Verify it immediately shows in the transaction category selector.
   - Delete it and verify it disappears from selectors.
   - Do the same validation for **Accounts** and **People**.
4. **Local Fallback Validation**:
   - Disable Supabase connection (by deleting the keys in `.env` or running offline). Verify that custom resource adding and deleting fall back safely to `localStorage`.
