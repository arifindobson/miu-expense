import { X, Check } from 'lucide-react';
import type { ThemeConfig, Account, Person } from '../types';

interface SheetModalsProps {
  activeModal: 'account' | 'person' | 'theme' | 'date' | null;
  onClose: () => void;
  accounts: Account[];
  selectedAccount: Account;
  onSelectAccount: (acc: Account) => void;
  people: Person[];
  selectedPerson: Person;
  onSelectPerson: (p: Person) => void;
  currentTheme: string;
  onSelectTheme: (themeKey: string) => void;
  THEMES: Record<string, ThemeConfig>;
  t: ThemeConfig;
}

export default function SheetModals({
  activeModal,
  onClose,
  accounts,
  selectedAccount,
  onSelectAccount,
  people,
  selectedPerson,
  onSelectPerson,
  currentTheme,
  onSelectTheme,
  THEMES,
  t
}: SheetModalsProps) {
  if (!activeModal || activeModal === 'date') return null;

  return (
    <div 
      className={`absolute inset-0 z-40 flex flex-col justify-end ${t.modalOverlay} backdrop-blur-sm`}
      onClick={onClose}
    >
      <div 
        className={`${t.modalBg} rounded-t-3xl p-5 pb-safe animate-in slide-in-from-bottom-full duration-300 border-t ${t.border}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`font-semibold ${t.textMain}`}>
            {activeModal === 'account' ? 'Select Account' : activeModal === 'person' ? 'Select Person' : 'Choose Theme'}
          </h3>
          <button onClick={onClose} className={`p-1 ${t.textSub} ${t.surfaceHover} rounded-full transition-colors cursor-pointer`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-2">
          {activeModal === 'account' && accounts.map(acc => {
            const AccIcon = acc.icon;
            return (
              <button 
                key={acc.id}
                onClick={() => onSelectAccount(acc)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${selectedAccount.id === acc.id ? `${t.primaryBorder} ${t.primarySoft}` : `${t.border} ${t.surfaceHover} transition-colors`}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.bg} border ${t.surfaceBorder} ${acc.color}`}>
                  <AccIcon className="w-5 h-5" />
                </div>
                <span className={`font-medium ${t.textMain}`}>{acc.name}</span>
                {selectedAccount.id === acc.id && <Check className={`w-5 h-5 ${t.primaryText} ml-auto`} />}
              </button>
            );
          })}

          {activeModal === 'person' && people.map(p => {
            const PIcon = p.icon;
            return (
              <button 
                key={p.id}
                onClick={() => onSelectPerson(p)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${selectedPerson.id === p.id ? `${t.primaryBorder} ${t.primarySoft}` : `${t.border} ${t.surfaceHover} transition-colors`}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.bg} border ${t.surfaceBorder}`}>
                  <PIcon className="w-5 h-5" />
                </div>
                <span className={`font-medium ${t.textMain}`}>{p.name}</span>
                {selectedPerson.id === p.id && <Check className={`w-5 h-5 ${t.primaryText} ml-auto`} />}
              </button>
            );
          })}

          {activeModal === 'theme' && Object.entries(THEMES).map(([key, theme]) => (
            <button 
              key={key}
              onClick={() => onSelectTheme(key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${currentTheme === key ? `${theme.primaryBorder} ${theme.primarySoft}` : `${t.border} ${theme.surfaceHover} transition-colors`}`}
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
  );
}
