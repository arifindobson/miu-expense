import { useState } from 'react';
import { 
  X, Trash2, Lock, Plus,
  CreditCard, Wallet, Landmark, Coins, Banknote,
  Smile, Users, User, Heart, Sparkles,
  Utensils, Coffee, Bus, Ticket, Globe, Monitor, 
  GlassWater, Home, Gift, Shirt, Tv, ShoppingBag
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ThemeConfig, Account, Person, Category } from '../types';

// Unified icon dictionary for mapping custom strings from DB to Lucide React components
export const ICON_MAP: Record<string, React.ComponentType<any>> = {
  CreditCard, Wallet, Landmark, Coins, Banknote,
  Smile, Users, User, Heart, Sparkles,
  Utensils, Coffee, Bus, Ticket, Globe, Monitor, 
  GlassWater, Home, Gift, Shirt, Tv, ShoppingBag
};

// Available icons to select in the custom icon picker
const AVAILABLE_ICONS = {
  account: ['CreditCard', 'Wallet', 'Landmark', 'Coins', 'Banknote'],
  person: ['Smile', 'Users', 'User', 'Heart', 'Sparkles'],
  category: ['Utensils', 'Coffee', 'Bus', 'Ticket', 'Globe', 'Monitor', 'GlassWater', 'Home', 'Gift', 'Shirt', 'Tv', 'ShoppingBag']
};

// Available colors to select in the custom color picker
const AVAILABLE_COLORS = [
  { class: 'text-blue-500', name: 'Blue', bgClass: 'bg-blue-500' },
  { class: 'text-emerald-500', name: 'Green', bgClass: 'bg-emerald-500' },
  { class: 'text-pink-500', name: 'Pink', bgClass: 'bg-pink-500' },
  { class: 'text-purple-500', name: 'Purple', bgClass: 'bg-purple-500' },
  { class: 'text-orange-500', name: 'Orange', bgClass: 'bg-orange-500' },
  { class: 'text-red-500', name: 'Red', bgClass: 'bg-red-500' },
  { class: 'text-cyan-500', name: 'Cyan', bgClass: 'bg-cyan-500' },
  { class: 'text-slate-500', name: 'Slate', bgClass: 'bg-slate-500' }
];

interface ManageResourcesProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'account' | 'category' | 'person' | null;
  accounts: Account[];
  categories: Category[];
  people: Person[];
  onRefresh: () => void;
  t: ThemeConfig;
  userId: string | null;
}

