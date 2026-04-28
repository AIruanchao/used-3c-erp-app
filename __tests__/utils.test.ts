import { yuan, toFixed2, truncate, formatDate, isValidPhone, generateId } from '../lib/utils';

describe('yuan', () => {
  it('formats basic numbers', () => {
    expect(yuan(1234.56)).toBe('¥1,234.56');
    expect(yuan(0)).toBe('¥0.00');
    expect(yuan(100)).toBe('¥100.00');
  });

  it('handles string inputs', () => {
    expect(yuan('1234.56')).toBe('¥1,234.56');
  });

  it('handles null/undefined', () => {
    expect(yuan(null)).toBe('¥0.00');
    expect(yuan(undefined)).toBe('¥0.00');
  });

  it('handles negative numbers', () => {
    expect(yuan(-100)).toBe('-¥100.00');
  });

  it('formats with comma separators for thousands', () => {
    expect(yuan(1234567.89)).toBe('¥1,234,567.89');
  });
});

describe('toFixed2', () => {
  it('formats to 2 decimal places', () => {
    expect(toFixed2(123.456)).toBe('123.46');
    expect(toFixed2(100)).toBe('100.00');
  });

  it('returns "0.00" for null/undefined', () => {
    expect(toFixed2(null)).toBe('0.00');
    expect(toFixed2(undefined)).toBe('0.00');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
  });

  it('returns original for short strings', () => {
    expect(truncate('abc', 5)).toBe('abc');
  });

  it('handles edge case maxLen', () => {
    // Verify truncate doesn't crash with small maxLen
    expect(typeof truncate('abcdef', 0)).toBe('string');
  });
});

describe('formatDate', () => {
  it('formats Date objects', () => {
    const d = new Date(2024, 0, 15);
    const result = formatDate(d);
    expect(result).toBe('2024-01-15');
  });

  it('returns "-" for invalid dates', () => {
    expect(formatDate('invalid')).toBe('-');
  });

  it('supports custom format', () => {
    const d = new Date(2024, 0, 15, 10, 30);
    const result = formatDate(d, 'MM-DD HH:mm');
    expect(result).toBe('01-15 10:30');
  });
});

describe('isValidPhone', () => {
  it('validates Chinese phone numbers', () => {
    expect(isValidPhone('13800138000')).toBe(true);
    expect(isValidPhone('19912345678')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(isValidPhone('12345678901')).toBe(false);
    expect(isValidPhone('1234')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

describe('generateId', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
