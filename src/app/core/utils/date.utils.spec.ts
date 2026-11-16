import { daysBetween, parseDateOnly, startOfDay, toDateOnlyString } from './date.utils';

describe('date utils', () => {
  it('parseDateOnly returns local midnight of that day', () => {
    const date = parseDateOnly('2026-11-16');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 10, 16, 0]);
  });

  it('toDateOnlyString round-trips with parseDateOnly', () => {
    expect(toDateOnlyString(parseDateOnly('2026-01-05'))).toBe('2026-01-05');
  });

  it('startOfDay drops the time', () => {
    expect(startOfDay(new Date(2026, 10, 16, 23, 59)).getHours()).toBe(0);
  });

  it('daysBetween counts calendar days, ignoring time of day', () => {
    const today = new Date(2026, 10, 16, 23, 0);
    expect(daysBetween(today, new Date(2026, 10, 18, 1, 0))).toBe(2);
    expect(daysBetween(today, new Date(2026, 10, 15))).toBe(-1);
    expect(daysBetween(today, new Date(2026, 10, 16, 8))).toBe(0);
  });

  it('daysBetween is not skewed by a daylight-saving change', () => {
    expect(daysBetween(new Date(2026, 2, 28), new Date(2026, 2, 30))).toBe(2);
  });
});
