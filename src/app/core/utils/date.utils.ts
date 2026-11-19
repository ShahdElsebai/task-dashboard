import { MS_PER_DAY } from '../config/date.config';

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
