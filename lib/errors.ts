export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  details?: Record<string, unknown>;
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class AuthError extends AppError {
  constructor(message: string = '未认证') {
    super(message, 401, 'AUTH_REQUIRED');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class NetworkError extends AppError {
  constructor(message: string = '网络连接失败') {
    super(message, 0, 'NETWORK_ERROR');
  }
}

/** Extract error message from axios error */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { data?: { error?: string; 错误?: string }; status?: number } };
    if (axiosErr.response?.data?.error) return axiosErr.response.data.error;
    if (axiosErr.response?.data?.错误) return axiosErr.response.data.错误;
    if (axiosErr.response?.status === 401) return '登录已过期，请重新登录';
    if (axiosErr.response?.status === 403) return '权限不足';
    if (axiosErr.response?.status === 500) return '服务器错误';
  }
  if (error instanceof Error) return error.message;
  return '未知错误';
}
