import { supabase } from '../lib/supabase';
import { isOnline, lsRead, lsWrite, newId, LS_KEYS } from './persistence';

export interface TransactionInput {
  type: string;
  amount: number;
  categoryId: string | null;
  categoryName: string;
  accountId: string;
  accountName: string;
  personId: string;
  personName: string;
  note: string;
  date: string;
  lat: number | null;
  lng: number | null;
  receiptUrl: string | null;
  groupId: string | null;
}

export interface RepoResult {
  ok: boolean;
  error?: string;
}

// Mock/default UUIDs (default-*) fail real foreign-key constraints, so null them out for the DB.
const dbId = (id: string | null) => (id && !id.startsWith('default-') ? id : null);

/** Create or update a transaction, online (Supabase) or offline (localStorage). */
export async function saveTransaction(
  input: TransactionInput,
  opts: { userId: string | null; editingId?: string | null },
): Promise<RepoResult> {
  const { editingId } = opts;

  if (isOnline(opts.userId)) {
    const { data: { session } } = await supabase.auth.getSession();
    const activeUserId = session?.user?.id;
    if (activeUserId) {
      const row = {
        type: input.type,
        amount: input.amount,
        category_id: dbId(input.categoryId),
        category_name: input.categoryName,
        account_id: dbId(input.accountId),
        account_name: input.accountName,
        person_id: dbId(input.personId),
        person_name: input.personName,
        note: input.note,
        date: input.date,
        location_lat: input.lat,
        location_lng: input.lng,
        receipt_url: input.receiptUrl,
        group_id: input.groupId,
      };
      if (editingId) {
        const { error } = await supabase.from('transactions').update(row).eq('id', editingId);
        return error ? { ok: false, error: error.message } : { ok: true };
      }
      const { error } = await supabase.from('transactions').insert({ ...row, user_id: activeUserId });
      if (!error) return { ok: true };
      // Insert failed online → fall back to local so the entry isn't lost.
      saveLocal(input, editingId);
      return { ok: false, error: error.message };
    }
  }

  const wrote = saveLocal(input, editingId);
  return wrote ? { ok: true } : { ok: false, error: 'Local storage is full (likely too many saved receipt photos). The entry was not saved.' };
}

function saveLocal(input: TransactionInput, editingId?: string | null): boolean {
  const existing = lsRead<any[]>(LS_KEYS.transactions, []);
  if (editingId) {
    const idx = existing.findIndex((tt) => tt.id === editingId);
    if (idx !== -1) {
      existing[idx] = {
        ...existing[idx],
        type: input.type,
        amount: input.amount,
        category_name: input.categoryName,
        account_name: input.accountName,
        person_name: input.personName,
        note: input.note,
        date: input.date,
        location_lat: input.lat,
        location_lng: input.lng,
        receipt_url: input.receiptUrl,
        group_id: input.groupId,
      };
    }
  } else {
    existing.push({
      id: newId(),
      user_id: 'demo-local-user',
      type: input.type,
      amount: input.amount,
      category_id: input.categoryId,
      category_name: input.categoryName,
      account_id: input.accountId,
      account_name: input.accountName,
      person_id: input.personId,
      person_name: input.personName,
      note: input.note,
      date: input.date,
      location_lat: input.lat,
      location_lng: input.lng,
      receipt_url: input.receiptUrl,
      group_id: input.groupId,
      created_at: new Date().toISOString(),
    });
  }
  return lsWrite(LS_KEYS.transactions, existing);
}

/** Delete a transaction by id, online or offline. */
export async function deleteTransaction(id: string, opts: { userId: string | null }): Promise<RepoResult> {
  if (isOnline(opts.userId)) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      return error ? { ok: false, error: error.message } : { ok: true };
    }
  }
  const existing = lsRead<any[]>(LS_KEYS.transactions, []);
  lsWrite(LS_KEYS.transactions, existing.filter((tt) => tt.id !== id));
  return { ok: true };
}
