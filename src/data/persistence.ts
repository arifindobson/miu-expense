// Shared persistence helpers: the single place that decides "Supabase vs localStorage"
// and reads/writes the local fallback store.

export const DEMO_USER = 'demo-local-user';

/** True when we have a real authenticated Supabase user (not the offline/demo fallback). */
export function isOnline(userId: string | null): userId is string {
  return !!userId && userId !== DEMO_USER;
}

export const LS_KEYS = {
  transactions: 'miu_transactions',
  accounts: 'miu_custom_accounts',
  people: 'miu_custom_people',
  categories: 'miu_custom_categories',
  group: 'miu_active_group',
  members: 'miu_group_members',
  role: 'miu_user_role',
  accountOrder: 'miu_account_order',
} as const;

/** Sort a list by a saved array of ids; unknown ids keep their relative order at the end. */
export function applyOrder<T extends { id: string }>(list: T[], orderedIds: string[]): T[] {
  if (!orderedIds.length) return list;
  const pos = new Map(orderedIds.map((id, i) => [id, i]));
  return [...list].sort((a, b) => (pos.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (pos.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

export function lsRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function lsWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Most likely the ~5MB quota (e.g. base64 receipts) — surface, don't crash.
    console.warn(`localStorage write failed for ${key}:`, err);
  }
}

export function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}
