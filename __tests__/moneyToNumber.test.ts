import { isValidMoneyInput, moneyToNumber } from '../lib/utils';

describe('money input', () => {
  it('accepts common valid forms', () => {
    expect(isValidMoneyInput('0')).toBe(true);
    expect(isValidMoneyInput('0.1')).toBe(true);
    expect(isValidMoneyInput('0.12')).toBe(true);
    expect(isValidMoneyInput('10')).toBe(true);
    expect(isValidMoneyInput('10.00')).toBe(true);
    expect(moneyToNumber('99.99')).toBeCloseTo(99.99);
  });

  it('rejects invalid forms', () => {
    expect(isValidMoneyInput('')).toBe(false);
    expect(isValidMoneyInput('  ')).toBe(false);
    expect(isValidMoneyInput('1e3')).toBe(false);
    expect(isValidMoneyInput('NaN')).toBe(false);
    expect(isValidMoneyInput('Infinity')).toBe(false);
    expect(isValidMoneyInput('01')).toBe(false);
    expect(isValidMoneyInput('1.234')).toBe(false);
    expect(isValidMoneyInput('.1')).toBe(false);
    expect(isValidMoneyInput('1.')).toBe(false);
  });

  it('moneyToNumber throws on invalid', () => {
    expect(() => moneyToNumber('1e3')).toThrow();
    expect(() => moneyToNumber('')).toThrow();
  });
});

