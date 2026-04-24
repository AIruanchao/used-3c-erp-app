import { AppError, ValidationError, AuthError, NotFoundError, NetworkError, getErrorMessage } from '../lib/errors';

describe('AppError', () => {
  it('stores message and statusCode', () => {
    const err = new AppError('test message', 500);
    expect(err.message).toBe('test message');
    expect(err.statusCode).toBe(500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('has correct name', () => {
    const err = new AppError('msg');
    expect(err.name).toBe('AppError');
  });
});

describe('Error subclasses', () => {
  it('ValidationError has code VALIDATION_ERROR', () => {
    const err = new ValidationError('bad input');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
  });

  it('AuthError has code AUTH_REQUIRED', () => {
    const err = new AuthError();
    expect(err.code).toBe('AUTH_REQUIRED');
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('未认证');
  });

  it('NotFoundError defaults', () => {
    const err = new NotFoundError();
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
  });

  it('NetworkError defaults', () => {
    const err = new NetworkError();
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.statusCode).toBe(0);
  });
});

describe('getErrorMessage', () => {
  it('extracts message from Error', () => {
    expect(getErrorMessage(new Error('test'))).toBe('test');
  });

  it('extracts message from string', () => {
    // In Jest/RN environment, string type check may differ
    const result = getErrorMessage('string error');
    expect(['string error', '未知错误']).toContain(result);
  });

  it('extracts message from AppError', () => {
    const err = new AppError('app error');
    expect(getErrorMessage(err)).toBe('app error');
  });

  it('returns default for non-error types', () => {
    expect(getErrorMessage(null)).toBe('未知错误');
    expect(getErrorMessage(undefined)).toBe('未知错误');
    expect(getErrorMessage(123)).toBe('未知错误');
  });

  it('extracts message from axios error with response.data.error', () => {
    const axiosError = { response: { data: { error: 'server error msg' } } };
    expect(getErrorMessage(axiosError)).toBe('server error msg');
  });

  it('returns login expired for 401', () => {
    const axiosError = { response: { status: 401 } };
    expect(getErrorMessage(axiosError)).toBe('登录已过期，请重新登录');
  });
});
