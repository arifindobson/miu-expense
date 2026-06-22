import { X, Calendar, MapPin, Tag, Landmark, User, ExternalLink, Pencil } from 'lucide-react';
import type { ThemeConfig, Transaction, Person } from '../types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEditClick: (tx: Transaction) => void;
  peopleList: Person[];
  t: ThemeConfig;
  isReadOnly?: boolean;
}

export default function TransactionDetailModal({
  transaction,
  onClose,
  onEditClick,
  peopleList,
  t,
  isReadOnly = false,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  // Find the submitter's email if available
  const matchedPerson = peopleList.find(p => p.name === transaction.person_name);
  const submitterEmail = matchedPerson?.email;

  const hasGeo = transaction.location_lat !== null && transaction.location_lng !== null && transaction.location_lat !== undefined;

  // Helper to format date with 24-hour time in GMT+7
  const getFormattedDateTime = () => {
    try {
      if (transaction.created_at) {
        const dateObj = new Date(transaction.created_at);
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Jakarta', // GMT+7
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const parts = formatter.formatToParts(dateObj);
        const day = parts.find(p => p.type === 'day')?.value;
        const month = parts.find(p => p.type === 'month')?.value;
        const year = parts.find(p => p.type === 'year')?.value;
        const hour = parts.find(p => p.type === 'hour')?.value;
        const minute = parts.find(p => p.type === 'minute')?.value;
        return `${year}-${month}-${day} ${hour}:${minute}`;
      }
    } catch (e) {
      console.warn('Failed to format date in GMT+7:', e);
    }
    return transaction.date;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-end ${t.modalOverlay} backdrop-blur-sm`}
      onClick={onClose}
    >
      <div 
        className={`${t.modalBg} rounded-t-3xl p-5 pb-safe animate-in slide-in-from-bottom-full duration-300 border-t ${t.border} max-h-[90%] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 border-b pb-2 border-slate-100 dark:border-slate-800">
          <div>
            <h3 className={`font-bold text-base ${t.textMain}`}>Transaction Details</h3>
            <span className={`text-[10px] ${t.textSub} uppercase tracking-wider font-semibold`}>
              {transaction.type}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 ${t.textSub} ${t.surfaceHover} rounded-full transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 font-sans">
          
          {/* Premium Note and Amount Card */}
          <div className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border text-center transition-all ${
            transaction.type === 'income' 
              ? 'bg-emerald-50/60 border-emerald-100/80 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
              : 'bg-rose-50/60 border-rose-100/80 dark:bg-rose-950/20 dark:border-rose-900/30'
          }`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${
              transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {transaction.type}
            </span>
            <span className={`text-3xl font-extrabold tracking-tight ${
              transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}Rp {transaction.amount.toLocaleString()}
            </span>
            {transaction.note && (
              <h4 className={`mt-2.5 font-bold text-sm ${t.textMain} max-w-xs break-words px-4 py-1.5 bg-white/70 dark:bg-slate-900/70 border ${t.border} rounded-xl shadow-sm`}>
                {transaction.note}
              </h4>
            )}
          </div>

          {/* Details Metadata List */}
          <div className="space-y-2.5">
            {/* Category */}
            <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
              <Tag className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 text-left">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Category</span>
                <span className={`text-xs font-semibold ${t.textMain}`}>{transaction.category_name || 'Uncategorized'}</span>
              </div>
            </div>

            {/* Account */}
            <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
              <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 text-left">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Payment Account</span>
                <span className={`text-xs font-semibold ${t.textMain}`}>{transaction.account_name || 'Unknown Account'}</span>
              </div>
            </div>

            {/* Submitter */}
            <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 text-left">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Submitted By</span>
                <span className={`text-xs font-semibold ${t.textMain}`}>
                  {transaction.person_name || 'System / Default'}
                  {submitterEmail && <span className="text-[10px] text-slate-500 font-normal ml-1">({submitterEmail})</span>}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 text-left">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Transaction Date</span>
                <span className={`text-xs font-semibold ${t.textMain}`}>{getFormattedDateTime()}</span>
              </div>
            </div>

            {/* Geolocation */}
            {hasGeo && (
              <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 flex justify-between items-center text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">GPS Location</span>
                    <span className={`text-xs font-semibold ${t.textMain}`}>
                      {transaction.location_lat?.toFixed(5)}, {transaction.location_lng?.toFixed(5)}
                    </span>
                  </div>
                  <a 
                    href={`https://www.google.com/maps?q=${transaction.location_lat},${transaction.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
                  >
                    View Map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Attachment Preview */}
          {transaction.receipt_url && (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold tracking-wider px-1">Receipt Attachment</span>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50 max-h-48 flex items-center justify-center">
                <img 
                  src={transaction.receipt_url} 
                  alt="Receipt Preview" 
                  className="w-full max-h-48 object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                  onClick={() => {
                    window.open(transaction.receipt_url!, '_blank');
                  }}
                />
              </div>
            </div>
          )}

           {/* Actions */}
          {!isReadOnly && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onEditClick(transaction)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm shadow-md active:scale-95 transition-transform ${t.primary}`}
              >
                <Pencil className="w-4 h-4" /> Edit Transaction
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
