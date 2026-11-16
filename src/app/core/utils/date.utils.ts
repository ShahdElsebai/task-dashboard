const MS_PER_DAY: number = 24 * 60 * 60 * 1000;

/**
 * Parses a `YYYY-MM-DD` string as local midnight.
 *
 * `new Date('2026-11-16')` is parsed as UTC, which shows the previous day
 * in timezones west of UTC. Building the date from its parts avoids that.
 */
export function parseDateOnly(value: string): Date {
  const [year, month, day]: number[] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toDateOnlyString(date: Date): string {
  const y: number = date.getFullYear();
  const m: string = String(date.getMonth() + 1).padStart(2, '0');
  const d: string = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Whole calendar days from `from` to `to` (negative when `to` is earlier).
 * Uses UTC day numbers so daylight-saving changes don't skew the result.
 */
export function daysBetween(from: Date, to: Date): number {
  const a: number = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b: number = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}
