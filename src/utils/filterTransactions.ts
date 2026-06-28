import type { Transaction, TransactionFilter } from '../types';

/**
 * Pure transaction filter used by the Home ledger. Extracted from the component
 * so the search / category / submitter / date / amount / type / ledger-view rules
 * can be unit-tested independently.
 */
export function filterTransactions(
  list: Transaction[],
  filter: TransactionFilter,
  ledgerViewMode: 'individual' | 'group',
  userId: string | null,
): Transaction[] {
  return list.filter((tx) => {
    if (ledgerViewMode === 'individual' && tx.user_id !== userId) return false;

    if (filter.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      const hit =
        (tx.note || '').toLowerCase().includes(q) ||
        (tx.category_name || '').toLowerCase().includes(q) ||
        (tx.account_name || '').toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (filter.categoryName && tx.category_name !== filter.categoryName) return false;
    if (filter.submitterName && tx.person_name !== filter.submitterName) return false;
    if (filter.dateFrom && tx.date < filter.dateFrom) return false;
    if (filter.dateTo && tx.date > filter.dateTo) return false;
    if (filter.amountMin !== null && (tx.amount || 0) < filter.amountMin) return false;
    if (filter.amountMax !== null && (tx.amount || 0) > filter.amountMax) return false;
    if (filter.type !== 'all' && tx.type !== filter.type) return false;
    return true;
  });
}
