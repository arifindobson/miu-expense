import { useState, useEffect } from 'react';
import { 
  X, Check, Sparkles, Settings, 
  Smartphone, Coffee, Bus, Monitor, 
  Home, CreditCard, Smile, Banknote, Coins,
  ChevronDown, ChevronUp, MapPin, Image as ImageIcon, Camera, Equal,
  Users, Landmark, Palette, Bot, MoreHorizontal, Keyboard
} from 'lucide-react';
import DatePickerModal from './components/DatePickerModal';
import CategoryGrid from './components/CategoryGrid';
import ReceiptScanner from './components/ReceiptScanner';
import SheetModals from './components/Modals';
import Keypad from './components/Keypad';
import ManageResources, { ICON_MAP } from './components/ManageResources';
import { supabase } from './lib/supabase';
import type { ThemeConfig, Account, Person, Category } from './types';

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

export default function App() {
  const [currentTheme, setCurrentTheme] = useState('white-blue');
  const t = THEMES[currentTheme];

  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [transactionType, setTransactionType] = useState('expense');
  
  const [successState, setSuccessState] = useState<'manual' | 'ai' | null>(null);
  
  // Feature states
  const [isExpanded, setIsExpanded] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  // Camera & AI states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);

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
  const [activeTab, setActiveTab] = useState<'input' | 'home' | 'others'>('input');

  const [userId, setUserId] = useState<string | null>(null);
  const [accountsList, setAccountsList] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [peopleList, setPeopleList] = useState<Person[]>(DEFAULT_PEOPLE);
  const [categoriesList, setCategoriesList] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [manageType, setManageType] = useState<'account' | 'category' | 'person' | null>(null);

  const [selectedAccount, setSelectedAccount] = useState<Account>(DEFAULT_ACCOUNTS[0]);
  const [selectedPerson, setSelectedPerson] = useState<Person>(DEFAULT_PEOPLE[0]);

  // Demo Mode: Auto-login anonymously to Supabase on mount
  useEffect(() => {
    const initSession = async () => {
      let activeUid: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { data: signInData } = await supabase.auth.signInAnonymously();
          activeUid = signInData.user?.id || null;
          console.log('Demo Mode: Automatically signed in anonymously to Supabase.', activeUid);
        } else {
          activeUid = session.user.id;
          console.log('Demo Mode: Active session found.', activeUid);
        }
      } catch (err) {
        console.warn('Supabase service unavailable. Working in Local Demo Mode.', err);
        activeUid = 'demo-local-user';
      }
      setUserId(activeUid);
      loadAllResources(activeUid);
    };
    initSession();
  }, []);

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
    if (activeUid && activeUid !== 'demo-local-user') {
      try {
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
          icon: ICON_MAP[p.icon] || DEFAULT_PEOPLE[0].icon
        }));
        
        setPeopleList(deduplicateByName(loadedPeople.length > 0 ? loadedPeople : DEFAULT_PEOPLE));
        if (loadedPeople.length > 0) {
          setSelectedPerson(prev => {
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
    if (aiEnabled) return; // Prevent manual input when AI is active
    if (isNewInput) {
      setAmount(val === '.' ? '0.' : val);
      setIsNewInput(false);
    } else {
      if (val === '.' && amount.includes('.')) return;
      setAmount(prev => prev === '0' && val !== '.' ? val : prev + val);
    }
  };

  const handleOperator = (op: string) => {
    if (aiEnabled) return;
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
    if (aiEnabled || isNewInput) return; 
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleActionClick = async () => {
    if (operator && !aiEnabled) {
      const result = performCalculation();
      setAmount(result);
      setPrevAmount(null);
      setOperator(null);
      setIsNewInput(true);
    } else {
      // AI check: allow submit if AI is enabled, otherwise require amount > 0
      if (amount === '0' && !aiEnabled) return; 

      const finalAmount = parseFloat(amount) || 0;
      const finalNote = aiEnabled ? "AI auto-extracted receipt info" : note;
      const txDate = date;
      const txType = transactionType;
      const categoryName = selectedCategory;
      const accountName = selectedAccount.name;
      const personName = selectedPerson.name;
      
      let lat: number | null = null;
      let lng: number | null = null;
      
      if (locationEnabled) {
        // Jakarta default coordinates
        lat = -6.2088;
        lng = 106.8456;
      }

      setSuccessState(aiEnabled ? 'ai' : 'manual');

      // Attempt to save to Supabase database
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const activeUserId = session?.user?.id;

        const selectedCategoryObj = categoriesList.find(c => c.name === categoryName);
        const categoryId = selectedCategoryObj?.id || null;
        const accountId = selectedAccount.id;
        const personId = selectedPerson.id;

        if (activeUserId) {
          const { error } = await supabase.from('transactions').insert({
            user_id: activeUserId,
            type: txType,
            amount: finalAmount,
            category_id: categoryId,
            category_name: categoryName,
            account_id: accountId,
            account_name: accountName,
            person_id: personId,
            person_name: personName,
            note: finalNote,
            date: txDate,
            location_lat: lat,
            location_lng: lng,
            receipt_url: receiptImage
          });
          
          if (error) {
            console.error('Supabase transaction insert failed:', error);
            saveToLocalStorageFallback(categoryId, accountId, personId);
          } else {
            console.log('Transaction saved successfully to Supabase!');
          }
        } else {
          saveToLocalStorageFallback(categoryId, accountId, personId);
        }
      } catch (err) {
        console.warn('Supabase offline/error. Saving to localStorage.', err);
        saveToLocalStorageFallback(null, selectedAccount.id, selectedPerson.id);
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
          created_at: new Date().toISOString()
        });
        localStorage.setItem('miu_transactions', JSON.stringify(existing));
        console.log('Transaction saved successfully to local storage (offline mode).');
      }

      setTimeout(() => {
        setSuccessState(null);
        setAmount('0');
        setNote('');
        setSelectedCategory('Food');
        setIsExpanded(false);
        setPrevAmount(null);
        setOperator(null);
        setReceiptImage(null);
        setAiEnabled(false);
      }, 2000);
    }
  };


  const formatDisplayAmount = (str: string | number) => {
    const parts = str.toString().split('.');
    const formattedInt = new Intl.NumberFormat('en-US').format(parseFloat(parts[0]) || 0);
    return parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
  };

  const isToday = date === getLocalYMD();
  const dateDisplay = isToday ? 'TODAY' : new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  const AccountIcon = selectedAccount.icon;

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-0 sm:p-4">
      <div className={`flex flex-col h-[100dvh] w-full max-w-md mx-auto ${t.bg} font-sans ${t.textMain} border-x ${t.border} overflow-hidden shadow-2xl sm:h-[800px] sm:rounded-[2.5rem] relative transition-colors duration-300`}>
        
        {/* --- CAMERA OVERLAY --- */}
        <ReceiptScanner 
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScan={(imageSrc) => {
            setReceiptImage(imageSrc);
            setAiEnabled(true);
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
              {successState === 'ai' ? (
                <Sparkles className={`w-8 h-8 ${t.successIcon} animate-pulse`} />
              ) : (
                <Check className={`w-8 h-8 ${t.successIcon} stroke-[3]`} />
              )}
            </div>
            <div>
              <h3 className={`font-bold text-lg ${t.textMain}`}>
                {successState === 'ai' ? 'Record Saved!' : 'Saved Successfully'}
              </h3>
              {successState === 'ai' && (
                <p className={`text-sm ${t.textMuted} mt-1`}>AI will enrich details shortly.</p>
              )}
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
            {/* Header */}
            <header className={`flex items-center justify-between px-3 py-1.5 ${t.bg} shrink-0 transition-colors`}>
          <div className="flex items-center gap-0.5 -ml-1">
            <button className={`p-2 ${t.textSub} ${t.textSubHover} rounded-full ${t.surfaceHover} transition-colors`}>
              <X className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveModal('theme')} className={`p-1.5 ${t.textSub} ${t.textSubHover} rounded-full ${t.surfaceHover} transition-colors`}>
              <Palette className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setTransactionType('expense')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                transactionType === 'expense' 
                  ? `${t.primary} shadow-sm` 
                  : `${t.textMuted} ${t.surfaceHover}`
              }`}
            >
              <Banknote className="w-4 h-4" /> Expense
            </button>
            <button 
              onClick={() => setTransactionType('income')}
              className={`p-1.5 rounded-full transition-colors ${
                transactionType === 'income' ? `${t.primarySoft} ${t.primarySoftText}` : `${t.textSub} ${t.surfaceHover}`
              }`}
            >
              <Coins className="w-5 h-5" />
            </button>
            <button className={`p-1.5 ${t.textSub} ${t.surfaceHover} rounded-full transition-colors`}>
              <CreditCard className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={handleActionClick}
            className={`p-2 -mr-1 rounded-full transition-colors ${
              aiEnabled ? 'text-indigo-500 bg-indigo-50' : `${t.primaryText} ${t.primarySoft}`
            }`}
          >
            {aiEnabled ? <Sparkles className="w-6 h-6 animate-pulse" /> : operator ? <Equal className="w-6 h-6" /> : <Check className="w-6 h-6" />}
          </button>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          <div className="flex items-center gap-2 px-4 py-1 mt-1 overflow-x-auto no-scrollbar">
            <button className={`flex items-center gap-1.5 px-3 py-1.5 ${t.primarySoft} ${t.primarySoftText} rounded-full text-[13px] font-medium whitespace-nowrap`}>
              <Sparkles className="w-3.5 h-3.5" /> Recommended
            </button>
            <button className={`flex items-center gap-1.5 px-3 py-1.5 ${t.textMuted} ${t.surfaceHover} rounded-full text-[13px] font-medium whitespace-nowrap ml-auto`}>
              <Settings className="w-3.5 h-3.5" /> Setting
            </button>
          </div>

          <CategoryGrid
            categories={categoriesList}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
            t={t}
          />
        </div>

        {/* Bottom Keypad Area */}
        <div className={`${t.keypadContainer} rounded-t-3xl p-3 pb-2 flex flex-col gap-1 shrink-0 z-10 transition-colors duration-300 relative`}>
          
          {/* Toggle Bar / Utility Header */}
          <div className="flex items-center justify-between px-2 py-0">
            
            {/* CAMERA & AI SECTION */}
            <div className="flex-1 flex justify-start items-center gap-2">
              {!receiptImage ? (
                <button onClick={() => setIsCameraOpen(true)} className={`p-1 ${t.textSub} ${t.textSubHover} ${t.surfaceHover} rounded-full transition-colors active:scale-95`}>
                  <Camera className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
              ) : (
                <div className="flex items-center gap-2 animate-in slide-in-from-left-4">
                  <div className="relative">
                    <img src={receiptImage} alt="Receipt" className="w-8 h-8 rounded border border-slate-200 object-cover bg-white" />
                    <button onClick={() => {setReceiptImage(null); setAiEnabled(false);}} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-[2px] shadow-sm">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all shadow-sm ${
                      aiEnabled ? 'bg-indigo-500 text-white shadow-indigo-200 scale-105' : `${t.surface} ${t.textMuted} border ${t.surfaceBorder}`
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> AI
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className={`p-0.5 ${t.textSub} ${t.textSubHover} transition-colors ${t.surface} ${t.surfaceHover} rounded-full`}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            
            <div className="flex-1 flex justify-end items-center gap-2">
              <MapPin className={`w-3.5 h-3.5 ${locationEnabled ? t.primaryText : t.textSub}`} />
              <button 
                onClick={() => setLocationEnabled(!locationEnabled)}
                className={`w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none ${locationEnabled ? t.toggleActive : t.surface}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm ${locationEnabled ? 'translate-x-[18px] left-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Expanded Utility Panel */}
          {isExpanded && (
            <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200 mb-1">
              <button className={`w-[84px] h-[72px] ${t.btnSpecial} rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors group active:scale-95`}>
                <ImageIcon className={`w-6 h-6 ${t.textSub} transition-colors`} />
              </button>
              <button 
                onClick={() => setLocationEnabled(!locationEnabled)}
                className={`flex-1 h-[72px] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors active:scale-95 ${
                  locationEnabled 
                    ? `${t.primarySoft} border ${t.primaryBorder} ${t.primarySoftText}` 
                    : t.btnSpecial
                }`}
              >
                <MapPin className={`w-6 h-6 ${locationEnabled ? t.primaryText : t.textSub}`} />
                <span className="text-xs font-medium">{locationEnabled ? 'Location recorded' : 'Location disabled'}</span>
              </button>
            </div>
          )}

          {/* Input Row */}
          <div className={`flex items-center gap-2.5 px-3 py-2 ${t.inputCard} border rounded-2xl shadow-sm ${aiEnabled ? 'border-indigo-300 ring-2 ring-indigo-50 bg-indigo-50/50' : t.primaryRing} transition-all`}>
            <button onClick={() => setActiveModal('account')} className={`w-8 h-8 ${t.surface} border ${t.surfaceBorder} rounded-lg flex items-center justify-center shrink-0 ${t.surfaceHover} transition-colors`}>
              <AccountIcon className={`w-4 h-4 ${selectedAccount.color}`} />
            </button>
            
            <input 
              type="text" 
              placeholder={aiEnabled ? "AI will extract details..." : "Note"}
              value={aiEnabled ? "" : note}
              onChange={(e) => setNote(e.target.value)}
              disabled={aiEnabled}
              className={`flex-1 bg-transparent border-none focus:outline-none ${aiEnabled ? 'text-indigo-600 font-medium placeholder:text-indigo-400' : `${t.textMain} ${t.placeholder}`} text-sm min-w-0`}
            />
            
            <div className="flex flex-col items-end shrink-0 max-w-[50%]">
              <button onClick={() => setActiveModal('account')} className={`text-[9px] ${t.textSub} ${t.textSubHover} font-medium transition-colors text-right`}>
                {selectedAccount.name}({selectedAccount.currency})
              </button>
              <span className={`text-xl font-semibold ${aiEnabled ? 'text-indigo-600' : t.textMain} tracking-tight leading-none mt-0.5 truncate w-full text-right`}>
                {aiEnabled ? 'Auto (AI)' : formatDisplayAmount(amount)}
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
            operator={operator}
            aiEnabled={aiEnabled}
            dateDisplay={dateDisplay}
            selectedPerson={selectedPerson}
            t={t}
          />
          
          {/* Overlay Block for AI when enabled */}
          {aiEnabled && (
            <div className="absolute inset-x-3 bottom-3 top-[170px] z-20 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-indigo-900/80 backdrop-blur-sm text-indigo-50 px-4 py-3 rounded-2xl flex flex-col items-center gap-2 shadow-2xl animate-in zoom-in-95">
                <Bot className="w-8 h-8 text-indigo-300" />
                <p className="text-sm font-medium text-center">Auto-Analysis Active<br/><span className="text-xs font-normal text-indigo-200">Tap Sparkle button to save</span></p>
              </div>
            </div>
          )}
        </div>
        </>
      )}

      {activeTab === 'home' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar p-5 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-[11px] ${t.textSub} font-semibold uppercase tracking-wider`}>Welcome Back</span>
              <h2 className="text-xl font-extrabold leading-none mt-1">My Wallet Dashboard</h2>
            </div>
            <button onClick={() => setActiveModal('person')} className={`w-10 h-10 ${t.surface} border ${t.surfaceBorder} rounded-full flex items-center justify-center shrink-0 hover:bg-slate-100 transition-colors`}>
              <Smile className="w-5 h-5 text-indigo-500" />
            </button>
          </div>

          {/* Total Balance Card */}
          <div className={`p-5 rounded-[2.5rem] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-100 flex flex-col gap-4`}>
            <div>
              <span className="text-[10px] opacity-75 font-semibold uppercase tracking-wider">Total Balance</span>
              <h3 className="text-3xl font-extrabold tracking-tight mt-1">Rp 4,835,000</h3>
            </div>
            
            <div className="flex justify-between items-center border-t border-white/10 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <span className="text-[9px] opacity-70 block">Income</span>
                  <span className="text-xs font-bold text-emerald-300">+5,500,000</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-rose-300" />
                </div>
                <div>
                  <span className="text-[9px] opacity-70 block">Expense</span>
                  <span className="text-xs font-bold text-rose-300">-665,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Recent Transactions</h3>
              <span className={`text-xs ${t.primaryText} font-semibold cursor-pointer`}>See All</span>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              {[
                { name: 'Coffee Shop', type: 'expense', amount: 25000, category: 'Food', icon: Coffee, color: 'text-green-500', date: 'Today' },
                { name: 'MRT Ride', type: 'expense', amount: 14000, category: 'Transport', icon: Bus, color: 'text-orange-500', date: 'Today' },
                { name: 'Receive Transfer', type: 'income', amount: 500000, category: 'Fees', icon: Landmark, color: 'text-indigo-500', date: 'Yesterday' },
                { name: 'Netflix Premium', type: 'expense', amount: 186000, category: 'SaaS Subs', icon: Monitor, color: 'text-purple-500', date: 'June 18' },
                { name: 'Monthly Internet', type: 'expense', amount: 150000, category: 'Communicat', icon: Smartphone, color: 'text-slate-500', date: 'June 15' },
              ].map((tx, i) => {
                const TxIcon = tx.icon;
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border ${t.surfaceBorder} ${t.surface} hover:scale-[1.01] transition-all duration-200`}>
                    <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center ${tx.color}`}>
                      <TxIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate">{tx.name}</span>
                      <span className={`text-[10px] ${t.textSub}`}>{tx.category} • {tx.date}</span>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-95 transition-all text-left`}
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

              <button 
                onClick={() => setManageType('person')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border ${t.surfaceBorder} ${t.surface} ${t.surfaceHover} active:scale-95 transition-all text-left cursor-pointer`}
              >
                <div className={`w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-sm block">Sharing Profiles</span>
                  <span className={`text-[10px] ${t.textSub}`}>Manage profiles and split targets</span>
                </div>
                <ChevronDown className="w-4 h-4 -rotate-90 opacity-60" />
              </button>
            </div>
          </div>

          {/* Mock Profile Card */}
          <div className={`mt-auto p-4 rounded-2xl border ${t.surfaceBorder} ${t.surface} flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
              ME
            </div>
            <div>
              <span className="font-bold text-sm block">Arifin Dobson</span>
              <span className={`text-[10px] ${t.textSub}`}>arifin@example.com</span>
            </div>
            <span className={`text-[10px] font-bold ${t.primarySoftText} ${t.primarySoft} px-2.5 py-1 rounded-full ml-auto`}>
              Owner
            </span>
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
          onClick={() => setActiveTab('others')}
          className={`flex flex-col items-center gap-1 active:scale-95 transition-all ${
            activeTab === 'others' ? t.primaryText : t.textSub
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">Others</span>
        </button>
      </nav>
    </div>
  </div>
);
}
