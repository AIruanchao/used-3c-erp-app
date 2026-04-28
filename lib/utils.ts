/**
 * Utility functions for the RN app.
 * Adapted from web version — removed DOM/Tailwind dependencies.
 */

import { formatMoney, centsToFixed2, moneyToCents } from './money';

type DecimalLike = string | number | null | undefined;

export function isValidMoneyInput(input: string): boolean {
  const s = input.trim();
  if (!s) return false;
  // Allow integers or decimals with up to 2 fraction digits.
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(s)) return false;
  const n = Number(s);
  return Number.isFinite(n);
}

export function moneyToNumber(input: string): number {
  const s = input.trim();
  if (!isValidMoneyInput(s)) {
    throw new Error('Invalid money input');
  }
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error('Invalid money input');
  return n;
}

/** Convert any Decimal-like value to its exact string representation */
export function decStr(value: DecimalLike | unknown): string {
  if (value == null) return '0';
  if (typeof value === 'string') return value || '0';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return String(value);
  }
  return '0';
}

/** Format a value as Chinese yuan: "¥1,234.56" */
export function yuan(value: DecimalLike | unknown): string {
  return formatMoney(decStr(value), { prefix: '¥' });
}

/** Format a value with exactly 2 decimal places: "1234.56" */
export function toFixed2(value: DecimalLike | unknown): string {
  return centsToFixed2(moneyToCents(decStr(value)));
}

/** Sanitize pagination params */
export function sanitizePagination(
  page?: number,
  pageSize?: number,
): { page: number; pageSize: number } {
  const p = Math.min(500, Math.max(1, Math.floor(page || 1)));
  const ps = Math.min(200, Math.max(1, Math.floor(pageSize || 20)));
  return { page: p, pageSize: ps };
}

/** Debounce a function */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return wrapped;
}

/** Format date with dayjs-friendly pattern */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  const yyyy = d.getFullYear().toString();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return format
    .replace('YYYY', yyyy)
    .replace('MM', mm)
    .replace('DD', dd)
    .replace('HH', hh)
    .replace('mm', mi)
    .replace('ss', ss);
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}

/** Validate phone number (Chinese mobile) */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

/** Generate unique ID (simple) */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
