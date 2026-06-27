import { useEffect, useRef, useState } from 'react';
import { GripVertical, Trash2, Lock } from 'lucide-react';
import type { ThemeConfig, Account } from '../types';

interface SortableAccountsProps {
  accounts: Account[];
  t: ThemeConfig;
  onReorder: (orderedIds: string[]) => void;
  onDelete: (id: string) => void;
}

/**
 * Drag-to-sort list of accounts. Pointer-events based so it works on touch and
 * desktop without a dnd dependency. Reordering is committed on pointer-up via
 * onReorder, which persists the order and reflects it in the account picker.
 */
export default function SortableAccounts({ accounts, t, onReorder, onDelete }: SortableAccountsProps) {
  const [items, setItems] = useState<Account[]>(accounts);
  const itemsRef = useRef<Account[]>(accounts);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Keep local order in sync when the source list changes (add/delete/reload)
  useEffect(() => { setItems(accounts); itemsRef.current = accounts; }, [accounts]);
  itemsRef.current = items;

  const beginDrag = (e: React.PointerEvent, index: number) => {
    dragIndex.current = index;
    setDraggingId(items[index].id);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    if (dragIndex.current === null) return;
    e.preventDefault();
    const y = e.clientY;
    const target = rowRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return y >= r.top && y <= r.bottom;
    });
    if (target !== -1 && target !== dragIndex.current) {
      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex.current!, 1);
        next.splice(target, 0, moved);
        return next;
      });
      dragIndex.current = target;
    }
  };

  const endDrag = () => {
    if (dragIndex.current === null) return;
    dragIndex.current = null;
    setDraggingId(null);
    onReorder(itemsRef.current.map((a) => a.id));
  };

  return (
    <div className="space-y-2">
      {items.map((acc, index) => {
        const AccIcon = acc.icon;
        const isCustom = acc.user_id && acc.user_id !== 'system';
        const isDragging = draggingId === acc.id;
        return (
          <div
            key={acc.id}
            ref={(el) => { rowRefs.current[index] = el; }}
            className={`flex items-center gap-2 p-3 border ${t.border} rounded-2xl ${t.surface} transition-shadow ${isDragging ? 'shadow-lg scale-[1.01] opacity-95 relative z-10' : ''}`}
          >
            <button
              type="button"
              aria-label={`Reorder ${acc.name}`}
              onPointerDown={(e) => beginDrag(e, index)}
              onPointerMove={onMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{ touchAction: 'none' }}
              className={`shrink-0 -ml-1 p-1 ${t.textSub} hover:${t.textMuted} cursor-grab active:cursor-grabbing rounded-lg ${t.surfaceHover}`}
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.bg} border ${t.border} ${acc.color} shrink-0`}>
              <AccIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm block truncate">{acc.name}</span>
              <span className={`text-[10px] ${t.textSub}`}>{acc.currency} • Bal: {acc.balance?.toLocaleString()}</span>
            </div>

            {isCustom ? (
              <button
                onClick={() => onDelete(acc.id)}
                aria-label={`Delete ${acc.name}`}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <Lock className="w-4 h-4 text-slate-300 mr-2 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
