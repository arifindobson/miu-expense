import { useState, useEffect, useMemo } from 'react';
import { 
  X, Check, Sparkles, 
  Coffee, 
  Home, CreditCard, Smile, Banknote, Coins,
  ChevronDown, MapPin, Camera, Loader2,
  Users, Landmark, Palette, Bot, MoreHorizontal, Keyboard, BarChart3, LogOut
} from 'lucide-react';
import DatePickerModal from './components/DatePickerModal';
import CategoryGrid from './components/CategoryGrid';
import ReceiptScanner from './components/ReceiptScanner';
import SheetModals from './components/Modals';
import Keypad from './components/Keypad';
import ManageResources, { ICON_MAP } from './components/ManageResources';
import TransactionFilters, { DEFAULT_FILTER } from './components/TransactionFilters';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SwipeableTransaction from './components/SwipeableTransaction';
import TransactionDetailModal from './components/TransactionDetailModal';
import LoginScreen from './components/LoginScreen';
import GroupManagementModal from './components/GroupManagementModal';
import { supabase } from './lib/supabase';
import type { ThemeConfig, Account, Person, Category, Transaction, TransactionFilter, Group, GroupMember } from './types';

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'default-acc-1', name: 'Mandiri SkyZ', icon: ICON_MAP['CreditCard'], color: 'text-indigo-500', currency: 'IDR', balance: 0 },
  { id: 'default-acc-2', name: 'Cash', icon: ICON_MAP['Wallet'], color: 'text-emerald-500', currency: 'IDR', balance: 0 },
  { id: 'default-acc-3', name: 'Bank BCA', icon: ICON_MAP['Landmark'], color: 'text-blue-500', currency: 'IDR', balance: 0 },
];

const DEFAULT_PEOPLE: Person[] = [
  { id: 'default-p-1', name: 'Me', icon: ICON_MAP['Smile'] },
  { id: 'default-p-2', name: 'Family', icon: ICON_MAP['Users'] },
  { id: 'default-p-3', name: 'Friend', icon: ICON_MAP['User'] },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-cat-1', name: 'Food', icon: ICON_MAP['Utensils'], color: 'text-blue-500' },
  { id: 'default-cat-2', name: 'Communicat', icon: ICON_MAP['Smartphone'], color: 'text-slate-500' },
  { id: 'default-cat-3', name: 'Daily', icon: ICON_MAP['Coffee'], color: 'text-green-500' },
  { id: 'default-cat-4', name: 'Transport', icon: ICON_MAP['Bus'], color: 'text-orange-500' },
  { id: 'default-cat-5', name: 'Tip', icon: ICON_MAP['Ticket'], color: 'text-yellow-500' },
  { id: 'default-cat-6', name: 'Fees', icon: ICON_MAP['Globe'], color: 'text-indigo-500' },
  { id: 'default-cat-7', name: 'SaaS Subs', icon: ICON_MAP['Monitor'], color: 'text-purple-500' },
  { id: 'default-cat-8', name: 'Social', icon: ICON_MAP['GlassWater'], color: 'text-pink-500' },
  { id: 'default-cat-9', name: 'Housing', icon: ICON_MAP['Home'], color: 'text-rose-500' },
  { id: 'default-cat-10', name: 'Gifts', icon: ICON_MAP['Gift'], color: 'text-red-500' },
  { id: 'default-cat-11', name: 'Clothing', icon: ICON_MAP['Shirt'], color: 'text-cyan-500' },
  { id: 'default-cat-12', name: 'Entertainme', icon: ICON_MAP['Tv'], color: 'text-violet-500' },
];

// --- THEME CONFIGURATIONS ---
const THEMES: Record<string, ThemeConfig> = {
  'white-blue': {
    name: 'White & Blue', bg: 'bg-white', textMain: 'text-slate-900', textMuted: 'text-slate-500', textSub: 'text-slate-400', textSubHover: 'hover:text-slate-600', placeholder: 'placeholder:text-slate-400', border: 'border-slate-200', surface: 'bg-slate-50', surfaceHover: 'hover:bg-slate-100', surfaceBorder: 'border-slate-100', primary: 'bg-blue-500 hover:bg-blue-600 text-white', primaryText: 'text-blue-500', primarySoft: 'bg-blue-50', primarySoftText: 'text-blue-600', primaryBorder: 'border-blue-500', primarySoftBorder: 'border-blue-100', primaryRing: 'focus-within:border-blue-400 focus-within:ring-blue-50', primaryActiveOp: 'bg-blue-100 border border-blue-200 text-blue-600', toggleActive: 'bg-blue-500', keypadContainer: 'bg-white border-slate-100 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.08)]', btnNum: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/60', btnSpecial: 'bg-slate-50/50 hover:bg-slate-100 text-slate-600 border border-slate-100', inputCard: 'bg-white border-slate-200', modalBg: 'bg-white border-slate-200 shadow-xl', modalOverlay: 'bg-slate-900/20', successBg: 'bg-emerald-100', successIcon: 'text-emerald-500',
  },
  'white-green': {
    name: 'White & Green', bg: 'bg-white', textMain: 'text-slate-900', textMuted: 'text-slate-500', textSub: 'text-slate-400', textSubHover: 'hover:text-slate-600', placeholder: 'placeholder:text-slate-400', border: 'border-slate-200', surface: 'bg-slate-50', surfaceHover: 'hover:bg-slate-100', surfaceBorder: 'border-slate-100', primary: 'bg-emerald-500 hover:bg-emerald-600 text-white', primaryText: 'text-emerald-500', primarySoft: 'bg-emerald-50', primarySoftText: 'text-emerald-600', primaryBorder: 'border-emerald-500', primarySoftBorder: 'border-emerald-100', primaryRing: 'focus-within:border-emerald-400 focus-within:ring-emerald-50', primaryActiveOp: 'bg-emerald-100 border border-emerald-200 text-emerald-600', toggleActive: 'bg-emerald-500', keypadContainer: 'bg-white border-slate-100 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.08)]', btnNum: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/60', btnSpecial: 'bg-slate-50/50 hover:bg-slate-100 text-slate-600 border border-slate-100', inputCard: 'bg-white border-slate-200', modalBg: 'bg-white border-slate-200 shadow-xl', modalOverlay: 'bg-slate-900/20', successBg: 'bg-emerald-100', successIcon: 'text-emerald-500',
  },
  'white-pink': {
    name: 'White & Pink', bg: 'bg-white', textMain: 'text-slate-900', textMuted: 'text-slate-500', textSub: 'text-slate-400', textSubHover: 'hover:text-slate-600', placeholder: 'placeholder:text-slate-400', border: 'border-slate-200', surface: 'bg-slate-50', surfaceHover: 'hover:bg-slate-100', surfaceBorder: 'border-slate-100', primary: 'bg-pink-500 hover:bg-pink-600 text-white', primaryText: 'text-pink-500', primarySoft: 'bg-pink-50', primarySoftText: 'text-pink-600', primaryBorder: 'border-pink-500', primarySoftBorder: 'border-pink-100', primaryRing: 'focus-within:border-pink-400 focus-within:ring-pink-50', primaryActiveOp: 'bg-pink-100 border border-pink-200 text-pink-600', toggleActive: 'bg-pink-500', keypadContainer: 'bg-white border-slate-100 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.08)]', btnNum: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/60', btnSpecial: 'bg-slate-50/50 hover:bg-slate-100 text-slate-600 border border-slate-100', inputCard: 'bg-white border-slate-200', modalBg: 'bg-white border-slate-200 shadow-xl', modalOverlay: 'bg-slate-900/20', successBg: 'bg-emerald-100', successIcon: 'text-emerald-500',
  },
  'black-pink': {
    name: 'Black & Pink', bg: 'bg-slate-950', textMain: 'text-slate-100', textMuted: 'text-slate-400', textSub: 'text-slate-500', textSubHover: 'hover:text-slate-300', placeholder: 'placeholder:text-slate-500', border: 'border-slate-800', surface: 'bg-slate-900', surfaceHover: 'hover:bg-slate-800', surfaceBorder: 'border-slate-800', primary: 'bg-pink-600 hover:bg-pink-700 text-white', primaryText: 'text-pink-500', primarySoft: 'bg-pink-500/10', primarySoftText: 'text-pink-400', primaryBorder: 'border-pink-500', primarySoftBorder: 'border-pink-500/20', primaryRing: 'focus-within:border-pink-500/50 focus-within:ring-pink-500/20', primaryActiveOp: 'bg-pink-500/20 border border-pink-500/30 text-pink-400', toggleActive: 'bg-pink-600', keypadContainer: 'bg-slate-900 border-slate-800 border-t shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.5)]', btnNum: 'bg-slate-950 hover:bg-slate-800 text-slate-100 border border-slate-800', btnSpecial: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700', inputCard: 'bg-slate-950 border-slate-800', modalBg: 'bg-slate-900 border-slate-800 shadow-2xl', modalOverlay: 'bg-black/60', successBg: 'bg-emerald-500/20', successIcon: 'text-emerald-400',
  }
};

