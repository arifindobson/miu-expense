import { describe, it, expect } from 'vitest';
import { filterTransactions } from './filterTransactions';
import type { Transaction, TransactionFilter } from '../types';

const base: TransactionFilter = {
  searchQuery: '', categoryName: null, submitterName: null,
  dateFrom: null, dateTo: null, amountMin: null, amountMax: null, type: 'all',
};

const tx = (over: Partial<Transaction>): Transaction => ({
  type: 'expense', amount: 1000, note: '', date: '2026-06-01',
  category_name: 'Food', account_name: 'Cash', person_name: 'Me', user_id: 'u1', ...over,
});

const list: Transaction[] = [
  tx({ id: '1', note: 'Lunch', amount: 50000, category_name: 'Food', user_id: 'u1' }),
  tx({ id: '2', note: 'Bus fare', amount: 5000, category_name: 'Transport', type: 'expense', user_id: 'u2' }),
  tx({ id: '3', note: 'Salary', amount: 9000000, type: 'income', category_name: 'Daily', user_id: 'u1' }),
];

describe('filterTransactions', () => {
  it('returns all with default filter in group view', () => {
    expect(filterTransactions(list, base, 'group', 'u1')).toHaveLength(3);
  });

  it('individual view keeps only the current user', () => {
    const out = filterTransactions(list, base, 'individual', 'u1');
    expect(out.map((t) => t.id)).toEqual(['1', '3']);
  });

  it('search matches note / category / account (case-insensitive)', () => {
    expect(filterTransactions(list, { ...base, searchQuery: 'lunch' }, 'group', 'u1')).toHaveLength(1);
    expect(filterTransactions(list, { ...base, searchQuery: 'transport' }, 'group', 'u1')).toHaveLength(1);
  });

  it('filters by type, category, and amount range', () => {
    expect(filterTransactions(list, { ...base, type: 'income' }, 'group', 'u1')).toHaveLength(1);
    expect(filterTransactions(list, { ...base, categoryName: 'Food' }, 'group', 'u1')).toHaveLength(1);
    expect(filterTransactions(list, { ...base, amountMin: 10000 }, 'group', 'u1').map((t) => t.id)).toEqual(['1', '3']);
    expect(filterTransactions(list, { ...base, amountMax: 10000 }, 'group', 'u1').map((t) => t.id)).toEqual(['2']);
  });

  it('filters by date range (inclusive)', () => {
    const out = filterTransactions(
      [tx({ id: 'a', date: '2026-05-01' }), tx({ id: 'b', date: '2026-06-15' })],
      { ...base, dateFrom: '2026-06-01', dateTo: '2026-06-30' }, 'group', 'u1',
    );
    expect(out.map((t) => t.id)).toEqual(['b']);
  });
});
