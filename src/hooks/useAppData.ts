import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ICON_MAP, iconKeyFor } from '../constants/icons';
import { DEFAULT_ACCOUNTS, DEFAULT_PEOPLE, DEFAULT_CATEGORIES } from '../constants/defaults';
import { deduplicateByName } from '../utils/format';
import { isOnline, lsRead, lsWrite, applyOrder, LS_KEYS } from '../data/persistence';
import { saveTransaction as repoSaveTransaction, deleteTransaction as repoDeleteTransaction, type TransactionInput } from '../data/transactionsRepo';
import type { Account, Person, Category, Transaction, Group, GroupMember } from '../types';
import type {
  AccountRow, PersonRow, CategoryRow, TransactionRow, GroupRow, GroupMemberRow,
} from '../types/database';

const mapAccount = (a: AccountRow): Account => ({
  id: a.id, user_id: a.user_id ?? undefined, group_id: a.group_id,
  name: a.name, icon: ICON_MAP[a.icon] || DEFAULT_ACCOUNTS[0].icon,
  color: a.color, currency: a.currency, balance: parseFloat(String(a.balance)) || 0,
});
const mapPerson = (p: PersonRow): Person => ({
  id: p.id, user_id: p.user_id ?? undefined, group_id: p.group_id,
  name: p.name, icon: ICON_MAP[p.icon] || DEFAULT_PEOPLE[0].icon, email: p.email ?? null,
});
const mapCategory = (c: CategoryRow): Category => ({
  id: c.id, user_id: c.user_id, group_id: c.group_id,
  name: c.name, icon: ICON_MAP[c.icon] || DEFAULT_CATEGORIES[0].icon, color: c.color,
});
const mapTransaction = (tx: TransactionRow): Transaction => ({
  id: tx.id, user_id: tx.user_id ?? undefined, type: tx.type,
  amount: parseFloat(String(tx.amount)) || 0,
  category_id: tx.category_id, category_name: tx.category_name,
  account_id: tx.account_id, account_name: tx.account_name,
  person_id: tx.person_id, person_name: tx.person_name,
  note: tx.note || '', date: tx.date,
  location_lat: tx.location_lat, location_lng: tx.location_lng,
  receipt_url: tx.receipt_url, group_id: tx.group_id, created_at: tx.created_at,
});

