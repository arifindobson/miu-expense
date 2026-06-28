import { describe, it, expect } from 'vitest';
import { getLocalYMD, getTransactionDateLabel } from './date';

describe('getLocalYMD', () => {
  it('formats as zero-padded YYYY-MM-DD', () => {
    expect(getLocalYMD(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(getLocalYMD(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('getTransactionDateLabel', () => {
  it('labels today and yesterday relative to now', () => {
    const today = getLocalYMD();
    const yd = new Date();
    yd.setDate(yd.getDate() - 1);
    expect(getTransactionDateLabel(today)).toBe('Today');
    expect(getTransactionDateLabel(getLocalYMD(yd))).toBe('Yesterday');
  });

  it('formats other dates as "Mon D"', () => {
    expect(getTransactionDateLabel('2020-03-15')).toBe('Mar 15');
  });

  it('returns the raw string for an invalid date', () => {
    expect(getTransactionDateLabel('not-a-date')).toBe('not-a-date');
  });
});