const deduplicateByName = <T extends { name: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getTransactionDateLabel = (dateStr: string) => {
  const getLocalYMD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const today = getLocalYMD();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function App() {
  const [currentTheme, setCurrentTheme] = useState('white-blue');
  const t = THEMES[currentTheme];

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [transactionType, setTransactionType] = useState('expense');
  
  const [successState, setSuccessState] = useState(false);
  
  // Feature states
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Camera & Image states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Calculator states
  const [prevAmount, setPrevAmount] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [isNewInput, setIsNewInput] = useState(false);

  // Pickers states
  const getLocalYMD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [date, setDate] = useState(getLocalYMD());
  const [activeModal, setActiveModal] = useState<'account' | 'person' | 'theme' | 'date' | null>(null);
  const [activeTab, setActiveTab] = useState<'input' | 'home' | 'analytics' | 'others'>('input');

  const [userId, setUserId] = useState<string | null>(null);
  const [accountsList, setAccountsList] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [peopleList, setPeopleList] = useState<Person[]>(DEFAULT_PEOPLE);
  const [categoriesList, setCategoriesList] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [manageType, setManageType] = useState<'account' | 'category' | 'person' | null>(null);

  const [selectedAccount, setSelectedAccount] = useState<Account>(DEFAULT_ACCOUNTS[0]);
  const [selectedPerson, setSelectedPerson] = useState<Person>(DEFAULT_PEOPLE[0]);

  // Search & Filter state
  const [filter, setFilter] = useState<TransactionFilter>(DEFAULT_FILTER);

  // Edit mode state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);

  // Group / Family Ledger States
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member'>('owner');
  const [ledgerViewMode, setLedgerViewMode] = useState<'individual' | 'group'>('group');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Filtered transactions (memoized)
  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((tx) => {
      // View mode filter (individual vs group)
      if (ledgerViewMode === 'individual' && tx.user_id !== userId) {
        return false;
      }
      // Search query
      if (filter.searchQuery) {
        const q = filter.searchQuery.toLowerCase();
        const matchNote = (tx.note || '').toLowerCase().includes(q);
        const matchCategory = (tx.category_name || '').toLowerCase().includes(q);
        const matchAccount = (tx.account_name || '').toLowerCase().includes(q);
        if (!matchNote && !matchCategory && !matchAccount) return false;
      }
      // Category filter
      if (filter.categoryName && tx.category_name !== filter.categoryName) return false;
      // Submitter filter
      if (filter.submitterName && tx.person_name !== filter.submitterName) return false;
      // Date range
      if (filter.dateFrom && tx.date < filter.dateFrom) return false;
      if (filter.dateTo && tx.date > filter.dateTo) return false;
      // Amount range
      if (filter.amountMin !== null && (tx.amount || 0) < filter.amountMin) return false;
      if (filter.amountMax !== null && (tx.amount || 0) > filter.amountMax) return false;
      // Type filter
      if (filter.type !== 'all' && tx.type !== filter.type) return false;
      return true;
    });
  }, [transactionsList, filter, ledgerViewMode, userId]);

  // Auth: Check existing session on mount + listen for auth changes
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const keepLoggedIn = localStorage.getItem('miu_keep_logged_in');
          if (keepLoggedIn === 'true') {
            setUserId(session.user.id);
            setUserEmail(session.user.email || null);
            setIsAuthenticated(true);
            loadAllResources(session.user.id);
          } else {
            // Sign out if not "keep me logged in"
            await supabase.auth.signOut();
            setUserId(null);
            setUserEmail(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      }
      setAuthLoading(false);
    };
    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        setIsAuthenticated(true);
      } else {
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (uid: string) => {
    setUserId(uid);
    setIsAuthenticated(true);
    loadAllResources(uid);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out failed:', err);
    }
    localStorage.removeItem('miu_keep_logged_in');
    setUserId(null);
    setUserEmail(null);
    setIsAuthenticated(false);
    setTransactionsList([]);
    setAccountsList(DEFAULT_ACCOUNTS);
    setPeopleList(DEFAULT_PEOPLE);
    setCategoriesList(DEFAULT_CATEGORIES);
  };

  const seedDefaultCategoriesToDb = async (uid: string) => {
    try {
      const seeds = DEFAULT_CATEGORIES.map(cat => {
        const iconKey = Object.keys(ICON_MAP).find(key => ICON_MAP[key] === cat.icon) || 'Utensils';
        return {
          user_id: uid,
          name: cat.name,
          icon: iconKey,
          color: cat.color
        };
      });
      await supabase.from('categories').insert(seeds);
      console.log('Seeded default categories to Supabase.');
    } catch (err) {
      console.warn('Failed to seed default categories:', err);
    }
  };

  const loadAllResources = async (activeUid: string | null) => {
    let activeEmail = userEmail;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        activeEmail = session.user.email;
      }
    } catch (e) {}

    if (activeUid && activeUid !== 'demo-local-user') {
      try {
        // 0. Fetch Group Membership & Details (seeding if empty)
        let { data: memberships, error: memError } = await supabase
          .from('group_members')
          .select('*, groups(*)')
          .or(`user_id.eq.${activeUid},email.eq.${activeEmail || ''}`);

        if (memError) {
          console.error('Failed to fetch memberships:', memError);
        }

        let selectedMembership = memberships && memberships.length > 0 ? memberships[0] : null;

        // If no group memberships, seed a default group on the fly
        if (!selectedMembership) {
          const groupName = `${activeEmail ? activeEmail.split('@')[0] : 'Family'}'s Ledger`;
          const { data: newGroup, error: groupErr } = await supabase
            .from('groups')
            .insert({ name: groupName })
            .select()
            .single();

          if (groupErr || !newGroup) {
            throw new Error(groupErr?.message || 'Failed to create default group');
          }

          const { data: newMember, error: newMemberErr } = await supabase
            .from('group_members')
            .insert({
              group_id: newGroup.id,
              user_id: activeUid,
              email: activeEmail || '',
              role: 'owner'
            })
            .select('*, groups(*)')
            .single();

          if (newMemberErr || !newMember) {
            throw new Error(newMemberErr?.message || 'Failed to create owner membership');
          }

          selectedMembership = newMember;
          memberships = [newMember];
        }

        let resolvedGroup = selectedMembership.groups || selectedMembership.group;
        if (Array.isArray(resolvedGroup)) {
          resolvedGroup = resolvedGroup[0];
        }
        if (!resolvedGroup) {
          resolvedGroup = { id: selectedMembership.group_id, name: 'Family Group' };
        }

        setActiveGroup(resolvedGroup);
        setUserRole(selectedMembership.role || 'member');

        // Fetch all group members for this group
        const { data: groupMembersData } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', resolvedGroup.id);
        
        const loadedMembers: GroupMember[] = (groupMembersData || []).map((m: any) => ({
          id: m.id,
          group_id: m.group_id,
          user_id: m.user_id,
          email: m.email,
          role: m.role,
          created_at: m.created_at
        }));
        setGroupMembers(loadedMembers);

        // 1. Fetch Accounts
        const { data: accData } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', activeUid)
          .order('created_at', { ascending: true });
          
        const loadedAccounts: Account[] = (accData || []).map((acc: any) => ({
          id: acc.id,
          user_id: acc.user_id,
          name: acc.name,
          icon: ICON_MAP[acc.icon] || DEFAULT_ACCOUNTS[0].icon,
          color: acc.color,
          currency: acc.currency,
          balance: parseFloat(acc.balance) || 0
        }));
        
        setAccountsList(deduplicateByName(loadedAccounts.length > 0 ? loadedAccounts : DEFAULT_ACCOUNTS));
        if (loadedAccounts.length > 0) {
          setSelectedAccount(prev => {
            const match = loadedAccounts.find(a => a.id === prev.id || a.name === prev.name);
            return match || loadedAccounts[0];
          });
        }

        // 2. Fetch People
        const { data: pplData } = await supabase
          .from('people')
          .select('*')
          .eq('user_id', activeUid)
          .order('created_at', { ascending: true });
          
        const loadedPeople: Person[] = (pplData || []).map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          icon: ICON_MAP[p.icon] || DEFAULT_PEOPLE[0].icon,
          email: p.email || null
        }));
        
        setPeopleList(deduplicateByName(loadedPeople.length > 0 ? loadedPeople : DEFAULT_PEOPLE));
        if (loadedPeople.length > 0) {
          setSelectedPerson(prev => {
            // 1. Match by email column
            if (activeEmail) {
              const emailMatch = loadedPeople.find(p => p.email && p.email.toLowerCase() === activeEmail.toLowerCase());
              if (emailMatch) return emailMatch;

              // 2. Match by email prefix (e.g. "arifin" for arifin@example.com)
              const emailPrefix = activeEmail.split('@')[0].toLowerCase();
              const prefixMatch = loadedPeople.find(p => p.name.toLowerCase() === emailPrefix);
              if (prefixMatch) return prefixMatch;
            }
            const match = loadedPeople.find(p => p.id === prev.id || p.name === prev.name);
            return match || loadedPeople[0];
          });
        }

        // 3. Fetch Categories
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .or(`user_id.is.null,user_id.eq.${activeUid}`)
          .order('created_at', { ascending: true });
          
        const loadedCategories: Category[] = (catData || []).map((cat: any) => ({
          id: cat.id,
          user_id: cat.user_id,
          name: cat.name,
          icon: ICON_MAP[cat.icon] || DEFAULT_CATEGORIES[0].icon,
          color: cat.color
        }));
        
        if (loadedCategories.length === 0) {
          await seedDefaultCategoriesToDb(activeUid);
          const { data: catDataRetry } = await supabase
            .from('categories')
            .select('*')
            .or(`user_id.is.null,user_id.eq.${activeUid}`)
            .order('created_at', { ascending: true });
          
          const loadedCategoriesRetry: Category[] = (catDataRetry || []).map((cat: any) => ({
            id: cat.id,
            user_id: cat.user_id,
            name: cat.name,
            icon: ICON_MAP[cat.icon] || DEFAULT_CATEGORIES[0].icon,
            color: cat.color
          }));
          setCategoriesList(deduplicateByName(loadedCategoriesRetry.length > 0 ? loadedCategoriesRetry : DEFAULT_CATEGORIES));
        } else {
          setCategoriesList(deduplicateByName(loadedCategories));
        }

        // 4. Fetch Group-based Transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('group_id', resolvedGroup.id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false });

        const loadedTransactions: Transaction[] = (txData || []).map((tx: any) => ({
          id: tx.id,
          user_id: tx.user_id,
          type: tx.type,
          amount: parseFloat(tx.amount) || 0,
          category_id: tx.category_id,
          category_name: tx.category_name,
          account_id: tx.account_id,
          account_name: tx.account_name,
          person_id: tx.person_id,
          person_name: tx.person_name,
          note: tx.note || '',
          date: tx.date,
          location_lat: tx.location_lat,
          location_lng: tx.location_lng,
          receipt_url: tx.receipt_url,
          group_id: tx.group_id,
          created_at: tx.created_at
        }));
        setTransactionsList(loadedTransactions);
      } catch (err) {
        console.error('Failed to load Supabase resources:', err);
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    // Accounts
    const customAccsStr = localStorage.getItem('miu_custom_accounts') || '[]';
    const customAccs = JSON.parse(customAccsStr).map((acc: any) => ({
      ...acc,
      icon: ICON_MAP[acc.icon] || DEFAULT_ACCOUNTS[0].icon
    }));
    const mergedAccs = deduplicateByName([...DEFAULT_ACCOUNTS, ...customAccs]);
    setAccountsList(mergedAccs);
    setSelectedAccount(prev => mergedAccs.find(a => a.id === prev.id || a.name === prev.name) || mergedAccs[0]);

    // People
    const customPplStr = localStorage.getItem('miu_custom_people') || '[]';
    const customPpl = JSON.parse(customPplStr).map((p: any) => ({
      ...p,
      icon: ICON_MAP[p.icon] || DEFAULT_PEOPLE[0].icon
    }));
    const mergedPpl = deduplicateByName([...DEFAULT_PEOPLE, ...customPpl]);
    setPeopleList(mergedPpl);
    setSelectedPerson(prev => mergedPpl.find(p => p.id === prev.id || p.name === prev.name) || mergedPpl[0]);

    // Categories
    const customCatsStr = localStorage.getItem('miu_custom_categories') || '[]';
    const customCats = JSON.parse(customCatsStr).map((cat: any) => ({
      ...cat,
      icon: ICON_MAP[cat.icon] || DEFAULT_CATEGORIES[0].icon
    }));
    const mergedCats = deduplicateByName([...DEFAULT_CATEGORIES, ...customCats]);
    setCategoriesList(mergedCats);

    // Group info
    const localGroupStr = localStorage.getItem('miu_active_group');
    let localGroup: Group;
    if (localGroupStr) {
      localGroup = JSON.parse(localGroupStr);
    } else {
      localGroup = { id: 'local-group-1', name: "Demo Family Ledger" };
      localStorage.setItem('miu_active_group', JSON.stringify(localGroup));
    }
    setActiveGroup(localGroup);

    const localRoleStr = localStorage.getItem('miu_user_role') || 'owner';
    setUserRole(localRoleStr as any);

    const localMembersStr = localStorage.getItem('miu_group_members');
    let localMembers: GroupMember[];
    if (localMembersStr) {
      localMembers = JSON.parse(localMembersStr);
    } else {
      localMembers = [
        { id: 'local-mem-1', group_id: localGroup.id, user_id: 'demo-local-user', email: 'me@example.com', role: 'owner' },
        { id: 'local-mem-2', group_id: localGroup.id, user_id: 'guest-1', email: 'partner@example.com', role: 'admin' },
        { id: 'local-mem-3', group_id: localGroup.id, user_id: 'guest-2', email: 'child@example.com', role: 'member' }
      ];
      localStorage.setItem('miu_group_members', JSON.stringify(localMembers));
    }
    setGroupMembers(localMembers);

    // Transactions
    const customTxStr = localStorage.getItem('miu_transactions') || '[]';
    const customTx = JSON.parse(customTxStr).map((tx: any) => ({
      ...tx,
      amount: parseFloat(tx.amount) || 0
    }));
    customTx.sort((a: any, b: any) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    setTransactionsList(customTx);
  };

  // ─── CALCULATOR & AI LOGIC ────────────────────────────────────────────────

  const performCalculation = () => {
    if (!operator || prevAmount === null) return amount;
    const a = parseFloat(prevAmount);
    const b = parseFloat(amount);
    let res = 0;
    switch (operator) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case 'x': res = a * b; break;
      case '/': res = b !== 0 ? a / b : 0; break;
      default: return amount;
    }
    return String(Math.round(res * 1000000) / 1000000);
  };

  const handleNumber = (val: string) => {
    if (isNewInput) {
      setAmount(val === '.' ? '0.' : val);
      setIsNewInput(false);
    } else {
      if (val === '.' && amount.includes('.')) return;
      setAmount(prev => prev === '0' && val !== '.' ? val : prev + val);
    }
  };

  const handleOperator = (op: string) => {
    if (operator && !isNewInput) {
      const result = performCalculation();
      setAmount(result);
      setPrevAmount(result);
    } else {
      setPrevAmount(amount);
    }
    setOperator(op);
    setIsNewInput(true);
  };

  const handleDelete = () => {
    if (isNewInput) return; 
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleActionClick = async () => {
    if (operator) {
      const result = performCalculation();
      setAmount(result);
      setPrevAmount(null);
      setOperator(null);
      setIsNewInput(true);
    } else {
      if (amount === '0') return; 

      const isEditing = editingTransaction !== null;
      if (isEditing && userRole === 'member') {
        alert("Permission Denied: Members cannot update transactions.");
        return;
      }

      const finalAmount = parseFloat(amount) || 0;
      const finalNote = note;
      const txDate = date;
      const txType = transactionType;
      const categoryName = selectedCategory;
      const accountName = selectedAccount.name;
      const personName = selectedPerson.name;
      
      let lat: number | null = null;
      let lng: number | null = null;
      
      if (locationEnabled && coordinates) {
        lat = coordinates.lat;
        lng = coordinates.lng;
      }

      setSuccessState(true);

      const selectedCategoryObj = categoriesList.find(c => c.name === categoryName);
      const categoryId = selectedCategoryObj?.id || null;
      const accountId = selectedAccount.id;
      const personId = selectedPerson.id;

      // Filter out mock/default UUIDs which fail foreign key database constraints
      const dbCategoryId = (categoryId && !categoryId.startsWith('default-')) ? categoryId : null;
      const dbAccountId = (accountId && !accountId.startsWith('default-')) ? accountId : null;
      const dbPersonId = (personId && !personId.startsWith('default-')) ? personId : null;

      // Attempt to save/update in Supabase database
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const activeUserId = session?.user?.id;

        if (activeUserId) {
          if (isEditing && editingTransaction?.id) {
            // UPDATE existing transaction
            const { error } = await supabase.from('transactions').update({
              type: txType,
              amount: finalAmount,
              category_id: dbCategoryId,
              category_name: categoryName,
              account_id: dbAccountId,
              account_name: accountName,
              person_id: dbPersonId,
              person_name: personName,
              note: finalNote,
              date: txDate,
              location_lat: lat,
              location_lng: lng,
              receipt_url: receiptImage,
              group_id: activeGroup?.id || null
            }).eq('id', editingTransaction.id);
            
            if (error) {
              console.error('Supabase transaction update failed:', error);
            } else {
              console.log('Transaction updated successfully in Supabase!');
            }
          } else {
            // INSERT new transaction
            const { error } = await supabase.from('transactions').insert({
              user_id: activeUserId,
              type: txType,
              amount: finalAmount,
              category_id: dbCategoryId,
              category_name: categoryName,
              account_id: dbAccountId,
              account_name: accountName,
              person_id: dbPersonId,
              person_name: personName,
              note: finalNote,
              date: txDate,
              location_lat: lat,
              location_lng: lng,
              receipt_url: receiptImage,
              group_id: activeGroup?.id || null
            });
            
            if (error) {
              console.error('Supabase transaction insert failed:', error);
              saveToLocalStorageFallback(categoryId, accountId, personId);
            } else {
              console.log('Transaction saved successfully to Supabase!');
            }
          }
        } else {
          if (isEditing && editingTransaction?.id) {
            updateLocalStorageTransaction(editingTransaction.id);
          } else {
            saveToLocalStorageFallback(categoryId, accountId, personId);
          }
        }
      } catch (err) {
        console.warn('Supabase offline/error. Saving to localStorage.', err);
        if (isEditing && editingTransaction?.id) {
          updateLocalStorageTransaction(editingTransaction.id);
        } else {
          saveToLocalStorageFallback(null, selectedAccount.id, selectedPerson.id);
        }
      }

      function saveToLocalStorageFallback(catId: string | null, accId: string, pplId: string) {
        const existingStr = localStorage.getItem('miu_transactions') || '[]';
        const existing = JSON.parse(existingStr);
        existing.push({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          user_id: 'demo-local-user',
          type: txType,
          amount: finalAmount,
          category_id: catId,
          category_name: categoryName,
          account_id: accId,
          account_name: accountName,
          person_id: pplId,
          person_name: personName,
          note: finalNote,
          date: txDate,
          location_lat: lat,
          location_lng: lng,
          receipt_url: receiptImage,
          group_id: activeGroup?.id || null,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('miu_transactions', JSON.stringify(existing));
        console.log('Transaction saved successfully to local storage (offline mode).');
      }

      function updateLocalStorageTransaction(txId: string) {
        const existingStr = localStorage.getItem('miu_transactions') || '[]';
        const existing = JSON.parse(existingStr);
        const idx = existing.findIndex((t: any) => t.id === txId);
        if (idx !== -1) {
          existing[idx] = {
            ...existing[idx],
            type: txType,
            amount: finalAmount,
            category_name: categoryName,
            account_name: accountName,
            person_name: personName,
            note: finalNote,
            date: txDate,
            location_lat: lat,
            location_lng: lng,
            receipt_url: receiptImage,
            group_id: activeGroup?.id || null,
          };
          localStorage.setItem('miu_transactions', JSON.stringify(existing));
          console.log('Transaction updated in local storage.');
        }
      }

      loadAllResources(userId);

      setTimeout(() => {
        setSuccessState(false);
        setAmount('0');
        setNote('');
        setSelectedCategory('Food');
        setPrevAmount(null);
        setOperator(null);
        setReceiptImage(null);
        setEditingTransaction(null);
      }, 2000);
    }
  };

  // ─── DELETE TRANSACTION ────────────────────────────────────
  const deleteTransaction = async (tx: Transaction) => {
    if (userRole === 'member') {
      alert("Permission Denied: Members cannot delete transactions.");
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id;

      if (activeUserId && tx.id) {
        const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
        if (error) {
          console.error('Supabase delete failed:', error);
        } else {
          console.log('Transaction deleted from Supabase.');
        }
      } else {
        // Delete from localStorage
        const existingStr = localStorage.getItem('miu_transactions') || '[]';
        const existing = JSON.parse(existingStr);
        const filtered = existing.filter((t: any) => t.id !== tx.id);
        localStorage.setItem('miu_transactions', JSON.stringify(filtered));
        console.log('Transaction deleted from local storage.');
      }
    } catch (err) {
      console.warn('Delete failed, removing from localStorage.', err);
      const existingStr = localStorage.getItem('miu_transactions') || '[]';
      const existing = JSON.parse(existingStr);
      const filtered = existing.filter((t: any) => t.id !== tx.id);
      localStorage.setItem('miu_transactions', JSON.stringify(filtered));
    }

    loadAllResources(userId);
  };

  // ─── START EDIT TRANSACTION ────────────────────────────────
  const startEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setAmount(String(tx.amount || 0));
    setNote(tx.note || '');
    setSelectedCategory(tx.category_name || 'Food');
    setTransactionType(tx.type);
    setDate(tx.date);
    setReceiptImage(tx.receipt_url || null);

    // Try to match account
    const matchedAccount = accountsList.find(a => a.id === tx.account_id || a.name === tx.account_name);
    if (matchedAccount) setSelectedAccount(matchedAccount);

    // Try to match person
    const matchedPerson = peopleList.find(p => p.id === tx.person_id || p.name === tx.person_name);
    if (matchedPerson) setSelectedPerson(matchedPerson);

    setActiveTab('input');
  };

  const cancelEdit = () => {
    setEditingTransaction(null);
    setAmount('0');
    setNote('');
    setSelectedCategory('Food');
    setTransactionType('expense');
    setDate(getLocalYMD());
    setReceiptImage(null);
    setPrevAmount(null);
    setOperator(null);
  };

  // ─── FAMILY GROUP MANAGEMENT ACTIONS ──────────────────────────
  const onInviteMember = async (email: string, role: 'admin' | 'member') => {
    if (userId && userId !== 'demo-local-user') {
      // 1. Query profiles (auth.users mirroring) for matching email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!profile) {
        throw new Error('User email not found. Please ensure the user is registered before adding them to the group.');
      }

      // 2. Immediately execute INSERT into group_members
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({
          group_id: activeGroup?.id,
          user_id: profile.id,
          email,
          role
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // 3. Immediately execute UPDATE on user's profile record to link group_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ group_id: activeGroup?.id })
        .eq('id', profile.id);

      if (updateError) {
        console.warn('Failed to link profile group_id:', updateError.message);
      }

      await loadAllResources(userId);
    } else {
      // Mock validation list of registered users
      const REGISTERED_MOCK_EMAILS = [
        'me@example.com',
        'partner@example.com',
        'child@example.com',
        'friend@example.com',
        'guest@example.com',
        'arifin@miu.com',
        'arifin@example.com'
      ];
      if (!REGISTERED_MOCK_EMAILS.includes(email.toLowerCase())) {
        throw new Error('User email not found. Please ensure the user is registered before adding them to the group.');
      }

      const newMember: GroupMember = {
        id: 'local-mem-' + Date.now(),
        group_id: activeGroup?.id || 'local-group-1',
        user_id: 'mock-user-' + Date.now(),
        email,
        role,
        created_at: new Date().toISOString()
      };
      const updated = [...groupMembers, newMember];
      setGroupMembers(updated);
      localStorage.setItem('miu_group_members', JSON.stringify(updated));
    }
  };

  const onUpdateMemberRole = async (memberId: string, role: 'admin' | 'member') => {
    if (userId && userId !== 'demo-local-user') {
      const { error } = await supabase
        .from('group_members')
        .update({ role })
        .eq('id', memberId);

      if (error) {
        throw new Error(error.message);
      }
      await loadAllResources(userId);
    } else {
      const updated = groupMembers.map(m => m.id === memberId ? { ...m, role } : m);
      setGroupMembers(updated);
      localStorage.setItem('miu_group_members', JSON.stringify(updated));
    }
  };

  const onRemoveMember = async (memberId: string) => {
    if (userId && userId !== 'demo-local-user') {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        throw new Error(error.message);
      }
      await loadAllResources(userId);
    } else {
      const updated = groupMembers.filter(m => m.id !== memberId);
      setGroupMembers(updated);
      localStorage.setItem('miu_group_members', JSON.stringify(updated));
    }
  };

  const onAddPerson = async (name: string, email: string | null, iconKey: string) => {
    if (userId && userId !== 'demo-local-user') {
      const { error } = await supabase
        .from('people')
        .insert({
          user_id: userId,
          name: name.trim(),
          icon: iconKey,
          email: email ? email.trim() : null
        });

      if (error) {
        throw new Error(error.message);
      }
      await loadAllResources(userId);
    } else {
      const customPplStr = localStorage.getItem('miu_custom_people') || '[]';
      const customPpl = JSON.parse(customPplStr);
      const newPerson = {
        id: 'local-p-' + Date.now(),
        user_id: 'demo-local-user',
        name: name.trim(),
        icon: iconKey,
        email: email ? email.trim() : null
      };
      customPpl.push(newPerson);
      localStorage.setItem('miu_custom_people', JSON.stringify(customPpl));
      loadFromLocalStorage();
    }
  };

  const onDeletePerson = async (personId: string) => {
    if (userId && userId !== 'demo-local-user') {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', personId);

      if (error) {
        throw new Error(error.message);
      }
      await loadAllResources(userId);
    } else {
      const customPplStr = localStorage.getItem('miu_custom_people') || '[]';
      const customPpl = JSON.parse(customPplStr);
      const filtered = customPpl.filter((p: any) => p.id !== personId);
      localStorage.setItem('miu_custom_people', JSON.stringify(filtered));
      loadFromLocalStorage();
    }
  };

  const onUpdateGroupName = async (groupId: string, newName: string) => {
    if (userId && userId !== 'demo-local-user') {
      const { error } = await supabase
        .from('groups')
        .update({ name: newName })
        .eq('id', groupId);

      if (error) {
        throw new Error(error.message);
      }
      await loadAllResources(userId);
    } else {
      const localGroup = { id: groupId, name: newName };
      setActiveGroup(localGroup);
      localStorage.setItem('miu_active_group', JSON.stringify(localGroup));
      loadFromLocalStorage();
    }
  };

  const handleLocationToggle = () => {
    if (locationEnabled) {
      setLocationEnabled(false);
      setCoordinates(null);
      setLocationError(null);
      setLocationLoading(false);
    } else {
      setLocationLoading(true);
      setLocationError(null);
      
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser.');
        setLocationLoading(false);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationLoading(false);
          setLocationEnabled(true);
        },
        (err) => {
          let msg = 'Failed to get location coordinates.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please allow location access in your browser settings.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'Location unavailable. Make sure GPS/location services are enabled and active.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out. Please try again.';
          }
          setLocationError(msg);
          setLocationLoading(false);
          setLocationEnabled(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  };


  const formatDisplayAmount = (str: string | number) => {
    const parts = str.toString().split('.');
    const formattedInt = new Intl.NumberFormat('en-US').format(parseFloat(parts[0]) || 0);
    return parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
  };

  const isToday = date === getLocalYMD();
  const dateDisplay = isToday ? 'TODAY' : new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-100 p-0 sm:p-4 overflow-hidden">
        <div className={`flex flex-col items-center justify-center h-full w-full max-w-md mx-auto ${t.bg} font-sans ${t.textMain} border-x ${t.border} overflow-hidden shadow-2xl sm:h-[800px] sm:rounded-[2.5rem] relative`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-semibold text-slate-500">Loading Miu Expense...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex items-center justify-center h-full w-full bg-slate-100 p-0 sm:p-4 overflow-hidden">
      <div className={`flex flex-col h-full w-full max-w-md mx-auto ${t.bg} font-sans ${t.textMain} border-x ${t.border} overflow-hidden shadow-2xl sm:h-[800px] sm:rounded-[2.5rem] relative transition-colors duration-300`}>
        
        {/* --- CAMERA OVERLAY --- */}
        <ReceiptScanner 
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScan={(imageSrc) => {
            setReceiptImage(imageSrc);
          }}
          userId={userId}
        />

        {/* Success Overlay */}
        <div 
          className={`absolute inset-0 z-50 flex items-center justify-center ${t.modalOverlay} backdrop-blur-sm transition-all duration-300 pointer-events-none ${
            successState ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className={`flex flex-col items-center gap-4 ${t.modalBg} p-8 rounded-3xl border ${t.border} text-center max-w-[80%]`}>
            <div className={`w-16 h-16 ${t.successBg} rounded-full flex items-center justify-center`}>
              <Check className={`w-8 h-8 ${t.successIcon} stroke-[3]`} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${t.textMain}`}>
                Saved Successfully
              </h3>
            </div>
          </div>
        </div>

        {/* Bottom Sheet Modals */}
        <SheetModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          accounts={accountsList}
          selectedAccount={selectedAccount}
          onSelectAccount={(acc) => { setSelectedAccount(acc); setActiveModal(null); }}
          people={peopleList}
          selectedPerson={selectedPerson}
          onSelectPerson={(p) => { setSelectedPerson(p); setActiveModal(null); }}
          currentTheme={currentTheme}
          onSelectTheme={(themeKey) => { setCurrentTheme(themeKey); setActiveModal(null); }}
          THEMES={THEMES}
          t={t}
        />

        <DatePickerModal
          isOpen={activeModal === 'date'}
          onClose={() => setActiveModal(null)}
          selectedDate={date}
          onConfirm={(newDate) => setDate(newDate)}
          t={t}
        />

        <TransactionDetailModal
          transaction={selectedTransactionForDetail}
          onClose={() => setSelectedTransactionForDetail(null)}
          onEditClick={(tx) => {
            setSelectedTransactionForDetail(null);
            startEditTransaction(tx);
          }}
          peopleList={peopleList}
          t={t}
          isReadOnly={userRole === 'member'}
        />

        <GroupManagementModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          activeGroup={activeGroup}
          groupMembers={groupMembers}
          userRole={userRole}
          onInviteMember={onInviteMember}
          onUpdateMemberRole={onUpdateMemberRole}
          onRemoveMember={onRemoveMember}
          peopleList={peopleList}
          onAddPerson={onAddPerson}
          onDeletePerson={onDeletePerson}
          onUpdateGroupName={onUpdateGroupName}
          t={t}
        />

        <ManageResources
          isOpen={manageType !== null}
          onClose={() => setManageType(null)}
          type={manageType}
          accounts={accountsList}
          categories={categoriesList}
          people={peopleList}
          onRefresh={() => loadAllResources(userId)}
          t={t}
          userId={userId}
        />

        {activeTab === 'input' && (
          <>
            {/* Edit Mode Banner */}
            {editingTransaction && (
              <div className={`flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-200 shrink-0 animate-in slide-in-from-top-2 duration-200`}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-amber-700">Editing Transaction</span>
                </div>
                <button 
                  onClick={cancelEdit}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Location Error Banner */}
            {locationError && (
              <div className={`flex items-center justify-between px-4 py-2 bg-rose-50 border-b border-rose-200 shrink-0 animate-in slide-in-from-top-2 duration-200`}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-rose-800">{locationError}</span>
                </div>
                <button 
                  onClick={() => setLocationError(null)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Header */}
            <header className={`flex items-center justify-between px-3 py-1.5 ${t.bg} shrink-0 transition-colors`}>
          <div className="flex items-center gap-0.5 -ml-1">
            <button onClick={() => setActiveModal('theme')} className={`p-1.5 ${t.textSub} ${t.textSubHover} rounded-full ${t.surfaceHover} transition-colors`}>
              <Palette className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setTransactionType(transactionType === 'expense' ? 'income' : 'expense')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm ${t.primary}`}
            >
              {transactionType === 'expense' ? (
                <>
                  <Banknote className="w-4 h-4" /> Expense
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" /> Income
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 -mr-1">
            {locationLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            ) : (
              <MapPin className={`w-3.5 h-3.5 ${locationEnabled ? t.primaryText : t.textSub}`} />
            )}
            <button 
              onClick={handleLocationToggle}
              disabled={locationLoading}
              className={`w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${
                locationEnabled ? t.toggleActive : t.surface
              } ${locationLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm ${
                locationEnabled ? 'translate-x-[18px] left-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">

          <CategoryGrid
            categories={categoriesList}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            t={t}
          />
        </div>

        {/* Bottom Keypad Area */}
        <div className={`${t.keypadContainer} rounded-t-3xl p-3 pb-2 flex flex-col gap-1 shrink-0 z-10 transition-colors duration-300 relative`}>
          {locationLoading && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50/60 border border-blue-100 rounded-xl animate-pulse mb-1">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                <span className="text-[10px] font-semibold text-blue-600">Fetching real-time GPS coordinates...</span>
              </div>
            </div>
          )}

          {/* Input Row */}
          <div className={`flex items-center gap-2.5 px-3 py-2 ${t.inputCard} border rounded-2xl shadow-sm ${t.primaryRing} transition-all`}>
            {/* CAMERA BUTTON / IMAGE THUMBNAIL (next to note) */}
            <div className="shrink-0 flex items-center">
              {!receiptImage ? (
                <button 
                  onClick={() => setIsCameraOpen(true)} 
                  className={`w-8 h-8 ${t.surface} border ${t.surfaceBorder} rounded-lg flex items-center justify-center ${t.surfaceHover} text-slate-400 hover:text-slate-600 transition-colors active:scale-95`}
                >
                  <Camera className="w-4 h-4" strokeWidth={2.5} />
                </button>
              ) : (
                <div className="relative w-8 h-8 animate-in scale-in duration-200">
                  <img 
                    src={receiptImage} 
                    alt="Receipt" 
                    onClick={() => setPreviewImage(receiptImage)}
                    className="w-8 h-8 rounded-lg border border-slate-200 object-cover bg-white cursor-pointer" 
                  />
                  <button 
                    onClick={() => setReceiptImage(null)} 
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-[2px] shadow-sm active:scale-90 transition-transform"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
            
            <input 
              type="text" 
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`flex-1 bg-transparent border-none focus:outline-none ${t.textMain} ${t.placeholder} text-sm min-w-0`}
            />
            
            <div className="flex flex-col items-end shrink-0 max-w-[50%]">
              <button onClick={() => setActiveModal('account')} className={`text-[9px] ${t.textSub} ${t.textSubHover} font-medium transition-colors text-right`}>
                {selectedAccount.name}({selectedAccount.currency})
              </button>
              <span className={`text-xl font-semibold ${t.textMain} tracking-tight leading-none mt-0.5 truncate w-full text-right`}>
                {formatDisplayAmount(amount)}
              </span>
            </div>
          </div>

          {/* Keypad Grid */}
          <Keypad
            onNumberPress={handleNumber}
            onOperatorPress={handleOperator}
            onDeletePress={handleDelete}
            onSubmitPress={handleActionClick}
            onPersonModalOpen={() => setActiveModal('person')}
            onDateModalOpen={() => setActiveModal('date')}
            onAccountModalOpen={() => setActiveModal('account')}
            operator={operator}
            dateDisplay={dateDisplay}
            selectedPerson={selectedPerson}
            selectedAccount={selectedAccount}
            t={t}
            locationLoading={locationLoading}
          />
        </div>
        </>
      )}

      {activeTab === 'home' && (() => {
        const transactionsForTotals = ledgerViewMode === 'individual'
          ? transactionsList.filter(tx => tx.user_id === userId)
          : transactionsList;

        const totalIncome = filteredTransactions
          .filter(tx => tx.type === 'income')
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);

        const totalExpense = filteredTransactions
          .filter(tx => tx.type === 'expense')
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);

        const totalInitialBalance = accountsList.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        const allIncome = transactionsForTotals.filter(tx => tx.type === 'income').reduce((s, tx) => s + (tx.amount || 0), 0);
        const allExpense = transactionsForTotals.filter(tx => tx.type === 'expense').reduce((s, tx) => s + (tx.amount || 0), 0);
        const totalBalance = totalInitialBalance + allIncome - allExpense;

        const hasActiveFilters = filter.searchQuery || filter.categoryName || filter.submitterName || filter.dateFrom || filter.dateTo || filter.amountMin !== null || filter.amountMax !== null || filter.type !== 'all';

        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-5 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[11px] ${t.textSub} font-semibold uppercase tracking-wider`}>
                  {ledgerViewMode === 'group' ? (activeGroup?.name || 'Family Ledger') : 'Personal Ledger'}
                </span>
                <h2 className="text-xl font-extrabold leading-none mt-1">
                  {ledgerViewMode === 'group' ? 'Family Wallet Dashboard' : 'My Wallet Dashboard'}
                </h2>
              </div>
              <button onClick={() => setActiveModal('person')} className={`w-10 h-10 ${t.surface} border ${t.surfaceBorder} rounded-full flex items-center justify-center shrink-0 hover:bg-slate-100 transition-colors`}>
                <Smile className="w-5 h-5 text-indigo-500" />
              </button>
            </div>

            {/* Total Balance Card */}
            <div className={`p-5 rounded-[2.5rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-100 flex flex-col gap-4`}>
              <div>
                <span className="text-[10px] opacity-75 font-semibold uppercase tracking-wider">Total Balance</span>
                <h3 className="text-3xl font-extrabold tracking-tight mt-1">Rp {totalBalance.toLocaleString()}</h3>
              </div>
              
              <div className="flex justify-between items-center border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-[9px] opacity-70 block">Income</span>
                    <span className="text-xs font-bold text-emerald-300">+Rp {totalIncome.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Banknote className="w-4 h-4 text-rose-300" />
                  </div>
                  <div>
                    <span className="text-[9px] opacity-70 block">Expense</span>
                    <span className="text-xs font-bold text-rose-300">-Rp {totalExpense.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger View Mode Selector */}
            <div className={`flex p-1 ${t.surface} border ${t.surfaceBorder} rounded-2xl shrink-0`}>
              <button
                onClick={() => setLedgerViewMode('group')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  ledgerViewMode === 'group'
                    ? `${t.primary} shadow-sm`
                    : `${t.textMuted} hover:${t.textMain}`
                }`}
              >
                👥 Group Ledger
              </button>
              <button
                onClick={() => setLedgerViewMode('individual')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  ledgerViewMode === 'individual'
                    ? `${t.primary} shadow-sm`
                    : `${t.textMuted} hover:${t.textMain}`
                }`}
              >
                👤 My Ledger Only
              </button>
            </div>

            {/* Search & Filters */}
            <TransactionFilters
              filter={filter}
              onFilterChange={setFilter}
              categories={categoriesList}
              people={peopleList}
              t={t}
            />

            {/* Recent Transactions List */}
            <div className="flex flex-col gap-3 flex-1 min-h-0">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">
                  {hasActiveFilters ? `Results (${filteredTransactions.length})` : 'Recent Transactions'}
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={() => setFilter(DEFAULT_FILTER)}
                    className={`text-xs ${t.primaryText} font-semibold cursor-pointer`}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                {filteredTransactions.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed ${t.border} text-center space-y-2`}>
                    <span className="text-2xl">{hasActiveFilters ? '🔍' : '📝'}</span>
                    <p className={`text-xs ${t.textSub}`}>
                      {hasActiveFilters ? 'No transactions match your filters' : 'No transactions found'}
                    </p>
                    <button 
                      onClick={() => hasActiveFilters ? setFilter(DEFAULT_FILTER) : setActiveTab('input')}
                      className={`text-xs font-bold ${t.primaryText} hover:underline`}
                    >
                      {hasActiveFilters ? 'Clear filters' : 'Add your first transaction'}
                    </button>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => {
                    const categoryObj = categoriesList.find(c => c.name === tx.category_name) || DEFAULT_CATEGORIES[0];
                    const TxIcon = categoryObj?.icon || Coffee;
                    const iconColor = categoryObj?.color || 'text-slate-500';

                    const metaParts = [
                      tx.category_name,
                      tx.account_name,
                      tx.person_name && tx.person_name !== 'Me' ? tx.person_name : null,
                      getTransactionDateLabel(tx.date)
                    ].filter(Boolean);
                    const metadata = metaParts.join(' • ');

                    return (
                      <SwipeableTransaction
                        key={tx.id || tx.created_at}
                        transaction={tx}
                        onEdit={(t) => setSelectedTransactionForDetail(t)}
                        onDelete={deleteTransaction}
                        t={t}
                        isReadOnly={userRole === 'member'}
                      >
                        <div className={`flex items-center gap-3 p-3 rounded-2xl border ${t.surfaceBorder} ${t.surface} hover:scale-[1.01] transition-all duration-200`}>
                          <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center ${iconColor} shrink-0`}>
                            <TxIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <span className="font-bold text-sm block truncate">{tx.note || tx.category_name || 'Expense'}</span>
                            <span className={`text-[10px] ${t.textSub} block truncate`}>{metadata}</span>
                            {(typeof tx.location_lat === 'number' && typeof tx.location_lng === 'number') && (
                              <div className="flex items-center gap-0.5 mt-0.5 text-[9px] text-blue-500 font-medium">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span>GPS: {tx.location_lat.toFixed(4)}, {tx.location_lng.toFixed(4)}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2.5 shrink-0">
                            {tx.receipt_url && (
                              <img 
                                src={tx.receipt_url} 
                                alt="Receipt Thumbnail" 
                                onClick={(e) => { e.stopPropagation(); setPreviewImage(tx.receipt_url!); }}
                                className="w-8 h-8 rounded-lg border border-slate-200 object-cover cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-sm"
                              />
                            )}
                            <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString()}
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
      })()}

      {activeTab === 'analytics' && (
        <AnalyticsDashboard
          transactions={transactionsList}
          categories={categoriesList}
          t={t}
        />
      )}

      {activeTab === 'others' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-5 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div>
            <span className={`text-[11px] ${t.textSub} font-semibold uppercase tracking-wider`}>App Configuration</span>
            <h2 className="text-xl font-extrabold leading-none mt-1">Settings & Info</h2>
          </div>

          {/* Config List */}
          <div className="space-y-2">
            <button 
              onClick={() => setActiveModal('theme')}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-95 transition-all text-left cursor-pointer`}
            >
              <div className={`w-10 h-10 rounded-xl bg-violet-50 text-violet-500 flex items-center justify-center`}>
                <Palette className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm block">Visual Theme</span>
                <span className={`text-[10px] ${t.textSub}`}>Currently: {t.name}</span>
              </div>
              <ChevronDown className="w-4 h-4 -rotate-90 opacity-60" />
            </button>

            <button 
              onClick={() => setIsGroupModalOpen(true)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-95 transition-all text-left cursor-pointer`}
            >
              <div className={`w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center`}>
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm block">Group Management Dashboard</span>
                <span className={`text-[10px] ${t.textSub}`}>Ledger members, access roles, and sharing profiles</span>
              </div>
              <ChevronDown className="w-4 h-4 -rotate-90 opacity-60" />
            </button>

            <button 
              onClick={() => {
                alert("Supabase Database Sync Triggered!\n(Data is synced to tables: transactions, profiles, accounts, people)");
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-95 transition-all text-left`}
            >
              <div className={`w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center`}>
                <Landmark className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm block">Supabase Sync Status</span>
                <span className={`text-[10px] ${t.textSub}`}>Linked with RLS policies</span>
              </div>
              <ChevronDown className="w-4 h-4 -rotate-90 opacity-60" />
            </button>

            <button 
              onClick={() => {
                alert("Miu Expense Tracker v1.0.0\nCreated with Vite, React, Tailwind CSS v4 & Supabase.");
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-95 transition-all text-left`}
            >
              <div className={`w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center`}>
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-sm block">About Miu Expense</span>
                <span className={`text-[10px] ${t.textSub}`}>Version 1.0.0 (Production Build)</span>
              </div>
            </button>

            {/* Resource Managers */}
            <div className="pt-2 space-y-2">
              <span className={`text-[10px] ${t.textSub} font-bold uppercase tracking-wider block px-1 mt-4 mb-2`}>Manage Custom Resources</span>
              
              <button 
                onClick={() => setManageType('account')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-95 transition-all text-left cursor-pointer`}
              >
                <div className={`w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm block">Accounts Settings</span>
                  <span className={`text-[10px] ${t.textSub}`}>Add or delete payment methods</span>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 opacity-60" />
              </button>

              <button 
                onClick={() => setManageType('category')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-95 transition-all text-left cursor-pointer`}
              >
                <div className={`w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center`}>
                  <Palette className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm block">Categories Settings</span>
                  <span className={`text-[10px] ${t.textSub}`}>Customize categories & labels</span>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 opacity-60" />
              </button>


            </div>
          </div>

          {/* User Profile Card with Sign Out */}
          <div className={`mt-auto p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface} flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-full ${t.primarySoft} ${t.primarySoftText} flex items-center justify-center font-bold`}>
              {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'ME'}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm block truncate">Active Session</span>
              <span className={`text-[10px] ${t.textSub} block truncate`}>{userEmail || 'No email'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors active:scale-95 flex items-center justify-center border border-transparent hover:border-rose-100"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          </div>
      )}

      {/* Bottom Navigation Menu */}
      <nav className={`flex items-center justify-around py-3 border-t ${t.border} ${t.bg} shrink-0 z-10 pb-safe transition-colors duration-300`}>
        <button 
          onClick={() => setActiveTab('input')}
          className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${
            activeTab === 'input' ? t.primaryText : t.textSub
          }`}
        >
          <Keyboard className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">Input</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${
            activeTab === 'home' ? t.primaryText : t.textSub
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${
            activeTab === 'analytics' ? t.primaryText : t.textSub
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">Analytics</span>
        </button>

        <button 
          onClick={() => setActiveTab('others')}
          className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${
            activeTab === 'others' ? t.primaryText : t.textSub
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">Others</span>
        </button>
      </nav>

      {/* Receipt Image Preview Modal */}
      {previewImage && (
        <div 
          className="absolute inset-0 z-[70] flex flex-col justify-between p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center text-white z-10 pt-safe">
            <button 
              onClick={() => setPreviewImage(null)} 
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm tracking-wider uppercase">Receipt Image Preview</span>
            <div className="w-10"></div>
          </div>

          {/* Image viewport */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img 
              src={previewImage} 
              alt="Receipt Preview" 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Bottom spacer */}
          <div className="h-10 shrink-0" />
        </div>
      )}
    </div>
  </div>
);
}
