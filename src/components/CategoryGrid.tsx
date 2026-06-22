import type { ComponentType } from 'react';
import type { ThemeConfig } from '../types';

interface Category {
  name: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
}

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: string;
  onSelect: (name: string) => void;
  t: ThemeConfig;
}

export default function CategoryGrid({ categories, selectedCategory, onSelect, t }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-4 gap-y-4 gap-x-2 px-4 py-4 pb-6">
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.name;
        const Icon = cat.icon;
        return (
          <button
            key={cat.name}
            onClick={() => onSelect(cat.name)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isSelected 
                ? `${t.primarySoft} border-2 ${t.primaryBorder} shadow-sm scale-105` 
                : `${t.bg} border ${t.surfaceBorder} ${t.surfaceHover}`
            }`}>
              <Icon className={`w-5 h-5 ${isSelected ? t.primaryText : cat.color}`} strokeWidth={1.5} />
            </div>
            <span className={`text-[11px] ${isSelected ? `${t.primarySoftText} font-medium` : t.textMuted} truncate w-full text-center`}>
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
