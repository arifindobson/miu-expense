import { useMemo, useState } from 'react';
import { Coffee, MapPin, Wallet, TrendingUp, TrendingDown, Users, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { rupiah, formatCompact } from '../utils/format';
import { getTransactionDateLabel } from '../utils/date';
import { DEFAULT_CATEGORIES } from '../constants/defaults';
import { Avatar, EmptyState, SectionLabel } from '../ui/kit';
import TransactionFilters, { DEFAULT_FILTER } from '../components/TransactionFilters';
import SwipeableTransaction from '../components/SwipeableTransaction';
import type { useAppData } from '../hooks/useAppData';
import type { Transaction, TransactionFilter } from '../types';

interface HomeScreenProps {
  data: ReturnType<typeof useAppData>;
  userId: string | null;
  onSelectTransaction: (tx: Transaction) => void;
  onPreview: (url: string) => void;
}

export default function HomeScreen({ data, userId, onSelectTransaction, onPreview }: HomeScreenProps) {
  const { t } = useTheme();
  const toast = useToast();
  const [filter, setFilter] = useState<TransactionFilter>(DEFAULT_FILTER);

  const { transactionsList, accountsList, categoriesList, peopleList, activeGroup, ledgerViewMode, setLedgerViewMode, userRole } = data;

  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((tx) => {
      if (ledgerViewMode === 'individual' && tx.user_id !== userId) return false;
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase();
        const hit = (tx.note || '').toLowerCase().includes(q)
          || (tx.category_name || '').toLowerCase().includes(q)
          || (tx.account_name || '').toLowerCase().includes(q);
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
  }, [transactionsList, filter, ledgerViewMode, userId]);

  const forTotals = ledgerViewMode === 'individual' ? transactionsList.filter((tx) => tx.user_id === userId) : transactionsList;
  const sum = (list: Transaction[], type: string) => list.filter((x) => x.type === type).reduce((s, x) => s + (x.amount || 0), 0);
  const allIncome = sum(forTotals, 'income');
  const allExpense = sum(forTotals, 'expense');
  const initialBalance = accountsList.reduce((s, a) => s + (a.balance || 0), 0);
  const totalBalance = initialBalance + allIncome - allExpense;

  // Net per account for the chip row
  const accountChips = useMemo(() => accountsList.map((acc) => {
    const net = (acc.balance || 0)
      + sum(forTotals.filter((x) => x.account_name === acc.name), 'income')
      - sum(forTotals.filter((x) => x.account_name === acc.name), 'expense');
    return { acc, net };
  }), [accountsList, forTotals]);

  const hasActiveFilters = !!(filter.searchQuery || filter.categoryName || filter.submitterName || filter.dateFrom || filter.dateTo || filter.amountMin !== null || filter.amountMax !== null || filter.type !== 'all');

  const handleDelete = async (tx: Transaction) => {
    const res = await data.removeTransaction(tx);
    if (!res.ok) toast.error(res.error || 'Failed to delete');
    else toast.success('Transaction deleted');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-5 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <SectionLabel>{ledgerViewMode === 'group' ? (activeGroup?.name || 'Family Ledger') : 'Personal Ledger'}</SectionLabel>
          <h2 className="text-xl font-extrabold leading-tight mt-1 truncate">
            {ledgerViewMode === 'group' ? 'Family Wallet' : 'My Wallet'}
          </h2>
        </div>
      </div>

      {/* Hero balance card */}
      <div className="p-5 rounded-[2rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-200/40 flex flex-col gap-4">
        <div>
          <span className="text-[10px] opacity-75 font-semibold uppercase tracking-wider">Total Balance</span>
          <h3 className="text-3xl font-extrabold tracking-tight mt-1">{rupiah(totalBalance)}</h3>
        </div>
        <div className="flex justify-between items-center border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-300" /></div>
            <div>
              <span className="text-[9px] opacity-70 block">Income</span>
              <span className="text-xs font-bold text-emerald-300">+{rupiah(allIncome)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-rose-300" /></div>
            <div>
              <span className="text-[9px] opacity-70 block">Expense</span>
              <span className="text-xs font-bold text-rose-300">-{rupiah(allExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account chips */}
      {accountChips.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {accountChips.map(({ acc, net }) => {
            const Icon = acc.icon || Wallet;
            return (
              <div key={acc.id} className={`shrink-0 min-w-[130px] p-3 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${t.bg} border ${t.surfaceBorder} flex items-center justify-center ${acc.color}`}><Icon className="w-4 h-4" /></div>
                  <span className={`text-[11px] font-bold truncate ${t.textMain}`}>{acc.name}</span>
                </div>
                <span className={`text-sm font-extrabold ${t.textMain}`}>Rp {formatCompact(net)}</span>
                <span className={`text-[9px] ${t.textSub} block`}>{acc.currency}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Ledger view toggle */}
      <div className={`flex p-1 ${t.surface} border ${t.surfaceBorder} rounded-2xl`}>
        {([['group', 'Group', Users], ['individual', 'My Ledger', User]] as const).map(([mode, label, Icon]) => (
          <button key={mode} onClick={() => setLedgerViewMode(mode)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${ledgerViewMode === mode ? `${t.primary} shadow-sm` : `${t.textMuted} ${t.surfaceHover}`}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Search & filters */}
      <TransactionFilters filter={filter} onFilterChange={setFilter} categories={categoriesList} people={peopleList} t={t} />

      {/* Transactions */}
      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm">
            {hasActiveFilters ? `Results (${filteredTransactions.length})` : 'Recent Transactions'}
          </h3>
          {hasActiveFilters && (
            <button onClick={() => setFilter(DEFAULT_FILTER)} className={`text-xs ${t.primaryText} font-semibold cursor-pointer`}>Clear Filters</button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          {filteredTransactions.length === 0 ? (
            <EmptyState
              emoji={hasActiveFilters ? '🔍' : '📝'}
              title={hasActiveFilters ? 'No matches' : 'No transactions yet'}
              subtitle={hasActiveFilters ? 'Try adjusting your filters' : 'Your logged expenses will appear here'}
            />
          ) : (
            filteredTransactions.map((tx) => {
              const categoryObj = categoriesList.find((c) => c.name === tx.category_name) || DEFAULT_CATEGORIES[0];
              const TxIcon = categoryObj?.icon || Coffee;
              const iconColor = categoryObj?.color || 'text-slate-500';
              const showSubmitter = ledgerViewMode === 'group' && tx.person_name && tx.person_name !== 'Me';
              const meta = [tx.category_name, tx.account_name, getTransactionDateLabel(tx.date)].filter(Boolean).join(' • ');

              return (
                <SwipeableTransaction key={tx.id || tx.created_at} transaction={tx} onEdit={onSelectTransaction} onDelete={handleDelete} t={t} isReadOnly={userRole === 'member'}>
                  <div className={`flex items-center gap-3 p-3 rounded-2xl border ${t.surfaceBorder} ${t.surface} transition-all`}>
                    <div className={`w-10 h-10 rounded-xl ${t.bg} border ${t.surfaceBorder} flex items-center justify-center ${iconColor} shrink-0`}>
                      <TxIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="font-bold text-sm block truncate">{tx.note || tx.category_name || 'Expense'}</span>
                      <span className={`text-[10px] ${t.textSub} block truncate`}>{meta}</span>
                      {typeof tx.location_lat === 'number' && typeof tx.location_lng === 'number' && (
                        <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-blue-500 font-medium">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span>{tx.location_lat.toFixed(3)}, {tx.location_lng.toFixed(3)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {showSubmitter && <Avatar name={tx.person_name} className="w-6 h-6" />}
                      {tx.receipt_url && (
                        <img src={tx.receipt_url} alt="Receipt" onClick={(e) => { e.stopPropagation(); onPreview(tx.receipt_url!); }}
                          className="w-8 h-8 rounded-lg border border-slate-200 object-cover cursor-pointer hover:scale-105 transition-transform shadow-sm" />
                      )}
                      <span className={`font-bold text-sm whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {tx.type === 'income' ? '+' : '-'}{rupiah(tx.amount)}
                      </span>
                    </div>
                  </div>
                </SwipeableTransaction>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
