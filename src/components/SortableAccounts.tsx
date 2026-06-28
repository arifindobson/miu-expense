import { useEffect, useRef, useState } from 'react';
import { GripVertical, Trash2, Lock, Pencil } from 'lucide-react';
import type { ThemeConfig, Account } from '../types';

interface SortableAccountsProps {
  accounts: Account[];
  t: ThemeConfig;
  onReorder: (orderedIds: string[]) => void;
  onDelete: (id: string) => void;
  onEdit: (account: Account) => void;
}

const GAP = 8; // matches the `space-y-2` row gap

/**
 * Drag-to-sort list of accounts. Pointer-events based (touch + desktop, no dnd dep).
 * The dragged row follows the finger via translateY; the underlying order is reordered
 * one slot at a time as the pointer crosses each row height, with the baseline reset on
 * every crossing so tracking stays stable (no rect oscillation). Committed on pointer-up.
 */
export default function SortableAccounts({ accounts, t, onReorder, onDelete, onEdit }: SortableAccountsProps) {
  const [items, setItems] = useState<Account[]>(accounts);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const baselineY = useRef(0);
  const slotH = useRef(64);
  const rowEls = useRef<Map<string, HTMLDivElement>>(new Map());

  // Keep local order in sync when the source list changes (add/edit/delete/reload)
  useEffect(() => { setItems(accounts); }, [accounts]);

  const begin = (e: React.PointerEvent, id: string) => {
    const el = rowEls.current.get(id);
    slotH.current = (el?.offsetHeight ?? 56) + GAP;
    baselineY.current = e.clientY;
    setDragId(id);
    setDragY(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!dragId) return;
    e.preventDefault();
    const delta = e.clientY - baselineY.current;
    const idx = items.findIndex((a) => a.id === dragId);
    if (idx === -1) return;

    const steps = Math.trunc(delta / slotH.current);
    if (steps !== 0) {
      const target = Math.max(0, Math.min(items.length - 1, idx + steps));
      const moved = target - idx;
      if (moved !== 0) {
        setItems((prev) => {
          const next = [...prev];
          const [m] = next.splice(idx, 1);
          next.splice(target, 0, m);
          return next;
        });
        baselineY.current += moved * slotH.current;
        setDragY(e.clientY - baselineY.current);
        return;
      }
    }
    setDragY(delta);
  };

  const end = (e: React.PointerEvent) => {
    if (!dragId) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    onReorder(items.map((a) => a.id));
    setDragId(null);
    setDragY(0);
  };

  return (
    <div className="space-y-2">
      {items.map((acc) => {
        const AccIcon = acc.icon;
        const isCustom = acc.user_id && acc.user_id !== 'system';
        const dragging = dragId === acc.id;
        return (
          <div
            key={acc.id}
            ref={(el) => { if (el) rowEls.current.set(acc.id, el); else rowEls.current.delete(acc.id); }}
            style={dragging ? { transform: `translateY(${dragY}px)`, zIndex: 30 } : undefined}
            className={`relative flex items-center gap-1.5 p-3 border rounded-2xl ${t.surface} ${dragging ? `shadow-xl scale-[1.02] ${t.primaryBorder}` : `${t.border} transition-transform`}`}
          >
            <button
              type="button"
              aria-label={`Reorder ${acc.name}`}
              onPointerDown={(e) => begin(e, acc.id)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              style={{ touchAction: 'none' }}
              className={`shrink-0 -ml-1 p-1.5 ${t.textSub} cursor-grab active:cursor-grabbing rounded-lg ${t.surfaceHover}`}
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.bg} border ${t.border} ${acc.color} shrink-0`}>
              <AccIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-sm block truncate">{acc.name}</span>
              <span className={`text-[10px] ${t.textSub} block truncate`}>
                {acc.description ? acc.description : `${acc.currency} • Bal: ${acc.balance?.toLocaleString()}`}
              </span>
            </div>

            {isCustom ? (
              <div className="flex items-center shrink-0">
                <button
                  onClick={() => onEdit(acc)}
                  aria-label={`Edit ${acc.name}`}
                  className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(acc.id)}
                  aria-label={`Delete ${acc.name}`}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                >
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
  );
}
