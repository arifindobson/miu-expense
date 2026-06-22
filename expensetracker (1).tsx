import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, Sparkles, Folder, Settings, 
  Utensils, Smartphone, Coffee, Bus, Ticket, Globe, Monitor, 
  GlassWater, Home, Gift, Shirt, Tv,
  CreditCard, Smile, PlusCircle, CheckCircle2,
  Delete, Banknote, Coins,
  ChevronDown, ChevronUp, MapPin, Image as ImageIcon, Camera, Equal,
  User, Users, Wallet, Landmark, Palette, ScanLine, Bot
} from 'lucide-react';

// --- THEME CONFIGURATIONS ---
const THEMES = {
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

const DUMMY_RECEIPT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23f8fafc"/><rect x="10" y="10" width="80" height="20" fill="%23cbd5e1" rx="4"/><rect x="10" y="40" width="60" height="10" fill="%23e2e8f0" rx="2"/><rect x="10" y="60" width="40" height="10" fill="%23e2e8f0" rx="2"/><rect x="10" y="80" width="70" height="10" fill="%23e2e8f0" rx="2"/><line x1="10" y1="100" x2="90" y2="100" stroke="%2394a3b8" stroke-width="2" stroke-dasharray="4"/><rect x="50" y="110" width="40" height="15" fill="%2394a3b8" rx="4"/></svg>`;

export default function App() {
  const [currentTheme, setCurrentTheme] = useState('white-blue');
  const t = THEMES[currentTheme];
  
  const dateInputRef = useRef(null);

  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [transactionType, setTransactionType] = useState('expense');
  
  const [successState, setSuccessState] = useState(null); // 'manual' | 'ai' | null
  
  // Feature states
  const [isExpanded, setIsExpanded] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  
  // Camera & AI states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);

  // Calculator states
  const [prevAmount, setPrevAmount] = useState(null);
  const [operator, setOperator] = useState(null);
  const [isNewInput, setIsNewInput] = useState(false);

  // Pickers states
  const getLocalYMD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const [date, setDate] = useState(getLocalYMD());
  const [activeModal, setActiveModal] = useState(null);
  
  const accounts = [
    { id: '1', name: 'Mandiri SkyZ', icon: CreditCard, color: 'text-indigo-500', currency: 'IDR' },
    { id: '2', name: 'Cash', icon: Wallet, color: 'text-emerald-500', currency: 'IDR' },
    { id: '3', name: 'Bank BCA', icon: Landmark, color: 'text-blue-500', currency: 'IDR' },
  ];
  
  const people = [
    { id: '1', name: 'Me', icon: Smile },
    { id: '2', name: 'Family', icon: Users },
    { id: '3', name: 'Friend', icon: User },
  ];

  const categories = [
    { name: 'Food', icon: Utensils, color: 'text-blue-500' },
    { name: 'Communicat', icon: Smartphone, color: 'text-slate-500' },
    { name: 'Daily', icon: Coffee, color: 'text-green-500' },
    { name: 'Transport', icon: Bus, color: 'text-orange-500' },
    { name: 'Tip', icon: Ticket, color: 'text-yellow-500' },
    { name: 'Fees', icon: Globe, color: 'text-indigo-500' },
    { name: 'SaaS Subs', icon: Monitor, color: 'text-purple-500' },
    { name: 'Social', icon: GlassWater, color: 'text-pink-500' },
    { name: 'Housing', icon: Home, color: 'text-rose-500' },
    { name: 'Gifts', icon: Gift, color: 'text-red-500' },
    { name: 'Clothing', icon: Shirt, color: 'text-cyan-500' },
    { name: 'Entertainme', icon: Tv, color: 'text-violet-500' },
  ];

  const [selectedAccount, setSelectedAccount] = useState(accounts[0]);
  const [selectedPerson, setSelectedPerson] = useState(people[0]);

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

  const handleNumber = (val) => {
    if (aiEnabled) return; // Prevent manual input when AI is active
    if (isNewInput) {
      setAmount(val === '.' ? '0.' : val);
      setIsNewInput(false);
    } else {
      if (val === '.' && amount.includes('.')) return;
      setAmount(prev => prev === '0' && val !== '.' ? val : prev + val);
    }
  };

  const handleOperator = (op) => {
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

  const handleActionClick = () => {
    if (operator && !aiEnabled) {
      const result = performCalculation();
      setAmount(result);
      setPrevAmount(null);
      setOperator(null);
      setIsNewInput(true);
    } else {
      // AI check: allow submit if AI is enabled, otherwise require amount > 0
      if (amount === '0' && !aiEnabled) return; 
      
      setSuccessState(aiEnabled ? 'ai' : 'manual');
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
      }, 2000); // Give user enough time to read the AI text
    }
  };

  const takePhoto = () => {
    setFlashOn(true);
    setTimeout(() => {
      setFlashOn(false);
      setReceiptImage(DUMMY_RECEIPT);
      setAiEnabled(true);
      setIsCameraOpen(false);
    }, 150);
  };

  const formatDisplayAmount = (str) => {
    const parts = str.toString().split('.');
    const formattedInt = new Intl.NumberFormat('en-US').format(parts[0]);
    return parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
  };

  const isToday = date === getLocalYMD();
  const dateDisplay = isToday ? 'TODAY' : new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div className={`flex flex-col h-[100dvh] max-w-md mx-auto ${t.bg} font-sans ${t.textMain} border-x ${t.border} overflow-hidden shadow-2xl sm:h-[800px] sm:my-8 sm:rounded-[2.5rem] relative transition-colors duration-300`}>
      
      {/* --- CAMERA OVERLAY --- */}
      {isCameraOpen && (
        <div className="absolute inset-0 z-[60] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center p-5 pt-safe text-white">
            <button onClick={() => setIsCameraOpen(false)} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform">
              <X className="w-6 h-6" />
            </button>
            <span className="font-medium">Scan Receipt</span>
            <div className="w-10"></div>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-6 relative">
            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white -mt-1 -mr-1 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -mb-1 -ml-1 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white -mb-1 -mr-1 rounded-br-xl"></div>
            </div>
            <ScanLine className="w-16 h-16 text-white/20 animate-pulse" />
          </div>

          <div className="h-32 pb-safe flex items-center justify-center bg-black/50">
            <button 
              onClick={takePhoto}
              className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-[68px] h-[68px] bg-white rounded-full"></div>
            </button>
          </div>

          {flashOn && <div className="absolute inset-0 bg-white z-50"></div>}
        </div>
      )}

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
      {activeModal && (
        <div 
          className={`absolute inset-0 z-40 flex flex-col justify-end ${t.modalOverlay} backdrop-blur-sm`}
          onClick={() => setActiveModal(null)}
        >
          <div 
            className={`${t.modalBg} rounded-t-3xl p-5 pb-safe animate-in slide-in-from-bottom-full duration-300 border-t ${t.border}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-semibold ${t.textMain}`}>
                {activeModal === 'account' ? 'Select Account' : activeModal === 'person' ? 'Select Person' : 'Choose Theme'}
              </h3>
              <button onClick={() => setActiveModal(null)} className={`p-1 ${t.textSub} ${t.surfaceHover} rounded-full transition-colors`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              {activeModal === 'account' && accounts.map(acc => (
                <button 
                  key={acc.name}
                  onClick={() => { setSelectedAccount(acc); setActiveModal(null); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border ${selectedAccount.name === acc.name ? `${t.primaryBorder} ${t.primarySoft}` : `${t.border} ${t.surfaceHover} transition-colors`}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.bg} border ${t.surfaceBorder} ${acc.color}`}>
                    <acc.icon className="w-5 h-5" />
                  </div>
                  <span className={`font-medium ${t.textMain}`}>{acc.name}</span>
                  {selectedAccount.name === acc.name && <Check className={`w-5 h-5 ${t.primaryText} ml-auto`} />}
                </button>
              ))}

              {activeModal === 'theme' && Object.entries(THEMES).map(([key, theme]) => (
                <button 
                  key={key}
                  onClick={() => { setCurrentTheme(key); setActiveModal(null); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border ${currentTheme === key ? `${t.primaryBorder} ${t.primarySoft}` : `${t.border} ${t.surfaceHover} transition-colors`}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme.bg} border ${theme.border}`}>
                    <div className={`w-4 h-4 rounded-full ${theme.primary.split(' ')[0]}`} />
                  </div>
                  <span className={`font-medium ${t.textMain}`}>{theme.name}</span>
                  {currentTheme === key && <Check className={`w-5 h-5 ${t.primaryText} ml-auto`} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

        <div className="grid grid-cols-4 gap-y-4 gap-x-2 px-4 py-4 pb-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                  isSelected 
                    ? `${t.primarySoft} border-2 ${t.primaryBorder} shadow-sm scale-105` 
                    : `${t.bg} border ${t.surfaceBorder} ${t.surfaceHover} group-hover:border-[${t.border}]`
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? t.primaryText : cat.color}`} strokeWidth={1.5} />
                </div>
                <span className={`text-[11px] ${isSelected ? `${t.primarySoftText} font-medium` : t.textMuted} truncate w-full text-center`}>
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Keypad Area */}
      <div className={`${t.keypadContainer} rounded-t-3xl p-3 flex flex-col gap-2 pb-safe shrink-0 z-10 transition-colors duration-300 relative`}>
        
        {/* Toggle Bar / Utility Header */}
        <div className="flex items-center justify-between px-2 pt-0.5 pb-1">
          
          {/* CAMERA & AI SECTION */}
          <div className="flex-1 flex justify-start items-center gap-2">
            {!receiptImage ? (
              <button onClick={() => setIsCameraOpen(true)} className={`p-1.5 ${t.textSub} ${t.textSubHover} ${t.surfaceHover} rounded-full transition-colors active:scale-95`}>
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
            className={`p-1 ${t.textSub} ${t.textSubHover} transition-colors ${t.surface} ${t.surfaceHover} rounded-full`}
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
            <selectedAccount.icon className={`w-4 h-4 ${selectedAccount.color}`} />
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
        <div className={`grid grid-cols-4 gap-1.5 transition-all duration-300 ${aiEnabled ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
          <button onClick={() => setActiveModal('person')} className={`h-10 ${t.btnSpecial} rounded-xl flex items-center justify-center transition-colors active:scale-95`}>
            <selectedPerson.icon className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={() => {
              if (dateInputRef.current) {
                try {
                  dateInputRef.current.showPicker();
                } catch (e) {
                  dateInputRef.current.focus();
                }
              }
            }}
            className={`relative h-10 ${t.btnSpecial} rounded-xl flex items-center justify-center transition-colors active:scale-95 overflow-hidden`}
          >
            <span className={`font-medium text-xs pointer-events-none`}>{dateDisplay}</span>
            <input 
              ref={dateInputRef}
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
            />
          </button>
          <button className={`h-10 ${t.btnSpecial} rounded-xl flex items-center justify-center transition-colors active:scale-95`}>
            <PlusCircle className="w-5 h-5" />
          </button>
          
          {/* Submit Button */}
          <button 
            onClick={handleActionClick}
            className={`h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 pointer-events-auto ${
              aiEnabled ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200' :
              operator ? 'bg-amber-500 hover:bg-amber-600 text-white' : t.primary
            }`}
          >
            {aiEnabled ? <Sparkles className="w-5 h-5" /> : operator ? <Equal className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </button>

          {/* Numbers & Operators */}
          {[{ op: 'x', n1: '7', n2: '8', n3: '9' }, { op: '/', n1: '4', n2: '5', n3: '6' }, { op: '-', n1: '1', n2: '2', n3: '3' }].map((row, i) => (
            <React.Fragment key={i}>
              <button onClick={() => handleOperator(row.op)} className={`h-11 rounded-xl text-lg transition-colors active:scale-95 ${operator === row.op ? t.primaryActiveOp : t.btnSpecial}`}>{row.op}</button>
              <button onClick={() => handleNumber(row.n1)} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95`}>{row.n1}</button>
              <button onClick={() => handleNumber(row.n2)} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95`}>{row.n2}</button>
              <button onClick={() => handleNumber(row.n3)} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95`}>{row.n3}</button>
            </React.Fragment>
          ))}
          
          <button onClick={() => handleOperator('+')} className={`h-11 rounded-xl text-lg transition-colors active:scale-95 ${operator === '+' ? t.primaryActiveOp : t.btnSpecial}`}>+</button>
          <button onClick={() => handleNumber('.')} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95`}>.</button>
          <button onClick={() => handleNumber('0')} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95`}>0</button>
          <button onClick={handleDelete} className={`h-11 ${t.btnSpecial} rounded-xl flex items-center justify-center transition-colors active:scale-95`}>
            <Delete className="w-5 h-5 text-rose-400" />
          </button>
        </div>
        
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
    </div>
  );
}