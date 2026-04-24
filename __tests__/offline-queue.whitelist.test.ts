import { enqueueAction, clearQueue, getOfflineQueue } from '../services/offline-queue';

describe('offline-queue whitelist', () => {
  beforeEach(() => {
    clearQueue();
  });

  it('allows whitelisted relative API paths', () => {
    enqueueAction('/api/repair/create', 'POST', { a: 1 });
    const q = getOfflineQueue();
    expect(q.length).toBe(1);
    expect(q[0]?.url).toBe('/api/repair/create');
  });

  it('blocks non-whitelisted paths', () => {
    expect(() => enqueueAction('/api/not-allowed', 'POST', {})).toThrow(
      /blocked unsafe url/i,
    );
  });

  it('blocks protocol / absolute URLs', () => {
    expect(() => enqueueAction('https://evil.com/api/repair/create', 'POST', {})).toThrow();
    expect(() => enqueueAction('//evil.com/api/repair/create', 'POST', {})).toThrow();
    expect(() => enqueueAction('http://evil.com/api/repair/create', 'POST', {})).toThrow();
  });
});

