import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Lock, Plus, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ICON_MAP, AVAILABLE_ICONS, iconKeyFor } from '../constants/icons';
import { isOnline, newId } from '../data/persistence';
import SortableAccounts from './SortableAccounts';
import type { ThemeConfig, Account, Person, Category } from '../types';

export { ICON_MAP };

// Available colors to select in the custom color picker
const AVAILABLE_COLORS = [
  { class: 'text-blue-500', name: 'Blue', bgClass: 'bg-blue-500' },
  { class: 'text-emerald-500', name: 'Green', bgClass: 'bg-emerald-500' },
  { class: 'text-pink-500', name: 'Pink', bgClass: 'bg-pink-500' },
  { class: 'text-purple-500', name: 'Purple', bgClass: 'bg-purple-500' },
  { class: 'text-orange-500', name: 'Orange', bgClass: 'bg-orange-500' },
  { class: 'text-red-500', name: 'Red', bgClass: 'bg-red-500' },
  { class: 'text-cyan-500', name: 'Cyan', bgClass: 'bg-cyan-500' },
  { class: 'text-slate-500', name: 'Slate', bgClass: 'bg-slate-500' },
];

const LOCAL_KEY: Record<'account' | 'person' | 'category', string> = {
  account: 'miu_custom_accounts',
  person: 'miu_custom_people',
  category: 'miu_custom_categories',
};

interface ManageResourcesProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'account' | 'category' | 'person' | null;
  accounts: Account[];
  categories: Category[];
  people: Person[];
  onRefresh: () => void;
  onReorderAccounts: (orderedIds: string[]) => void;
  t: ThemeConfig;
  userId: string | null;
  groupId: string | null;
}

