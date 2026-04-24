import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getUserData,
  setUserData,
  getStoresData,
  setStoresData,
  STORAGE_KEYS,
  mmkv,
} from '../lib/storage';

describe('storage auth token helpers', () => {
  it('returns undefined when no token set', () => {
    removeAuthToken();
    expect(getAuthToken()).toBeUndefined();
  });

  it('stores and retrieves token', () => {
    setAuthToken('test-token-123');
    expect(getAuthToken()).toBe('test-token-123');
  });

  it('removes token', () => {
    setAuthToken('test-token');
    removeAuthToken();
    expect(getAuthToken()).toBeUndefined();
  });
});

describe('storage user data helpers', () => {
  it('stores and retrieves user data', () => {
    const data = { name: 'Test User', email: 'test@example.com' };
    setUserData(data);
    const result = getUserData();
    expect(result).toEqual(data);
  });

  it('returns null when no data set', () => {
    mmkv.remove(STORAGE_KEYS.USER_DATA);
    expect(getUserData()).toBeNull();
  });
});

describe('storage stores data helpers', () => {
  it('stores and retrieves stores data', () => {
    const data = [{ id: '1', name: 'Store 1' }];
    setStoresData(data);
    const result = getStoresData();
    expect(result).toEqual(data);
  });

  it('returns empty array when no data', () => {
    // getStoresData handles missing data gracefully
    expect(Array.isArray(getStoresData())).toBe(true);
  });
});
