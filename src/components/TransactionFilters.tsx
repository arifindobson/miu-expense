import { useState } from 'react';
import { Search, X, ChevronDown, Calendar, DollarSign, Filter } from 'lucide-react';
import type { ThemeConfig, TransactionFilter, Category } from '../types';

interface TransactionFiltersProps {
  filter: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  categories: Category[];
  t: ThemeConfig;
}

const DEFAULT_FILTER: TransactionFilter = {
  searchQuery: '',
  categoryName: null,
  dateFrom: null,
  dateTo: null,
  amountMin: null,
  amountMax: null,
  type: 'all',
};

export { DEFAULT_FILTER };

export default function TransactionFilters({
  filter,
  onFilterChange,
  categories,
  t,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    filter.categoryName,
    filter.dateFrom || filter.dateTo,
    filter.amountMin !== null || filter.amountMax !== null,
    filter.type !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFilterChange({ ...DEFAULT_FILTER, searchQuery: filter.searchQuery });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Search Bar */}
      <div className={`flex items-center gap-2 px-3 py-2 ${t.surface} border ${t.surfaceBorder} rounded-2xl transition-all ${t.primaryRing}`}>
        <Search className={`w-4 h-4 ${t.textSub} shrink-0`} />
        <input
          type="text"
          placeholder="Search transactions..."
          value={filter.searchQuery}
          onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
          className={`flex-1 bg-transparent border-none focus:outline-none text-sm ${t.textMain} ${t.placeholder} min-w-0`}
        />
        {filter.searchQuery && (
          <button
            onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
            className={`p-0.5 ${t.textSub} hover:text-rose-400 rounded-full transition-colors`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-1.5 rounded-lg transition-all ${
            isExpanded || activeFilterCount > 0
              ? `${t.primarySoft} ${t.primarySoftText}`
              : `${t.textSub} ${t.surfaceHover}`
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Filters Panel */}
      {isExpanded && (
        <div className="animate-filter-down flex flex-col gap-3 px-1">
          {/* Type Toggle Pills */}
          <div className="flex gap-1.5">
            {(['all', 'expense', 'income'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onFilterChange({ ...filter, type })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filter.type === type
                    ? `${t.primary} shadow-sm`
                    : `${t.surface} border ${t.surfaceBorder} ${t.textMuted} ${t.surfaceHover}`
                }`}
              >
                {type === 'all' ? 'All' : type === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          {/* Category Selector */}
          <div className="relative">
            <label className={`text-[10px] ${t.textSub} font-semibold uppercase tracking-wider block mb-1 px-1`}>Category</label>
            <div className={`flex items-center gap-2 px-3 py-2 ${t.surface} border ${t.surfaceBorder} rounded-xl`}>
              <select
                value={filter.categoryName || ''}
                onChange={(e) => onFilterChange({ ...filter, categoryName: e.target.value || null })}
                className={`flex-1 bg-transparent border-none focus:outline-none text-sm ${t.textMain} appearance-none cursor-pointer`}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className={`w-4 h-4 ${t.textSub} shrink-0 pointer-events-none`} />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-[10px] ${t.textSub} font-semibold uppercase tracking-wider block mb-1 px-1`}>From</label>
              <div className={`flex items-center gap-2 px-3 py-2 ${t.surface} border ${t.surfaceBorder} rounded-xl`}>
                <Calendar className={`w-3.5 h-3.5 ${t.textSub} shrink-0`} />
                <input
                  type="date"
                  value={filter.dateFrom || ''}
                  onChange={(e) => onFilterChange({ ...filter, dateFrom: e.target.value || null })}
                  className={`flex-1 bg-transparent border-none focus:outline-none text-xs ${t.textMain} min-w-0`}
                />
              </div>
            </div>
            <div>
              <label className={`text-[10px] ${t.textSub} font-semibold uppercase tracking-wider block mb-1 px-1`}>To</label>
              <div className={`flex items-center gap-2 px-3 py-2 ${t.surface} border ${t.surfaceBorder} rounded-xl`}>
                <Calendar className={`w-3.5 h-3.5 ${t.textSub} shrink-0`} />
                <input
                  type="date"
                  value={filter.dateTo || ''}
                  onChange={(e) => onFilterChange({ ...filter, dateTo: e.target.value || null })}
                  className={`flex-1 bg-transparent border-none focus:outline-none text-xs ${t.textMain} min-w-0`}
                />
              </div>
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-[10px] ${t.textSub} font-semibold uppercase tracking-wider block mb-1 px-1`}>Min Amount</label>
              <div className={`flex items-center gap-2 px-3 py-2 ${t.surface} border ${t.surfaceBorder} rounded-xl`}>
                <DollarSign className={`w-3.5 h-3.5 ${t.textSub} shrink-0`} />
                <input
                  type="number"
                  placeholder="0"
                  value={filter.amountMin ?? ''}
                  onChange={(e) => onFilterChange({ ...filter, amountMin: e.target.value ? parseFloat(e.target.value) : null })}
                  className={`flex-1 bg-transparent border-none focus:outline-none text-xs ${t.textMain} ${t.placeholder} min-w-0`}
                />
              </div>
            </div>
            <div>
              <label className={`text-[10px] ${t.textSub} font-semibold uppercase tracking-wider block mb-1 px-1`}>Max Amount</label>
              <div className={`flex items-center gap-2 px-3 py-2 ${t.surface} border ${t.surfaceBorder} rounded-xl`}>
                <DollarSign className={`w-3.5 h-3.5 ${t.textSub} shrink-0`} />
                <input
                  type="number"
                  placeholder="∞"
                  value={filter.amountMax ?? ''}
                  onChange={(e) => onFilterChange({ ...filter, amountMax: e.target.value ? parseFloat(e.target.value) : null })}
                  className={`flex-1 bg-transparent border-none focus:outline-none text-xs ${t.textMain} ${t.placeholder} min-w-0`}
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors self-end px-2 py-1"
            >
              Clear all filters ({activeFilterCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
