import { MS_PER_DAY, TIME_UNITS } from '../config/date.config';

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

export function daysBetween(from: Date, to: Date): number {
  const a: number = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b: number = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Relative time such as "3 hours ago" or "منذ 3 ساعات", via `Intl.RelativeTimeFormat`.
 *
 * @param timestamp When it happened (ISO string).
 * @param now The current time.
 * @param locale The UI language.
 * @return The largest unit that fits ("3 hours ago", not "180 minutes ago"); under a minute is "now".
 */
export function timeAgo(timestamp: string, now: Date, locale: string): string {
  const format: Intl.RelativeTimeFormat = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds: number = Math.round((new Date(timestamp).getTime() - now.getTime()) / 1000);
  for (const [unit, size] of TIME_UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, 'second');
}
