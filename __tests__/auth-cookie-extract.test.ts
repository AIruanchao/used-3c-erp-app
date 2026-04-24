// Ensure auth-service cookie extraction supports secure cookie name variants.

import { loginWithEmail } from '../services/auth-service';

jest.mock('../lib/api', () => {
  return {
    api: {
      get: jest.fn(),
      post: jest.fn(),
    },
  };
});

jest.mock('../lib/storage', () => ({
  removeAuthToken: jest.fn(),
  removeAuthSessionCookie: jest.fn(),
}));

describe('auth-service cookie extraction', () => {
  it('extracts __Secure- next-auth cookies and returns merged cookie header', async () => {
    const { api } = require('../lib/api');

    api.get.mockImplementation((url: string, opts?: unknown) => {
      if (url === '/api/auth/csrf') {
        return Promise.resolve({ data: { csrfToken: 'csrf123' } });
      }
      if (url === '/api/auth/session') {
        // Verify caller forwards cookie for session fetch when available.
        const cookie =
          (opts as { headers?: Record<string, string> } | undefined)?.headers?.Cookie ??
          '';
        expect(cookie).toMatch(/next-auth\.session-token=/);
        return Promise.resolve({
          data: { user: { id: 'u1', email: 'a@b.com', name: 'n' } },
          headers: {},
        });
      }
      throw new Error(`unexpected GET ${url}`);
    });

    api.post.mockImplementation((url: string) => {
      if (url === '/api/auth/callback/credentials') {
        return Promise.resolve({
          headers: {
            'set-cookie': [
              '__Secure-next-auth.session-token=abc; Path=/; Secure; HttpOnly',
              '__Host-next-auth.csrf-token=def; Path=/; Secure',
            ],
          },
        });
      }
      throw new Error(`unexpected POST ${url}`);
    });

    const res = await loginWithEmail('a@b.com', 'pw');
    expect(res.user.id).toBe('u1');
    expect(res.token).toContain('__Secure-next-auth.session-token=abc');
    expect(res.token).toContain('__Host-next-auth.csrf-token=def');
    expect(res.token).toContain(';');
  });
});