export function useAppData(userId: string | null, userEmail: string | null) {
  const [accountsList, setAccountsList] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [peopleList, setPeopleList] = useState<Person[]>(DEFAULT_PEOPLE);
  const [categoriesList, setCategoriesList] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);

  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member'>('owner');
  const [ledgerViewMode, setLedgerViewMode] = useState<'individual' | 'group'>('group');

  const [selectedAccount, setSelectedAccount] = useState<Account>(DEFAULT_ACCOUNTS[0]);
  const [selectedPerson, setSelectedPerson] = useState<Person>(DEFAULT_PEOPLE[0]);
  const [dataLoading, setDataLoading] = useState(false);

  const seedDefaultCategoriesToDb = async (uid: string, gId: string | null) => {
    try {
      const seeds = DEFAULT_CATEGORIES.map((cat) => ({
        user_id: uid, group_id: gId, name: cat.name, icon: iconKeyFor(cat.icon), color: cat.color,
      }));
      await supabase.from('categories').insert(seeds);
    } catch (err) {
      console.warn('Failed to seed default categories:', err);
    }
  };

  const loadFromLocalStorage = useCallback(() => {
    const customAccs = lsRead<any[]>(LS_KEYS.accounts, []).map((acc) => ({ ...acc, icon: ICON_MAP[acc.icon] || DEFAULT_ACCOUNTS[0].icon }));
    const mergedAccs = deduplicateByName([...DEFAULT_ACCOUNTS, ...customAccs]);
    setAccountsList(applyOrder(mergedAccs, lsRead<string[]>(LS_KEYS.accountOrder, [])));
    setSelectedAccount((prev) => mergedAccs.find((a) => a.id === prev.id || a.name === prev.name) || mergedAccs[0]);

    const customPpl = lsRead<any[]>(LS_KEYS.people, []).map((p) => ({ ...p, icon: ICON_MAP[p.icon] || DEFAULT_PEOPLE[0].icon }));
    const mergedPpl = deduplicateByName([...DEFAULT_PEOPLE, ...customPpl]);
    setPeopleList(mergedPpl);
    setSelectedPerson((prev) => mergedPpl.find((p) => p.id === prev.id || p.name === prev.name) || mergedPpl[0]);

    const customCats = lsRead<any[]>(LS_KEYS.categories, []).map((cat) => ({ ...cat, icon: ICON_MAP[cat.icon] || DEFAULT_CATEGORIES[0].icon }));
    setCategoriesList(deduplicateByName([...DEFAULT_CATEGORIES, ...customCats]));

    let localGroup = lsRead<Group | null>(LS_KEYS.group, null);
    if (!localGroup) {
      localGroup = { id: 'local-group-1', name: 'Demo Family Ledger' };
      lsWrite(LS_KEYS.group, localGroup);
    }
    setActiveGroup(localGroup);
    setUserRole((lsRead<string>(LS_KEYS.role, 'owner')) as 'owner' | 'admin' | 'member');

    let localMembers = lsRead<GroupMember[] | null>(LS_KEYS.members, null);
    if (!localMembers) {
      localMembers = [
        { id: 'local-mem-1', group_id: localGroup.id, user_id: 'demo-local-user', email: 'me@example.com', role: 'owner' },
        { id: 'local-mem-2', group_id: localGroup.id, user_id: 'guest-1', email: 'partner@example.com', role: 'admin' },
        { id: 'local-mem-3', group_id: localGroup.id, user_id: 'guest-2', email: 'child@example.com', role: 'member' },
      ];
      lsWrite(LS_KEYS.members, localMembers);
    }
    setGroupMembers(localMembers);

    const customTx = lsRead<any[]>(LS_KEYS.transactions, []).map((tx) => ({ ...tx, amount: parseFloat(tx.amount) || 0 }));
    customTx.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    setTransactionsList(customTx);
  }, []);

  /** Refetch only the transactions for the active group (targeted — used after a tx mutation). */
  const reloadTransactions = useCallback(async (groupId?: string | null) => {
    const gId = groupId ?? activeGroup?.id;
    if (!isOnline(userId) || !gId) {
      const customTx = lsRead<any[]>(LS_KEYS.transactions, []).map((tx) => ({ ...tx, amount: parseFloat(tx.amount) || 0 }));
      customTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactionsList(customTx);
      return;
    }
    const { data } = await supabase
      .from('transactions').select('*').eq('group_id', gId)
      .order('date', { ascending: false }).order('created_at', { ascending: false });
    setTransactionsList(((data as TransactionRow[]) || []).map(mapTransaction));
  }, [userId, activeGroup?.id]);

  /** Full reload: memberships, group, members, accounts, people, categories, transactions. */
  const reload = useCallback(async () => {
    let activeEmail = userEmail;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) activeEmail = session.user.email;
    } catch { /* ignore */ }

    if (!isOnline(userId)) {
      loadFromLocalStorage();
      return;
    }

    setDataLoading(true);
    try {
      let { data: memberships } = await supabase
        .from('group_members').select('*, groups(*)')
        .or(`user_id.eq.${userId},email.eq.${activeEmail || ''}`);

      let selectedMembership = (memberships as GroupMemberRow[] | null)?.[0] || null;

      if (!selectedMembership) {
        const groupName = `${activeEmail ? activeEmail.split('@')[0] : 'Family'}'s Ledger`;
        const { data: newGroup, error: groupErr } = await supabase
          .from('groups').insert({ name: groupName }).select().single();
        if (groupErr || !newGroup) throw new Error(groupErr?.message || 'Failed to create default group');

        let { data: ownerMember } = await supabase
          .from('group_members').select('*, groups(*)')
          .eq('group_id', (newGroup as GroupRow).id)
          .or(`user_id.eq.${userId},email.eq.${activeEmail || ''}`).maybeSingle();

        if (!ownerMember) {
          const { data: inserted } = await supabase
            .from('group_members')
            .insert({ group_id: (newGroup as GroupRow).id, user_id: userId, email: activeEmail || '', role: 'owner' })
            .select('*, groups(*)').maybeSingle();
          ownerMember = inserted;
        }
        if (!ownerMember) throw new Error('Failed to resolve owner membership for new group');
        selectedMembership = ownerMember as GroupMemberRow;
      }

      let resolvedGroup = selectedMembership.groups;
      if (Array.isArray(resolvedGroup)) resolvedGroup = resolvedGroup[0];
      if (!resolvedGroup) resolvedGroup = { id: selectedMembership.group_id, name: 'Family Group' };
      const group = resolvedGroup as GroupRow;

      setActiveGroup(group);
      setUserRole(selectedMembership.role || 'member');

      const { data: groupMembersData } = await supabase.from('group_members').select('*').eq('group_id', group.id);
      setGroupMembers(((groupMembersData as GroupMemberRow[]) || []).map((m) => ({
        id: m.id, group_id: m.group_id, user_id: m.user_id, email: m.email, role: m.role, created_at: m.created_at,
      })));

      const { data: accData } = await supabase.from('accounts').select('*').eq('group_id', group.id).order('created_at', { ascending: true });
      const loadedAccounts = ((accData as AccountRow[]) || []).map(mapAccount);
      setAccountsList(applyOrder(deduplicateByName(loadedAccounts.length > 0 ? loadedAccounts : DEFAULT_ACCOUNTS), lsRead<string[]>(LS_KEYS.accountOrder, [])));
      if (loadedAccounts.length > 0) {
        setSelectedAccount((prev) => loadedAccounts.find((a) => a.id === prev.id || a.name === prev.name) || loadedAccounts[0]);
      }

      const { data: pplData } = await supabase.from('people').select('*').eq('group_id', group.id).order('created_at', { ascending: true });
      const loadedPeople = ((pplData as PersonRow[]) || []).map(mapPerson);
      setPeopleList(deduplicateByName(loadedPeople.length > 0 ? loadedPeople : DEFAULT_PEOPLE));
      if (loadedPeople.length > 0) {
        setSelectedPerson((prev) => {
          if (activeEmail) {
            const emailMatch = loadedPeople.find((p) => p.email && p.email.toLowerCase() === activeEmail!.toLowerCase());
            if (emailMatch) return emailMatch;
            const emailPrefix = activeEmail.split('@')[0].toLowerCase();
            const prefixMatch = loadedPeople.find((p) => p.name.toLowerCase() === emailPrefix);
            if (prefixMatch) return prefixMatch;
          }
          return loadedPeople.find((p) => p.id === prev.id || p.name === prev.name) || loadedPeople[0];
        });
      }

      const catQuery = `group_id.eq.${group.id},user_id.is.null,user_id.eq.${userId}`;
      let { data: catData } = await supabase.from('categories').select('*').or(catQuery).order('created_at', { ascending: true });
      let loadedCategories = ((catData as CategoryRow[]) || []).map(mapCategory);
      if (loadedCategories.length === 0) {
        await seedDefaultCategoriesToDb(userId, group.id);
        ({ data: catData } = await supabase.from('categories').select('*').or(catQuery).order('created_at', { ascending: true }));
        loadedCategories = ((catData as CategoryRow[]) || []).map(mapCategory);
      }
      setCategoriesList(deduplicateByName(loadedCategories.length > 0 ? loadedCategories : DEFAULT_CATEGORIES));

      const { data: txData } = await supabase
        .from('transactions').select('*').eq('group_id', group.id)
        .order('date', { ascending: false }).order('created_at', { ascending: false });
      setTransactionsList(((txData as TransactionRow[]) || []).map(mapTransaction));
    } catch (err) {
      console.error('Failed to load Supabase resources:', err);
      loadFromLocalStorage();
    } finally {
      setDataLoading(false);
    }
  }, [userId, userEmail, loadFromLocalStorage]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const resetToDefaults = useCallback(() => {
    setTransactionsList([]);
    setAccountsList(DEFAULT_ACCOUNTS);
    setPeopleList(DEFAULT_PEOPLE);
    setCategoriesList(DEFAULT_CATEGORIES);
    setActiveGroup(null);
    setGroupMembers([]);
  }, []);

  // ── Transaction mutations ──────────────────────────────────────────────
  const saveTransaction = useCallback(async (input: TransactionInput, editingId?: string | null) => {
    if (editingId && userRole === 'member') {
      return { ok: false, error: 'Members cannot update transactions.' };
    }
    const result = await repoSaveTransaction(input, { userId, editingId });
    await reloadTransactions(input.groupId);
    return result;
  }, [userId, userRole, reloadTransactions]);

  const removeTransaction = useCallback(async (tx: Transaction) => {
    if (userRole === 'member') return { ok: false, error: 'Members cannot delete transactions.' };
    if (!tx.id) return { ok: false, error: 'Missing transaction id' };
    const result = await repoDeleteTransaction(tx.id, { userId });
    await reloadTransactions();
    return result;
  }, [userId, userRole, reloadTransactions]);

  // ── Group / member / person mutations (throw on error for the modal) ────
  const onInviteMember = useCallback(async (email: string, role: 'admin' | 'member') => {
    if (isOnline(userId)) {
      const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      if (!profile) throw new Error('User email not found. Please ensure the user is registered before adding them to the group.');
      const { error } = await supabase.from('group_members').insert({ group_id: activeGroup?.id, user_id: (profile as { id: string }).id, email, role });
      if (error) throw new Error(error.message);
      await reload();
    } else {
      const REGISTERED = ['me@example.com', 'partner@example.com', 'child@example.com', 'friend@example.com', 'guest@example.com', 'arifin@miu.com', 'arifin@example.com'];
      if (!REGISTERED.includes(email.toLowerCase())) throw new Error('User email not found. Please ensure the user is registered before adding them to the group.');
      const updated = [...groupMembers, { id: 'local-mem-' + Date.now(), group_id: activeGroup?.id || 'local-group-1', user_id: 'mock-user-' + Date.now(), email, role, created_at: new Date().toISOString() }];
      setGroupMembers(updated);
      lsWrite(LS_KEYS.members, updated);
    }
  }, [userId, activeGroup?.id, groupMembers, reload]);

  const onUpdateMemberRole = useCallback(async (memberId: string, role: 'admin' | 'member') => {
    if (isOnline(userId)) {
      const { error } = await supabase.from('group_members').update({ role }).eq('id', memberId);
      if (error) throw new Error(error.message);
      await reload();
    } else {
      const updated = groupMembers.map((m) => (m.id === memberId ? { ...m, role } : m));
      setGroupMembers(updated);
      lsWrite(LS_KEYS.members, updated);
    }
  }, [userId, groupMembers, reload]);

  const onRemoveMember = useCallback(async (memberId: string) => {
    if (isOnline(userId)) {
      const { error } = await supabase.from('group_members').delete().eq('id', memberId);
      if (error) throw new Error(error.message);
      await reload();
    } else {
      const updated = groupMembers.filter((m) => m.id !== memberId);
      setGroupMembers(updated);
      lsWrite(LS_KEYS.members, updated);
    }
  }, [userId, groupMembers, reload]);

  const onAddPerson = useCallback(async (name: string, email: string | null, iconKey: string) => {
    if (isOnline(userId)) {
      const { error } = await supabase.from('people').insert({ user_id: userId, group_id: activeGroup?.id, name: name.trim(), icon: iconKey, email: email ? email.trim() : null });
      if (error) throw new Error(error.message);
      await reload();
    } else {
      const customPpl = lsRead<any[]>(LS_KEYS.people, []);
      customPpl.push({ id: 'local-p-' + Date.now(), user_id: 'demo-local-user', name: name.trim(), icon: iconKey, email: email ? email.trim() : null });
      lsWrite(LS_KEYS.people, customPpl);
      loadFromLocalStorage();
    }
  }, [userId, activeGroup?.id, reload, loadFromLocalStorage]);

  const onDeletePerson = useCallback(async (personId: string) => {
    if (isOnline(userId)) {
      const { error } = await supabase.from('people').delete().eq('id', personId);
      if (error) throw new Error(error.message);
      await reload();
    } else {
      lsWrite(LS_KEYS.people, lsRead<any[]>(LS_KEYS.people, []).filter((p) => p.id !== personId));
      loadFromLocalStorage();
    }
  }, [userId, reload, loadFromLocalStorage]);

  const reorderAccounts = useCallback((orderedIds: string[]) => {
    lsWrite(LS_KEYS.accountOrder, orderedIds);
    setAccountsList((prev) => applyOrder(prev, orderedIds));
  }, []);

  const onUpdateGroupName = useCallback(async (groupId: string, newName: string) => {
    if (isOnline(userId)) {
      const { error } = await supabase.from('groups').update({ name: newName }).eq('id', groupId);
      if (error) throw new Error(error.message);
      await reload();
    } else {
      const localGroup = { id: groupId, name: newName };
      setActiveGroup(localGroup);
      lsWrite(LS_KEYS.group, localGroup);
    }
  }, [userId, reload]);

  return {
    accountsList, peopleList, categoriesList, transactionsList,
    activeGroup, groupMembers, userRole, ledgerViewMode, setLedgerViewMode,
    selectedAccount, setSelectedAccount, selectedPerson, setSelectedPerson,
    dataLoading, reload, reloadTransactions, resetToDefaults,
    saveTransaction, removeTransaction, reorderAccounts,
    onInviteMember, onUpdateMemberRole, onRemoveMember, onAddPerson, onDeletePerson, onUpdateGroupName,
  };
}
