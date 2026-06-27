/** Local YYYY-MM-DD for a given date (defaults to today), avoiding UTC drift. */
export function getLocalYMD(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Human label for a transaction date: Today / Yesterday / "Jun 12". */
export function getTransactionDateLabel(dateStr: string): string {
  const today = getLocalYMD();
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = getLocalYMD(yd);

  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';

  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
