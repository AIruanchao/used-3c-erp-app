import { loginWithEmail } from '../services/auth-service';

jest.mock('../lib/storage', () => ({
  removeAuthToken: jest.fn(),
  removeAuthSessionCookie: jest.fn(),
}));

describe('auth-service mobile login', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE = 'https://example.test';
    // @ts-expect-error - test environment override
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.EXPO_PUBLIC_API_BASE;
  });

  it('posts to /api/auth/mobile-login and returns token+user', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 't1',
        user: { id: 'u1', email: 'a@b.com', name: 'n' },
      }),
    });

    const res = await loginWithEmail('a@b.com', 'pw');
    expect(res).toEqual({ token: 't1', user: { id: 'u1', email: 'a@b.com', name: 'n' } });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.test/api/auth/mobile-login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('throws when backend returns error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: '邮箱或密码错误' }),
    });

    await expect(loginWithEmail('a@b.com', 'bad')).rejects.toThrow('邮箱或密码错误');
  });
});

