import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CalendarDays } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatCompact } from '../utils/format';
import { SectionLabel, EmptyState } from '../ui/kit';
import type { useAppData } from '../hooks/useAppData';
import type { Transaction } from '../types';

interface AnalyticsScreenProps {
  data: ReturnType<typeof useAppData>;
}

const CHART_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4', '#84cc16', '#e879f9'];
type Period = 'weekly' | 'monthly';

export default function AnalyticsScreen({ data }: AnalyticsScreenProps) {
  const { t } = useTheme();
  const { transactionsList: transactions, categoriesList: categories } = data;
  const [period, setPeriod] = useState<Period>('monthly');
  const now = new Date();

  const periodTx = useMemo(() => transactions.filter((tx) => {
    const d = new Date(tx.date);
    if (period === 'weekly') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo && d <= now;
    }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [transactions, period]);

  const sum = (list: Transaction[], type: string) => list.filter((x) => x.type === type).reduce((s, x) => s + (x.amount || 0), 0);
  const totalIncome = sum(periodTx, 'income');
  const totalExpense = sum(periodTx, 'expense');

  const prevTx = useMemo(() => transactions.filter((tx) => {
    const d = new Date(tx.date);
    if (period === 'weekly') {
      const twoW = new Date(); twoW.setDate(twoW.getDate() - 14);
      const oneW = new Date(); oneW.setDate(oneW.getDate() - 7);
      return d >= twoW && d < oneW;
    }
    const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === pm.getMonth() && d.getFullYear() === pm.getFullYear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [transactions, period]);
  const prevExpense = sum(prevTx, 'expense');
  const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0;

  const expenseTx = periodTx.filter((tx) => tx.type === 'expense');
  const daysElapsed = period === 'weekly' ? 7 : now.getDate();
  const avgPerDay = daysElapsed > 0 ? totalExpense / daysElapsed : 0;

  const barData = useMemo(() => {
    if (period === 'weekly') {
      const days: { label: string; amount: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1), amount: expenseTx.filter((tx) => tx.date === key).reduce((s, tx) => s + (tx.amount || 0), 0) });
      }
      return days;
    }
    const weeks: { label: string; amount: number }[] = [];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let w = 0; w < Math.ceil(daysInMonth / 7); w++) {
      const start = w * 7 + 1; const end = Math.min(start + 6, daysInMonth);
      weeks.push({ label: `W${w + 1}`, amount: expenseTx.filter((tx) => { const day = new Date(tx.date).getDate(); return day >= start && day <= end; }).reduce((s, tx) => s + (tx.amount || 0), 0) });
    }
    return weeks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodTx, period]);
  const maxBar = Math.max(...barData.map((d) => d.amount), 1);

  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    expenseTx.forEach((tx) => map.set(tx.category_name || 'Other', (map.get(tx.category_name || 'Other') || 0) + (tx.amount || 0)));
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodTx]);
  const donutTotal = breakdown.reduce((s, c) => s + c.amount, 0);

  const segments = useMemo(() => {
    const circ = 2 * Math.PI * 70; let acc = 0;
    return breakdown.map((cat, i) => {
      const ratio = donutTotal > 0 ? cat.amount / donutTotal : 0;
      const len = ratio * circ; const offset = acc; acc += len;
      return { ...cat, color: CHART_COLORS[i % CHART_COLORS.length], strokeDasharray: `${len} ${circ - len}`, strokeDashoffset: -offset, percentage: Math.round(ratio * 100) };
    });
  }, [breakdown, donutTotal]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-5 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <SectionLabel>Financial Insights</SectionLabel>
        <h2 className="text-xl font-extrabold leading-none mt-1">Analytics</h2>
      </div>

      {/* Period toggle */}
      <div className={`flex gap-1 p-1 ${t.surface} rounded-2xl border ${t.surfaceBorder}`}>
        {(['weekly', 'monthly'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${period === p ? `${t.primary} shadow-sm` : `${t.textMuted} ${t.surfaceHover}`}`}>
            {p === 'weekly' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Income / Expense */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /></div>
            <span className={`text-[10px] ${t.textSub} font-semibold uppercase`}>Income</span>
          </div>
          <span className="text-lg font-extrabold text-emerald-500 block">+Rp {formatCompact(totalIncome)}</span>
        </div>
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center"><TrendingDown className="w-3.5 h-3.5 text-rose-500" /></div>
            <span className={`text-[10px] ${t.textSub} font-semibold uppercase`}>Expense</span>
          </div>
          <span className="text-lg font-extrabold text-rose-500 block">-Rp {formatCompact(totalExpense)}</span>
          {prevExpense > 0 && (
            <div className={`flex items-center gap-1 mt-1 text-[10px] font-semibold ${expenseChange > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {expenseChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(expenseChange).toFixed(0)}% vs last {period === 'weekly' ? 'week' : 'month'}
            </div>
          )}
        </div>
      </div>

      {/* Insight strip */}
      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><CalendarDays className="w-4 h-4 text-indigo-500" /></div>
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] ${t.textSub} font-semibold uppercase block`}>Avg. spend / day</span>
          <span className="text-sm font-extrabold">Rp {formatCompact(avgPerDay)}</span>
        </div>
        {breakdown[0] && (
          <div className="text-right">
            <span className={`text-[10px] ${t.textSub} font-semibold uppercase block`}>Top category</span>
            <span className="text-sm font-extrabold truncate">{breakdown[0].name}</span>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
        <h3 className="font-bold text-sm mb-3">Spending Overview</h3>
        <div className="flex items-end justify-between gap-1.5 h-[140px]">
          {barData.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              {bar.amount > 0 && <span className={`text-[8px] font-bold ${t.textSub} whitespace-nowrap`}>{formatCompact(bar.amount)}</span>}
              <div className="w-full flex justify-center flex-1 items-end">
                <div className="w-full max-w-[28px] rounded-t-lg animate-chart-grow"
                  style={{ height: `${Math.max((bar.amount / maxBar) * 100, bar.amount > 0 ? 4 : 0)}%`, background: `linear-gradient(to top, ${CHART_COLORS[i % CHART_COLORS.length]}dd, ${CHART_COLORS[i % CHART_COLORS.length]}88)`, animationDelay: `${i * 60}ms` }} />
              </div>
              <span className={`text-[10px] font-semibold ${t.textSub}`}>{bar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Donut + legend */}
      {breakdown.length > 0 && (
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
          <h3 className="font-bold text-sm mb-4">Category Breakdown</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-[130px] h-[130px] shrink-0">
              <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
                <circle cx="90" cy="90" r="70" fill="none" stroke="currentColor" strokeWidth="20" className={`${t.textSub} opacity-10`} />
                {segments.map((seg, i) => (
                  <circle key={i} cx="90" cy="90" r="70" fill="none" stroke={seg.color} strokeWidth="20" strokeDasharray={seg.strokeDasharray} strokeDashoffset={seg.strokeDashoffset} strokeLinecap="round" className="animate-donut" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[9px] ${t.textSub} font-semibold uppercase`}>Total</span>
                <span className="text-sm font-extrabold">Rp {formatCompact(donutTotal)}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[130px] no-scrollbar">
              {segments.slice(0, 6).map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className={`text-[11px] ${t.textMain} font-medium truncate flex-1`}>{seg.name}</span>
                  <span className={`text-[10px] ${t.textSub} font-bold shrink-0`}>{seg.percentage}%</span>
                </div>
              ))}
              {segments.length > 6 && <span className={`text-[10px] ${t.textSub} font-medium`}>+{segments.length - 6} more</span>}
            </div>
          </div>
        </div>
      )}

      {/* Top categories */}
      {breakdown.length > 0 && (
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
          <h3 className="font-bold text-sm mb-3">Top Spending Categories</h3>
          <div className="space-y-3">
            {breakdown.slice(0, 5).map((cat, i) => {
              const pct = donutTotal > 0 ? (cat.amount / donutTotal) * 100 : 0;
              const catObj = categories.find((c) => c.name === cat.name);
              const CatIcon = catObj?.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.bg} border ${t.surfaceBorder} ${catObj?.color || 'text-slate-500'} shrink-0`}>
                    {CatIcon ? <CatIcon className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold truncate">{cat.name}</span>
                      <span className={`text-[10px] ${t.textSub} font-semibold shrink-0 ml-2`}>Rp {cat.amount.toLocaleString()}</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full ${t.surface} border ${t.surfaceBorder} overflow-hidden`}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {periodTx.length === 0 && (
        <EmptyState emoji="📊" title={`No transactions this ${period === 'weekly' ? 'week' : 'month'}`} subtitle="Start logging expenses to see your analytics" />
      )}
      <div className="h-4 shrink-0" />
    </div>
  );
}
