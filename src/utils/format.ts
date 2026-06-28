/** Format a numeric string/number for the amount display, keeping decimals as typed. */
export function formatDisplayAmount(str: string | number): string {
  const parts = str.toString().split('.');
  const formattedInt = new Intl.NumberFormat('en-US').format(parseFloat(parts[0]) || 0);
  return parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
}

/** Compact money label for charts/stats: 1.2M, 3.4K, or full thousands. */
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

/** Rupiah label, e.g. "Rp 1,250,000". */
export function rupiah(amount: number): string {
  return `Rp ${(amount || 0).toLocaleString()}`;
}

/**
 * Money rounding. Amounts are treated as currency values with at most 2 decimal
 * places (IDR, the primary currency, has none — USD/SGD have 2). This kills the
 * floating-point drift that `parseFloat`/calculator arithmetic can introduce
 * before a value is stored. NOTE: this is a pragmatic guard, not a full
 * integer-minor-unit money model (see audit 3.2) — revisit if more currencies
 * with different precision are added.
 */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Case-insensitive de-duplication by `name`. */
export function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
