import { describe, it, expect } from 'vitest';
import { applyOrder, isOnline, DEMO_USER } from './persistence';

describe('applyOrder', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('reorders by the saved id list', () => {
    expect(applyOrder(items, ['c', 'a', 'b']).map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });

  it('appends ids not present in the order list, preserving their order', () => {
    expect(applyOrder(items, ['b']).map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });

  it('returns the list unchanged when no order is saved', () => {
    expect(applyOrder(items, []).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('isOnline', () => {
  it('treats null and the demo sentinel as offline', () => {
    expect(isOnline(null)).toBe(false);
    expect(isOnline(DEMO_USER)).toBe(false);
    expect(isOnline('real-uuid')).toBe(true);
  });
});
