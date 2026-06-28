/** Pure calculator arithmetic, extracted so it can be unit-tested independently of the hook. */
export function applyOperator(a: number, b: number, operator: string): number {
  let res: number;
  switch (operator) {
    case '+': res = a + b; break;
    case '-': res = a - b; break;
    case 'x': res = a * b; break;
    case '/': res = b !== 0 ? a / b : 0; break;
    default: return b;
  }
  // Trim floating-point noise to 6 significant decimals
  return Math.round(res * 1_000_000) / 1_000_000;
}