export default function ManageResources({
  isOpen,
  onClose,
  type,
  accounts,
  categories,
  people,
  onRefresh,
  t,
  userId
}: ManageResourcesProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedColor, setSelectedColor] = useState('text-blue-500');
  const [currency, setCurrency] = useState('IDR');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !type) return null;

  const iconsToChoose = AVAILABLE_ICONS[type] || [];
  
  // Set default icon selection if empty
  if (!selectedIcon && iconsToChoose.length > 0) {
    setSelectedIcon(iconsToChoose[0]);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      if (userId && userId !== 'demo-local-user') {
        // --- Supabase DB Mode ---
        if (type === 'account') {
          const { error } = await supabase.from('accounts').insert({
            user_id: userId,
            name: name.trim(),
            icon: selectedIcon || iconsToChoose[0],
            color: selectedColor,
            currency: currency,
            balance: parseFloat(balance) || 0
          });
          if (error) throw error;
        } else if (type === 'person') {
          const { error } = await supabase.from('people').insert({
            user_id: userId,
            name: name.trim(),
            icon: selectedIcon || iconsToChoose[0]
          });
          if (error) throw error;
        } else if (type === 'category') {
          const { error } = await supabase.from('categories').insert({
            user_id: userId,
            name: name.trim(),
            icon: selectedIcon || iconsToChoose[0],
            color: selectedColor
          });
          if (error) throw error;
        }
      } else {
        // --- Local Storage Mode ---
        const localKey = type === 'account' ? 'miu_custom_accounts' :
                           type === 'person' ? 'miu_custom_people' :
                           'miu_custom_categories';
        
        const existingStr = localStorage.getItem(localKey) || '[]';
        const existing = JSON.parse(existingStr);
        
        const newItem = {
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          user_id: 'demo-local-user',
          name: name.trim(),
          icon: selectedIcon || iconsToChoose[0],
          ...(type === 'account' && { color: selectedColor, currency, balance: parseFloat(balance) || 0 }),
          ...(type === 'category' && { color: selectedColor })
        };
        
        existing.push(newItem);
        localStorage.setItem(localKey, JSON.stringify(existing));
      }

      // Reset form & reload list
      setName('');
      setBalance('0');
      onRefresh();
    } catch (err) {
      console.error('Failed to create custom item:', err);
      alert('Error creating item. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom item? Transactions linked to it will set reference to null.')) return;
    
    try {
      if (userId && userId !== 'demo-local-user') {
        // --- Supabase DB Mode ---
        const table = type === 'account' ? 'accounts' :
                      type === 'person' ? 'people' :
                      'categories';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      } else {
        // --- Local Storage Mode ---
        const localKey = type === 'account' ? 'miu_custom_accounts' :
                           type === 'person' ? 'miu_custom_people' :
                           'miu_custom_categories';
        
        const existingStr = localStorage.getItem(localKey) || '[]';
        const existing = JSON.parse(existingStr);
        const filtered = existing.filter((item: any) => item.id !== id);
        localStorage.setItem(localKey, JSON.stringify(filtered));
      }
      onRefresh();
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Error deleting item. Please check console.');
    }
  };

  const getHeadingText = () => {
    switch (type) {
      case 'account': return 'Manage Accounts';
      case 'person': return 'Manage Sharing Profiles';
      case 'category': return 'Manage Categories';
      default: return 'Settings';
    }
  };

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${t.bg} animate-in slide-in-from-right duration-300 overflow-hidden`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-5 py-4 border-b ${t.border} shrink-0`}>
        <h3 className={`font-bold text-lg ${t.textMain}`}>{getHeadingText()}</h3>
        <button 
          onClick={onClose} 
          className={`p-1.5 ${t.textSub} ${t.surfaceHover} rounded-full transition-colors cursor-pointer`}
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main content scroll container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
        
        {/* ADD NEW FORM */}
        <section className={`p-4 border ${t.border} rounded-2xl ${t.surface}`}>
          <h4 className={`text-xs font-bold uppercase tracking-wider ${t.textMuted} mb-3 flex items-center gap-1.5`}>
            <Plus className="w-4 h-4" /> Add New {type === 'person' ? 'Profile' : type}
          </h4>
          
          <form onSubmit={handleSave} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1`}>Name</label>
              <input
                type="text"
                placeholder={type === 'account' ? 'e.g. Bank Jago' : type === 'person' ? 'e.g. Sister' : 'e.g. Entertainment'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={15}
                required
                className={`w-full px-3 py-2 bg-white border ${t.border} rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
              />
            </div>

            {/* Currency (Accounts Only) */}
            {type === 'account' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1`}>Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={`w-full px-3 py-2 bg-white border ${t.border} rounded-xl text-sm focus:outline-none focus:ring-1`}
                  >
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1`}>Initial Balance</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    min={0}
                    className={`w-full px-3 py-2 bg-white border ${t.border} rounded-xl text-sm focus:outline-none focus:ring-1`}
                  />
                </div>
              </div>
            )}

            {/* Icon Picker */}
            <div>
              <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1.5`}>Select Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {iconsToChoose.map(iconKey => {
                  const IconComp = ICON_MAP[iconKey] || HelpCircleFallback;
                  const isSelected = selectedIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setSelectedIcon(iconKey)}
                      className={`h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-bold shadow-sm' 
                          : `${t.border} bg-white text-slate-500 hover:bg-slate-50`
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Picker (Accounts and Categories Only) */}
            {(type === 'account' || type === 'category') && (
              <div>
                <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1.5`}>Select Color</label>
                <div className="grid grid-cols-8 gap-2">
                  {AVAILABLE_COLORS.map(colorOpt => {
                    const isSelected = selectedColor === colorOpt.class;
                    return (
                      <button
                        key={colorOpt.class}
                        type="button"
                        onClick={() => setSelectedColor(colorOpt.class)}
                        className={`w-full h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${colorOpt.bgClass} ${
                          isSelected ? 'ring-2 ring-indigo-500 scale-110 border-white' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95 active:scale-[0.99] transition-all shadow-md flex items-center justify-center disabled:opacity-50 cursor-pointer`}
            >
              {loading ? 'Adding...' : `Add ${type === 'person' ? 'Profile' : type}`}
            </button>
          </form>
        </section>

        {/* LIST & DELETE VIEW */}
        <section className="space-y-2">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${t.textMuted} mb-3`}>
            Current {type === 'person' ? 'Profiles' : type}s
          </h4>
          
          <div className="space-y-2">
            {type === 'account' && accounts.map(acc => {
              const AccIcon = acc.icon;
              const isCustom = acc.user_id && acc.user_id !== 'system';
              return (
                <div key={acc.id} className={`flex items-center justify-between p-3 border ${t.border} rounded-2xl ${t.surface}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white border ${t.border} ${acc.color}`}>
                      <AccIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">{acc.name}</span>
                      <span className={`text-[10px] ${t.textSub}`}>{acc.currency} • Bal: {acc.balance?.toLocaleString()}</span>
                    </div>
                  </div>
                  {isCustom ? (
                    <button 
                      onClick={() => handleDelete(acc.id)} 
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300 mr-2" />
                  )}
                </div>
              );
            })}

            {type === 'category' && categories.map(cat => {
              const CatIcon = cat.icon;
              const isCustom = cat.user_id && cat.user_id !== 'system' && cat.user_id !== null;
              return (
                <div key={cat.id || cat.name} className={`flex items-center justify-between p-3 border ${t.border} rounded-2xl ${t.surface}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white border ${t.border} ${cat.color}`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">{cat.name}</span>
                      <span className={`text-[10px] ${t.textSub}`}>{isCustom ? 'Custom Category' : 'Default Category'}</span>
                    </div>
                  </div>
                  {isCustom ? (
                    <button 
                      onClick={() => handleDelete(cat.id!)} 
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300 mr-2" />
                  )}
                </div>
              );
            })}

            {type === 'person' && people.map(p => {
              const PIcon = p.icon;
              const isCustom = p.user_id && p.user_id !== 'system';
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 border ${t.border} rounded-2xl ${t.surface}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white border ${t.border}`}>
                      <PIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block">{p.name}</span>
                      <span className={`text-[10px] ${t.textSub}`}>{isCustom ? 'Custom Profile' : 'Default Profile'}</span>
                    </div>
                  </div>
                  {isCustom ? (
                    <button 
                      onClick={() => handleDelete(p.id)} 
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300 mr-2" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// Fallback component in case an icon resolves to undefined
function HelpCircleFallback(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
