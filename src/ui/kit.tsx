import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Themed UI kit — the expense-input screen's visual language (rounded-2xl cards,
 * soft surfaces, `active:scale` press states) promoted into reusable primitives.
 * Every primitive reads the active theme from context, so a theme switch restyles
 * the whole app and screens stop hand-rolling bespoke class strings.
 */

export function Card({
  children,
  className = '',
  onClick,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: 'div' | 'button';
}) {
  const { t } = useTheme();
  const base = `rounded-2xl border ${t.surfaceBorder} ${t.surface} ${className}`;
  if (as === 'button' || onClick) {
    return (
      <button onClick={onClick} className={`${base} ${t.surfaceHover} text-left transition-all active:scale-[0.98] cursor-pointer`}>
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { t } = useTheme();
  return (
    <span className={`text-[11px] ${t.textSub} font-semibold uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

type ButtonVariant = 'primary' | 'surface' | 'ghost' | 'danger';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: { children: ReactNode; variant?: ButtonVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useTheme();
  const variants: Record<ButtonVariant, string> = {
    primary: `${t.primary} shadow-sm`,
    surface: `${t.surface} border ${t.surfaceBorder} ${t.textMuted} ${t.surfaceHover}`,
    ghost: `${t.textMuted} ${t.surfaceHover}`,
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm',
  };
  return (
    <button
      {...rest}
      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className = '',
  label,
  ...rest
}: { children: ReactNode; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useTheme();
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full p-2 ${t.textSub} ${t.textSubHover} ${t.surfaceHover} transition-colors active:scale-95 cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

type BannerKind = 'success' | 'error' | 'info' | 'warning';

export function Banner({
  kind = 'info',
  children,
  onDismiss,
}: { kind?: BannerKind; children: ReactNode; onDismiss?: () => void }) {
  const styles: Record<BannerKind, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${styles[kind]}`}>
      <span className="min-w-0">{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 rounded-lg px-2 py-0.5 text-[11px] opacity-70 hover:opacity-100">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  action,
}: { emoji: string; title: string; subtitle?: string; action?: ReactNode }) {
  const { t } = useTheme();
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed ${t.border} p-8 text-center`}>
      <span className="text-3xl">{emoji}</span>
      <p className={`text-sm font-semibold ${t.textMain}`}>{title}</p>
      {subtitle && <p className={`text-xs ${t.textSub}`}>{subtitle}</p>}
      {action}
    </div>
  );
}

/** Small avatar/initials chip used for member identity in the group ledger. */
export function Avatar({ name, className = '' }: { name?: string | null; className?: string }) {
  const { t } = useTheme();
  const initials = (name || '?').trim().slice(0, 2).toUpperCase();
  return (
    <div className={`flex items-center justify-center rounded-full ${t.primarySoft} ${t.primarySoftText} text-[10px] font-bold ${className}`}>
      {initials}
    </div>
  );
}
