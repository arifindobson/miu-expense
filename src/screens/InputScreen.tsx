import { useEffect, useState } from 'react';
import { X, Sparkles, MapPin, Camera, Loader2, Banknote, Coins, Palette, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useCalculator } from '../hooks/useCalculator';
import { useGeolocation } from '../hooks/useGeolocation';
import { formatDisplayAmount, roundMoney } from '../utils/format';
import { getLocalYMD, getTransactionDateLabel } from '../utils/date';
import { Banner } from '../ui/kit';
import CategoryGrid from '../components/CategoryGrid';
import Keypad from '../components/Keypad';
import type { useAppData } from '../hooks/useAppData';
import type { Transaction } from '../types';

interface InputScreenProps {
  data: ReturnType<typeof useAppData>;
  editingTransaction: Transaction | null;
  onClearEditing: () => void;
  date: string;
  onOpenModal: (m: 'account' | 'person' | 'theme' | 'date') => void;
  receiptImage: string | null;
  setReceiptImage: (v: string | null) => void;
  onOpenCamera: () => void;
  onPreview: (url: string) => void;
  playCoin: () => void;
}

export default function InputScreen({
  data, editingTransaction, onClearEditing, date,
  onOpenModal, receiptImage, setReceiptImage, onOpenCamera, onPreview, playCoin,
}: InputScreenProps) {
  const { t } = useTheme();
  const toast = useToast();
  const calc = useCalculator('0');
  const geo = useGeolocation();

  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [transactionType, setTransactionType] = useState('expense');
  const [successState, setSuccessState] = useState(false);

  const { selectedAccount, selectedPerson, categoriesList, accountsList, peopleList } = data;

  // Prefill the form when an edit is started from the Home/detail view
  useEffect(() => {
    if (!editingTransaction) return;
    calc.setAmount(String(editingTransaction.amount || 0));
    setNote(editingTransaction.note || '');
    setSelectedCategory(editingTransaction.category_name || 'Food');
    setTransactionType(editingTransaction.type);
    setReceiptImage(editingTransaction.receipt_url || null);
    const acc = accountsList.find((a) => a.id === editingTransaction.account_id || a.name === editingTransaction.account_name);
    if (acc) data.setSelectedAccount(acc);
    const person = peopleList.find((p) => p.id === editingTransaction.person_id || p.name === editingTransaction.person_name);
    if (person) data.setSelectedPerson(person);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTransaction]);

  const resetForm = () => {
    calc.reset();
    setNote('');
    setSelectedCategory('Food');
    setReceiptImage(null);
    onClearEditing();
  };

  const handleSubmit = async () => {
    if (calc.hasOperator) {
      calc.evaluate();
      return;
    }
    if (calc.amount === '0') return;

    if (editingTransaction && data.userRole === 'member') {
      toast.error('Members cannot update transactions.');
      return;
    }

    const categoryObj = categoriesList.find((c) => c.name === selectedCategory);
    const input = {
      type: transactionType,
      amount: roundMoney(parseFloat(calc.amount) || 0),
      categoryId: categoryObj?.id || null,
      categoryName: selectedCategory,
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      personId: selectedPerson.id,
      personName: selectedPerson.name,
      note,
      date,
      lat: geo.enabled && geo.coordinates ? geo.coordinates.lat : null,
      lng: geo.enabled && geo.coordinates ? geo.coordinates.lng : null,
      receiptUrl: receiptImage,
      groupId: data.activeGroup?.id || null,
    };

    setSuccessState(true);
    const result = await data.saveTransaction(input, editingTransaction?.id || null);
    if (!result.ok) {
      setSuccessState(false);
      toast.error(result.error || 'Failed to save. Saved locally instead.');
      return;
    }
    playCoin();
    setTimeout(() => {
      setSuccessState(false);
      resetForm();
    }, 1400);
  };

  const isToday = date === getLocalYMD();
  const dateDisplay = isToday ? 'TODAY' : getTransactionDateLabel(date).toUpperCase();

  return (
    <>
      {/* Success overlay */}
      <div className={`absolute inset-0 z-50 flex items-center justify-center ${t.modalOverlay} backdrop-blur-sm transition-all duration-300 pointer-events-none ${successState ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className={`flex flex-col items-center gap-4 ${t.modalBg} p-8 rounded-3xl border ${t.border} text-center`}>
          <div className={`w-16 h-16 ${t.successBg} rounded-full flex items-center justify-center`}>
            <Check className={`w-8 h-8 ${t.successIcon} stroke-[3]`} />
          </div>
          <h3 className={`font-bold text-lg ${t.textMain}`}>{editingTransaction ? 'Updated' : 'Saved'} Successfully</h3>
        </div>
      </div>

      {/* Edit banner */}
      {editingTransaction && (
        <div className="px-3 py-2 shrink-0">
          <Banner kind="warning" onDismiss={resetForm}>
            <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Editing transaction</span>
          </Banner>
        </div>
      )}

      {/* Location error banner */}
      {geo.error && (
        <div className="px-3 pb-1 shrink-0">
          <Banner kind="error" onDismiss={geo.clearError}>{geo.error}</Banner>
        </div>
      )}

      {/* Header */}
      <header className={`flex items-center justify-between px-3 py-1.5 ${t.bg} shrink-0`}>
        <button onClick={() => onOpenModal('theme')} aria-label="Change theme" className={`p-1.5 ${t.textSub} ${t.textSubHover} rounded-full ${t.surfaceHover} transition-colors`}>
          <Palette className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTransactionType(transactionType === 'expense' ? 'income' : 'expense')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm ${t.primary}`}
        >
          {transactionType === 'expense' ? <><Banknote className="w-4 h-4" /> Expense</> : <><Coins className="w-4 h-4" /> Income</>}
        </button>

        <div className="flex items-center gap-1.5">
          {geo.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <MapPin className={`w-3.5 h-3.5 ${geo.enabled ? t.primaryText : t.textSub}`} />}
          <button onClick={geo.toggle} disabled={geo.loading} aria-label="Toggle location"
            className={`w-9 h-5 rounded-full relative transition-colors duration-200 focus:outline-none ${geo.enabled ? t.toggleActive : t.surface} ${geo.loading ? 'opacity-60 cursor-not-allowed' : ''}`}>
            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm ${geo.enabled ? 'translate-x-[18px] left-0.5' : 'left-0.5'}`} />
          </button>
        </div>
      </header>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        <CategoryGrid categories={categoriesList} selectedCategory={selectedCategory} onSelect={setSelectedCategory} t={t} />
      </div>

      {/* Keypad area */}
      <div className={`${t.keypadContainer} rounded-t-3xl p-3 pb-2 flex flex-col gap-1 shrink-0 z-10 transition-colors duration-300 relative`}>
        {geo.loading && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/60 border border-blue-100 rounded-xl animate-pulse mb-1">
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
            <span className="text-[10px] font-semibold text-blue-600">Fetching real-time GPS coordinates...</span>
          </div>
        )}

        <div className={`flex items-center gap-2.5 px-3 py-2 ${t.inputCard} border rounded-2xl shadow-sm ${t.primaryRing} transition-all`}>
          <div className="shrink-0 flex items-center">
            {!receiptImage ? (
              <button onClick={onOpenCamera} aria-label="Scan receipt" className={`w-8 h-8 ${t.surface} border ${t.surfaceBorder} rounded-lg flex items-center justify-center ${t.surfaceHover} text-slate-400 hover:text-slate-600 transition-colors active:scale-95`}>
                <Camera className="w-4 h-4" strokeWidth={2.5} />
              </button>
            ) : (
              <div className="relative w-8 h-8">
                <img src={receiptImage} alt="Receipt" onClick={() => onPreview(receiptImage)} className="w-8 h-8 rounded-lg border border-slate-200 object-cover bg-white cursor-pointer" />
                <button onClick={() => setReceiptImage(null)} aria-label="Remove receipt" className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-[2px] shadow-sm active:scale-90 transition-transform">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>

          <input type="text" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)}
            className={`flex-1 bg-transparent border-none focus:outline-none ${t.textMain} ${t.placeholder} text-sm min-w-0`} />

          <div className="flex flex-col items-end shrink-0 max-w-[50%]">
            <button onClick={() => onOpenModal('account')} className={`text-[9px] ${t.textSub} ${t.textSubHover} font-medium transition-colors text-right`}>
              {selectedAccount.name}({selectedAccount.currency})
            </button>
            <span className={`text-xl font-semibold ${t.textMain} tracking-tight leading-none mt-0.5 truncate w-full text-right`}>
              {formatDisplayAmount(calc.amount)}
            </span>
          </div>
        </div>

        <Keypad
          onNumberPress={calc.inputNumber}
          onOperatorPress={calc.inputOperator}
          onDeletePress={calc.del}
          onSubmitPress={handleSubmit}
          onPersonModalOpen={() => onOpenModal('person')}
          onDateModalOpen={() => onOpenModal('date')}
          onAccountModalOpen={() => onOpenModal('account')}
          operator={calc.operator}
          dateDisplay={dateDisplay}
          selectedPerson={selectedPerson}
          selectedAccount={selectedAccount}
          t={t}
          locationLoading={geo.loading}
        />
      </div>
    </>
  );
}
