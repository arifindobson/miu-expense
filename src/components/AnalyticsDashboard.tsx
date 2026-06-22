import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { ThemeConfig, Transaction, Category } from '../types';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  categories: Category[];
  t: ThemeConfig;
}

const CHART_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4',
  '#84cc16', '#e879f9',
];

type Period = 'weekly' | 'monthly';

export default function AnalyticsDashboard({
  transactions,
  categories,
  t,
}: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<Period>('monthly');

  // ─── DATA COMPUTATION ──────────────────────────────────────
  const now = new Date();

  const periodTransactions = useMemo(() => {
    const filtered = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      if (period === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return txDate >= weekAgo && txDate <= now;
      } else {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
    });
    return filtered;
  }, [transactions, period]);

  const totalIncome = periodTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalExpense = periodTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // Previous period comparison
  const prevPeriodTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      if (period === 'weekly') {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return txDate >= twoWeeksAgo && txDate < weekAgo;
      } else {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          txDate.getMonth() === prevMonth.getMonth() &&
          txDate.getFullYear() === prevMonth.getFullYear()
        );
      }
    });
  }, [transactions, period]);

  const prevTotalExpense = prevPeriodTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const expenseChange = prevTotalExpense > 0
    ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100
    : 0;

  // ─── BAR CHART DATA ────────────────────────────────────────
  const barData = useMemo(() => {
    const expenseTransactions = periodTransactions.filter(tx => tx.type === 'expense');

    if (period === 'weekly') {
      const days: { label: string; amount: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayTotal = expenseTransactions
          .filter((tx) => tx.date === key)
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        days.push({ label: dayLabel, amount: dayTotal });
      }
      return days;
    } else {
      // Monthly: group by week of month
      const weeks: { label: string; amount: number }[] = [];
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const weekCount = Math.ceil(daysInMonth / 7);
      
      for (let w = 0; w < weekCount; w++) {
        const startDay = w * 7 + 1;
        const endDay = Math.min(startDay + 6, daysInMonth);
        const weekTotal = expenseTransactions
          .filter((tx) => {
            const day = new Date(tx.date).getDate();
            return day >= startDay && day <= endDay;
          })
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);
        weeks.push({ label: `W${w + 1}`, amount: weekTotal });
      }
      return weeks;
    }
  }, [periodTransactions, period]);

  const maxBarValue = Math.max(...barData.map((d) => d.amount), 1);

  // ─── DONUT CHART DATA ──────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const expenseTransactions = periodTransactions.filter(tx => tx.type === 'expense');
    const categoryMap = new Map<string, number>();

    expenseTransactions.forEach((tx) => {
      const name = tx.category_name || 'Other';
      categoryMap.set(name, (categoryMap.get(name) || 0) + (tx.amount || 0));
    });

    const sorted = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return sorted;
  }, [periodTransactions]);

  const donutTotal = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);

  // SVG donut segments
  const donutSegments = useMemo(() => {
    const circumference = 2 * Math.PI * 70; // radius = 70
    let accumulatedOffset = 0;
    return categoryBreakdown.map((cat, i) => {
      const ratio = donutTotal > 0 ? cat.amount / donutTotal : 0;
      const strokeLength = ratio * circumference;
      const gap = circumference - strokeLength;
      const offset = accumulatedOffset;
      accumulatedOffset += strokeLength;
      return {
        ...cat,
        color: CHART_COLORS[i % CHART_COLORS.length],
        strokeDasharray: `${strokeLength} ${gap}`,
        strokeDashoffset: -offset,
        percentage: Math.round(ratio * 100),
      };
    });
  }, [categoryBreakdown, donutTotal]);

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
    return amount.toLocaleString();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-5 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-[11px] ${t.textSub} font-semibold uppercase tracking-wider`}>Financial Insights</span>
          <h2 className="text-xl font-extrabold leading-none mt-1">Analytics</h2>
        </div>
      </div>

      {/* Period Toggle */}
      <div className={`flex gap-1 p-1 ${t.surface} rounded-2xl border ${t.surfaceBorder}`}>
        {(['weekly', 'monthly'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              period === p
                ? `${t.primary} shadow-sm`
                : `${t.textMuted} ${t.surfaceHover}`
            }`}
          >
            {p === 'weekly' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Income vs Expense Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <span className={`text-[10px] ${t.textSub} font-semibold uppercase`}>Income</span>
          </div>
          <span className="text-lg font-extrabold text-emerald-500 block">
            +Rp {formatAmount(totalIncome)}
          </span>
        </div>
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <span className={`text-[10px] ${t.textSub} font-semibold uppercase`}>Expense</span>
          </div>
          <span className="text-lg font-extrabold text-rose-500 block">
            -Rp {formatAmount(totalExpense)}
          </span>
          {prevTotalExpense > 0 && (
            <div className={`flex items-center gap-1 mt-1 text-[10px] font-semibold ${expenseChange > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {expenseChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(expenseChange).toFixed(0)}% vs last {period === 'weekly' ? 'week' : 'month'}
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
        <h3 className="font-bold text-sm mb-3">Spending Overview</h3>
        <div className="flex items-end justify-between gap-1.5 h-[140px]">
          {barData.map((bar, i) => {
            const heightPercent = maxBarValue > 0 ? (bar.amount / maxBarValue) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                {bar.amount > 0 && (
                  <span className={`text-[8px] font-bold ${t.textSub} whitespace-nowrap`}>
                    {formatAmount(bar.amount)}
                  </span>
                )}
                <div className="w-full flex justify-center flex-1 items-end">
                  <div
                    className="w-full max-w-[32px] rounded-t-lg animate-chart-grow"
                    style={{
                      height: `${Math.max(heightPercent, bar.amount > 0 ? 4 : 0)}%`,
                      background: `linear-gradient(to top, ${CHART_COLORS[i % CHART_COLORS.length]}dd, ${CHART_COLORS[i % CHART_COLORS.length]}88)`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                </div>
                <span className={`text-[10px] font-semibold ${t.textSub}`}>{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donut Chart + Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
          <h3 className="font-bold text-sm mb-4">Category Breakdown</h3>

          <div className="flex items-center gap-4">
            {/* SVG Donut */}
            <div className="relative w-[140px] h-[140px] shrink-0">
              <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
                {/* Background circle */}
                <circle
                  cx="90" cy="90" r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  className={`${t.textSub} opacity-10`}
                />
                {/* Segments */}
                {donutSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="90" cy="90" r="70"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="20"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    className="animate-donut"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[9px] ${t.textSub} font-semibold uppercase`}>Total</span>
                <span className="text-sm font-extrabold">Rp {formatAmount(donutTotal)}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[140px] no-scrollbar">
              {donutSegments.slice(0, 6).map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className={`text-[11px] ${t.textMain} font-medium truncate flex-1`}>
                    {seg.name}
                  </span>
                  <span className={`text-[10px] ${t.textSub} font-bold shrink-0`}>
                    {seg.percentage}%
                  </span>
                </div>
              ))}
              {donutSegments.length > 6 && (
                <span className={`text-[10px] ${t.textSub} font-medium`}>
                  +{donutSegments.length - 6} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Categories List */}
      {categoryBreakdown.length > 0 && (
        <div className={`p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface}`}>
          <h3 className="font-bold text-sm mb-3">Top Spending Categories</h3>
          <div className="space-y-3">
            {categoryBreakdown.slice(0, 5).map((cat, i) => {
              const percentage = donutTotal > 0 ? (cat.amount / donutTotal) * 100 : 0;
              const catObj = categories.find(c => c.name === cat.name);
              const CatIcon = catObj?.icon;
              const iconColor = catObj?.color || 'text-slate-500';
              
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.bg} border ${t.surfaceBorder} ${iconColor} shrink-0`}>
                    {CatIcon ? <CatIcon className="w-4 h-4" /> : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold truncate">{cat.name}</span>
                      <span className={`text-[10px] ${t.textSub} font-semibold shrink-0 ml-2`}>
                        Rp {cat.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full ${t.surface} border ${t.surfaceBorder} overflow-hidden`}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {periodTransactions.length === 0 && (
        <div className={`flex flex-col items-center justify-center p-10 rounded-2xl border border-dashed ${t.border} text-center space-y-2 mt-4`}>
          <span className={`text-3xl`}>📊</span>
          <p className={`text-xs ${t.textSub} font-medium`}>No transactions this {period === 'weekly' ? 'week' : 'month'}</p>
          <p className={`text-[10px] ${t.textSub}`}>Start logging expenses to see your analytics</p>
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-4 shrink-0" />
    </div>
  );
}