export default function ManageResources({
  isOpen,
  onClose,
  type,
  accounts,
  categories,
  people,
  onRefresh,
  onReorderAccounts,
  t,
  userId,
  groupId,
}: ManageResourcesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedColor, setSelectedColor] = useState('text-blue-500');
  const [currency, setCurrency] = useState('IDR');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmailInput('');
    setDescription('');
    setSelectedColor('text-blue-500');
    setCurrency('IDR');
    setBalance('0');
    const icons = type ? AVAILABLE_ICONS[type] || [] : [];
    setSelectedIcon(icons[0] || '');
  };

  // Reset to "add" mode whenever the manager opens or switches resource type
  useEffect(() => {
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, isOpen]);

  if (!isOpen || !type) return null;

  const iconsToChoose = AVAILABLE_ICONS[type] || [];
  const supportsColor = type === 'account' || type === 'category';
  const supportsDescription = type === 'account' || type === 'category';
  const label = type === 'person' ? 'Profile' : type;

  const startEdit = (item: Account | Category | Person) => {
    setEditingId(item.id || null);
    setName(item.name);
    setSelectedIcon(iconKeyFor(item.icon));
    if ('color' in item && item.color) setSelectedColor(item.color);
    if ('description' in item) setDescription(item.description || '');
    if ('currency' in item) setCurrency(item.currency || 'IDR');
    if ('balance' in item) setBalance(String(item.balance ?? 0));
    if ('email' in item) setEmailInput(item.email || '');
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Insert or update a DB row, gracefully retrying without `description` if that column isn't present yet. */
  const saveRow = async (table: string, fields: Record<string, unknown>) => {
    const body = editingId ? fields : { user_id: userId, group_id: groupId, ...fields };
    const exec = (b: Record<string, unknown>) =>
      editingId ? supabase.from(table).update(b).eq('id', editingId) : supabase.from(table).insert(b);
    let res = await exec(body);
    if (res.error && /description/i.test(res.error.message || '')) {
      const without = { ...body };
      delete without.description;
      res = await exec(without);
      if (!res.error) console.warn('`description` column not found — saved without it. Apply migrations/add_description.sql.');
    }
    if (res.error) throw res.error;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const iconKey = selectedIcon || iconsToChoose[0];
    const desc = description.trim() || null;
    const fields: Record<string, unknown> = { name: name.trim(), icon: iconKey };
    if (type === 'account') Object.assign(fields, { color: selectedColor, currency, balance: parseFloat(balance) || 0, description: desc });
    if (type === 'category') Object.assign(fields, { color: selectedColor, description: desc });
    if (type === 'person') Object.assign(fields, { email: emailInput.trim() || null });

    try {
      if (isOnline(userId)) {
        const table = type === 'account' ? 'accounts' : type === 'person' ? 'people' : 'categories';
        await saveRow(table, fields);
      } else {
        const key = LOCAL_KEY[type];
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (editingId) {
          const idx = existing.findIndex((i: { id: string }) => i.id === editingId);
          if (idx !== -1) existing[idx] = { ...existing[idx], ...fields };
        } else {
          existing.push({ id: newId(), user_id: 'demo-local-user', group_id: groupId, ...fields });
        }
        localStorage.setItem(key, JSON.stringify(existing));
      }
      resetForm();
      onRefresh();
    } catch (err) {
      console.error('Failed to save custom item:', err);
      alert('Error saving item. Please check console.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom item? Transactions linked to it will set reference to null.')) return;
    try {
      if (isOnline(userId)) {
        const table = type === 'account' ? 'accounts' : type === 'person' ? 'people' : 'categories';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      } else {
        const key = LOCAL_KEY[type];
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(existing.filter((item: { id: string }) => item.id !== id)));
      }
      if (editingId === id) resetForm();
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

  const inputCls = `w-full px-3 py-2 bg-white border ${t.border} rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${t.bg} animate-in slide-in-from-right duration-300 overflow-hidden`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-5 py-4 border-b ${t.border} shrink-0`}>
        <h3 className={`font-bold text-lg ${t.textMain}`}>{getHeadingText()}</h3>
        <button onClick={onClose} aria-label="Close" className={`p-1.5 ${t.textSub} ${t.surfaceHover} rounded-full transition-colors cursor-pointer`}>
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main content scroll container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">

        {/* ADD / EDIT FORM */}
        <section className={`p-4 border ${editingId ? 'border-indigo-300' : t.border} rounded-2xl ${t.surface}`}>
          <h4 className={`text-xs font-bold uppercase tracking-wider ${t.textMuted} mb-3 flex items-center gap-1.5`}>
            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? `Edit ${label}` : `Add New ${label}`}
          </h4>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1`}>Name</label>
              <input
                type="text"
                placeholder={type === 'account' ? 'e.g. Bank Jago' : type === 'person' ? 'e.g. Sister' : 'e.g. Entertainment'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                required
                className={inputCls}
              />
            </div>

            {/* Description (account & category) */}
            {supportsDescription && (
              <div>
                <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1`}>Description (optional)</label>
                <input
                  type="text"
                  placeholder={type === 'account' ? 'e.g. Joint savings account' : 'e.g. Monthly subscriptions'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={60}
                  className={inputCls}
                />
              </div>
            )}

            {/* Email (person) */}
            {type === 'person' && (
              <div>
                <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1`}>Associated Email</label>
                <input
                  type="email"
                  placeholder="e.g. farah@example.com (for auto-selection)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}

            {/* Currency + balance (account) */}
            {type === 'account' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1`}>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={`${inputCls} bg-white`}>
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                    <option value="SGD">SGD</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1`}>{editingId ? 'Balance' : 'Initial Balance'}</label>
                  <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} min={0} className={inputCls} />
                </div>
              </div>
            )}

            {/* Icon picker */}
            <div>
              <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1.5`}>Select Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {iconsToChoose.map((iconKey) => {
                  const IconComp = ICON_MAP[iconKey] || HelpCircleFallback;
                  const isSelected = selectedIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setSelectedIcon(iconKey)}
                      className={`h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected ? 'border-indigo-500 bg-indigo-50 text-indigo-600 font-bold shadow-sm' : `${t.border} bg-white text-slate-500 hover:bg-slate-50`
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color picker (account & category) */}
            {supportsColor && (
              <div>
                <label className={`block text-[10px] font-bold uppercase ${t.textSub} mb-1.5`}>Select Color</label>
                <div className="grid grid-cols-8 gap-2">
                  {AVAILABLE_COLORS.map((colorOpt) => {
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

            {/* Actions */}
            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm border ${t.border} ${t.textMuted} ${t.surfaceHover} transition-colors cursor-pointer`}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95 active:scale-[0.99] transition-all shadow-md flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Saving...' : editingId ? 'Save Changes' : `Add ${label}`}
              </button>
            </div>
          </form>
        </section>

        {/* LIST */}
        <section className="space-y-2">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${t.textMuted} mb-3`}>
            Current {type === 'person' ? 'Profiles' : `${type}s`}
          </h4>

          {type === 'account' && (
            <p className={`text-[10px] ${t.textSub} mb-2`}>Drag the handle to reorder — this sets the order in the account picker.</p>
          )}

          <div className="space-y-2">
            {type === 'account' && (
              <SortableAccounts accounts={accounts} t={t} onReorder={onReorderAccounts} onDelete={handleDelete} onEdit={startEdit} />
            )}

            {type === 'category' && categories.map((cat) => {
              const CatIcon = cat.icon;
              const isCustom = cat.user_id && cat.user_id !== 'system' && cat.user_id !== null;
              return (
                <div key={cat.id || cat.name} className={`flex items-center justify-between p-3 border ${t.border} rounded-2xl ${t.surface}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white border ${t.border} ${cat.color} shrink-0`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm block truncate">{cat.name}</span>
                      <span className={`text-[10px] ${t.textSub} block truncate`}>{cat.description || (isCustom ? 'Custom Category' : 'Default Category')}</span>
                    </div>
                  </div>
                  {isCustom ? (
                    <div className="flex items-center shrink-0">
                      <button onClick={() => startEdit(cat)} aria-label={`Edit ${cat.name}`} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat.id!)} aria-label={`Delete ${cat.name}`} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300 mr-2 shrink-0" />
                  )}
                </div>
              );
            })}

            {type === 'person' && people.map((p) => {
              const PIcon = p.icon;
              const isCustom = p.user_id && p.user_id !== 'system';
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 border ${t.border} rounded-2xl ${t.surface}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-white border ${t.border} shrink-0`}>
                      <PIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm block truncate">{p.name}</span>
                      <span className={`text-[10px] ${t.textSub} block truncate`}>
                        {p.email ? `Linked: ${p.email}` : isCustom ? 'Custom Profile' : 'Default Profile'}
                      </span>
                    </div>
                  </div>
                  {isCustom ? (
                    <div className="flex items-center shrink-0">
                      <button onClick={() => startEdit(p)} aria-label={`Edit ${p.name}`} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} aria-label={`Delete ${p.name}`} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300 mr-2 shrink-0" />
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
function HelpCircleFallback(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
