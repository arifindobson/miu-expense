import { describe, it, expect } from 'vitest';
import { formatDisplayAmount, formatCompact, rupiah, roundMoney, deduplicateByName } from './format';

describe('formatDisplayAmount', () => {
  it('adds thousands separators and preserves decimals as typed', () => {
    expect(formatDisplayAmount('1234567')).toBe('1,234,567');
    expect(formatDisplayAmount('1000.5')).toBe('1,000.5');
    expect(formatDisplayAmount('0')).toBe('0');
  });
});

describe('formatCompact', () => {
  it('compacts thousands and millions', () => {
    expect(formatCompact(1500)).toBe('1.5K');
    expect(formatCompact(2_300_000)).toBe('2.3M');
    expect(formatCompact(500)).toBe('500');
  });
});

describe('rupiah', () => {
  it('formats with Rp prefix and handles nullish', () => {
    expect(rupiah(1250000)).toBe('Rp 1,250,000');
    expect(rupiah(0)).toBe('Rp 0');
  });
});

describe('roundMoney', () => {
  it('rounds to 2 decimals and kills float drift', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1234.005)).toBe(1234.01);
    expect(roundMoney(NaN)).toBe(0);
  });
});

describe('deduplicateByName', () => {
  it('drops case-insensitive duplicate names, keeping the first', () => {
    const out = deduplicateByName([{ name: 'Food' }, { name: 'food' }, { name: 'Transport' }]);
    expect(out).toEqual([{ name: 'Food' }, { name: 'Transport' }]);
  });
});
