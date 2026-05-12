export type ApiErrorCode =
  | 'UNKNOWN_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER_ERROR';

interface ApiErrorParams {
  code: ApiErrorCode;
  message: string;
  status?: number;
  details?: unknown;
}

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;
  details?: unknown;

  constructor(params: ApiErrorParams) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeApiError = error as {
      code?: unknown;
      message?: unknown;
      status?: unknown;
      details?: unknown;
    };
    if (typeof maybeApiError.code === 'string' && typeof maybeApiError.message === 'string') {
      return new ApiError({
        code: maybeApiError.code as ApiErrorCode,
        message: maybeApiError.message,
        status: typeof maybeApiError.status === 'number' ? maybeApiError.status : undefined,
        details: maybeApiError.details,
      });
    }
  }

  if (error instanceof TypeError) {
    return new ApiError({
      code: 'NETWORK_ERROR',
      message: error.message || 'Network request failed.',
      details: error,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error.',
      details: error,
    });
  }

  return new ApiError({
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error.',
    details: error,
  });
}
