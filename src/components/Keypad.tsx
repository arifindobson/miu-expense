import { Fragment } from 'react';
import { PlusCircle, CheckCircle2, Equal, Sparkles, Delete } from 'lucide-react';
import type { ThemeConfig, Person } from '../types';

interface KeypadProps {
  onNumberPress: (val: string) => void;
  onOperatorPress: (op: string) => void;
  onDeletePress: () => void;
  onSubmitPress: () => void;
  onPersonModalOpen: () => void;
  onDateModalOpen: () => void;
  operator: string | null;
  aiEnabled: boolean;
  dateDisplay: string;
  selectedPerson: Person;
  t: ThemeConfig;
}

export default function Keypad({
  onNumberPress,
  onOperatorPress,
  onDeletePress,
  onSubmitPress,
  onPersonModalOpen,
  onDateModalOpen,
  operator,
  aiEnabled,
  dateDisplay,
  selectedPerson,
  t
}: KeypadProps) {
  const PersonIcon = selectedPerson.icon;

  return (
    <div className={`grid grid-cols-4 gap-1.5 transition-all duration-300 ${aiEnabled ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''}`}>
      {/* Row 1 */}
      <button onClick={onPersonModalOpen} className={`h-10 ${t.btnSpecial} rounded-xl flex items-center justify-center transition-colors active:scale-95 cursor-pointer`}>
        <PersonIcon className="w-5 h-5" />
      </button>
      <button 
        type="button"
        onClick={onDateModalOpen}
        className={`relative h-10 ${t.btnSpecial} rounded-xl flex items-center justify-center transition-colors active:scale-95 overflow-hidden cursor-pointer`}
      >
        <span className="font-semibold text-xs pointer-events-none">{dateDisplay}</span>
      </button>
      <button className={`h-10 ${t.btnSpecial} rounded-xl flex items-center justify-center transition-colors active:scale-95 cursor-pointer`}>
        <PlusCircle className="w-5 h-5" />
      </button>
      
      {/* Submit Button */}
      <button 
        onClick={onSubmitPress}
        className={`h-10 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 pointer-events-auto cursor-pointer ${
          aiEnabled ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200' :
          operator ? 'bg-amber-500 hover:bg-amber-600 text-white' : t.primary
        }`}
      >
        {aiEnabled ? <Sparkles className="w-5 h-5" /> : operator ? <Equal className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
      </button>

      {/* Numbers & Operators */}
      {[{ op: 'x', n1: '7', n2: '8', n3: '9' }, { op: '/', n1: '4', n2: '5', n3: '6' }, { op: '-', n1: '1', n2: '2', n3: '3' }].map((row, i) => (
        <Fragment key={i}>
          <button onClick={() => onOperatorPress(row.op)} className={`h-11 rounded-xl text-lg transition-colors active:scale-95 cursor-pointer ${operator === row.op ? t.primaryActiveOp : t.btnSpecial}`}>{row.op}</button>
          <button onClick={() => onNumberPress(row.n1)} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95 cursor-pointer`}>{row.n1}</button>
          <button onClick={() => onNumberPress(row.n2)} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95 cursor-pointer`}>{row.n2}</button>
          <button onClick={() => onNumberPress(row.n3)} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95 cursor-pointer`}>{row.n3}</button>
        </Fragment>
      ))}
      
      <button onClick={() => onOperatorPress('+')} className={`h-11 rounded-xl text-lg transition-colors active:scale-95 cursor-pointer ${operator === '+' ? t.primaryActiveOp : t.btnSpecial}`}>{operator === '+' ? '+' : '+'}</button>
      <button onClick={() => onNumberPress('.')} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95 cursor-pointer`}>.</button>
      <button onClick={() => onNumberPress('0')} className={`h-11 ${t.btnNum} rounded-xl text-lg font-medium transition-colors shadow-sm active:scale-95 cursor-pointer`}>0</button>
      <button onClick={onDeletePress} className={`h-11 ${t.btnSpecial} rounded-xl flex items-center justify-center transition-colors active:scale-95 cursor-pointer`}>
        <Delete className="w-5 h-5 text-rose-400" />
      </button>
    </div>
  );
}
