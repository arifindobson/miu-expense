import { describe, it, expect } from 'vitest';
import { applyOperator } from './calc';

describe('applyOperator', () => {
  it('adds, subtracts, multiplies, divides', () => {
    expect(applyOperator(2, 3, '+')).toBe(5);
    expect(applyOperator(10, 4, '-')).toBe(6);
    expect(applyOperator(6, 7, 'x')).toBe(42);
    expect(applyOperator(20, 5, '/')).toBe(4);
  });

  it('returns 0 when dividing by zero (no Infinity)', () => {
    expect(applyOperator(5, 0, '/')).toBe(0);
  });

  it('trims floating-point noise', () => {
    expect(applyOperator(0.1, 0.2, '+')).toBe(0.3);
  });

  it('falls back to the second operand for an unknown operator', () => {
    expect(applyOperator(2, 9, '?')).toBe(9);
  });
});
