import { useState, useRef, useCallback } from 'react';
import { Trash2, Eye } from 'lucide-react';
import type { ThemeConfig, Transaction } from '../types';

interface SwipeableTransactionProps {
  transaction: Transaction;
  children: React.ReactNode;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  t: ThemeConfig;
}

export default function SwipeableTransaction({
  transaction,
  children,
  onEdit,
  onDelete,
  t,
}: SwipeableTransactionProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const REVEAL_THRESHOLD = 60;
  const ACTION_WIDTH = 120;

  // Touch handlers for swipe gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = startXRef.current - e.touches[0].clientX;
    // Only allow left swipe, max -ACTION_WIDTH
    const newOffset = Math.max(0, Math.min(diff, ACTION_WIDTH));
    setOffsetX(newOffset);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (offsetX > REVEAL_THRESHOLD) {
      setOffsetX(ACTION_WIDTH);
    } else {
      setOffsetX(0);
    }
  }, [offsetX]);

  const handleClick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    // Only fire edit on tap (short touch, no significant swipe)
    if (offsetX === 0 && elapsed < 300) {
      onEdit(transaction);
    } else if (offsetX > 0) {
      // Close the swipe if we tap the content when it's open
      setOffsetX(0);
    }
  }, [offsetX, onEdit, transaction]);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    setShowConfirm(false);
    setOffsetX(0);
    onDelete(transaction);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl" ref={containerRef}>
        {/* Delete/Edit action zone behind */}
        <div className="absolute right-0 top-0 bottom-0 flex items-stretch z-0" style={{ width: `${ACTION_WIDTH}px` }}>
          <button
            onClick={() => { onEdit(transaction); setOffsetX(0); }}
            className="flex-1 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex-1 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Main content - slides left on swipe */}
        <div
          className="relative z-10 cursor-pointer select-none"
          style={{
            transform: `translateX(-${offsetX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {children}
        </div>

        {/* Desktop-only hover actions */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ opacity: offsetX > 0 ? 0 : undefined }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
            className={`p-1.5 rounded-lg ${t.surface} border ${t.surfaceBorder} ${t.textSub} hover:text-blue-500 hover:border-blue-200 transition-all`}
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }}
            className={`p-1.5 rounded-lg ${t.surface} border ${t.surfaceBorder} ${t.textSub} hover:text-rose-500 hover:border-rose-200 transition-all`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div
          className={`fixed inset-0 z-[80] flex items-center justify-center ${t.modalOverlay} backdrop-blur-sm`}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className={`${t.modalBg} rounded-3xl p-6 border ${t.border} max-w-[85%] w-[320px] animate-fade-scale-in`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h3 className={`font-bold text-base ${t.textMain}`}>Delete Transaction?</h3>
                <p className={`text-xs ${t.textSub} mt-1`}>
                  {transaction.note || transaction.category_name || 'Transaction'} — Rp {(transaction.amount || 0).toLocaleString()}
                </p>
                <p className={`text-[10px] ${t.textSub} mt-0.5`}>This action cannot be undone</p>
              </div>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className={`flex-1 py-2.5 rounded-xl border ${t.border} ${t.textMuted} font-semibold text-sm transition-colors ${t.surfaceHover}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
