type MoneyLike = string | number | null | undefined;

function toMoneyString(v: MoneyLike): string {
  if (v == null) return '0';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0';
  if (typeof v === 'string') return v.trim() || '0';
  return '0';
}

/**
 * Parse money to cents as BigInt (no float math).
 * Accepts: "0", "12", "12.3", "12.34".
 */
export function moneyToCents(v: MoneyLike): bigint {
  const s = toMoneyString(v);
  const neg = s.startsWith('-');
  const raw = neg ? s.slice(1) : s;
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(raw)) return 0n;
  const [i, dRaw = ''] = raw.split('.');
  const d = dRaw || '';
  const base = BigInt(i || '0') * 100n + BigInt((d + '00').slice(0, 2));
  const third = d.length >= 3 ? (d[2] ?? '0') : '0';
  const rounded = third >= '5' ? base + 1n : base;
  return neg ? -rounded : rounded;
}

export function centsToFixed2(cents: bigint): string {
  const neg = cents < 0n;
  const abs = neg ? -cents : cents;
  const i = abs / 100n;
  const d = abs % 100n;
  const out = `${i.toString()}.${d.toString().padStart(2, '0')}`;
  return neg ? `-${out}` : out;
}

export function formatMoney(v: MoneyLike, opts?: { prefix?: string; hide?: boolean }): string {
  const prefix = opts?.prefix ?? '¥';
  const cents = moneyToCents(v);
  const neg = cents < 0n;
  if (opts?.hide) return neg ? `-${prefix}***` : `${prefix}***`;
  const abs = neg ? -cents : cents;
  const i = (abs / 100n).toString();
  const d = (abs % 100n).toString().padStart(2, '0');
  const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const core = `${prefix}${withCommas}.${d}`;
  return neg ? `-${core}` : core;
}

export function addCents(list: MoneyLike[]): bigint {
  return list.reduce((s, x) => s + moneyToCents(x), 0n);
}

