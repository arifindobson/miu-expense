// Hand-written shapes for the raw Supabase rows (until `supabase gen types` is wired up).
// These type the data boundary so mappers don't need `any`.

export interface AccountRow {
  id: string;
  user_id?: string | null;
  group_id?: string | null;
  name: string;
  icon: string;
  color: string;
  currency: string;
  balance: number | string;
  description?: string | null;
  created_at?: string;
}

export interface PersonRow {
  id: string;
  user_id?: string | null;
  group_id?: string | null;
  name: string;
  icon: string;
  email?: string | null;
  created_at?: string;
}

export interface CategoryRow {
  id: string;
  user_id?: string | null;
  group_id?: string | null;
  name: string;
  icon: string;
  color: string;
  description?: string | null;
  created_at?: string;
}

export interface TransactionRow {
  id: string;
  user_id?: string | null;
  type: 'expense' | 'income';
  amount: number | string;
  category_id?: string | null;
  category_name?: string | null;
  account_id?: string | null;
  account_name?: string | null;
  person_id?: string | null;
  person_name?: string | null;
  note?: string | null;
  date: string;
  location_lat?: number | null;
  location_lng?: number | null;
  receipt_url?: string | null;
  group_id?: string | null;
  created_at?: string;
}

export interface GroupRow {
  id: string;
  name: string;
  created_at?: string;
}

export interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id?: string | null;
  email: string;
  role: 'owner' | 'admin' | 'member';
  created_at?: string;
  groups?: GroupRow | GroupRow[] | null;
}
