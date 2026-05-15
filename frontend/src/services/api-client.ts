import { env } from '@/lib/env';
import { ApiError, type ApiErrorCode, toApiError } from '@/services/api-error';

function normalizePath(path: string): string {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

function mapStatusToCode(status: number): ApiErrorCode {
  if (status === 400 || status === 422) return 'VALIDATION_ERROR';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN_ERROR';
}

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  if (!isJson) {
    return text;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError({
      code: 'SERVER_ERROR',
      status: response.status,
      message: 'Invalid JSON response from server.',
      details: text,
    });
  }
}

function extractErrorMessage(responseBody: unknown, status: number): string {
  if (typeof responseBody === 'object' && responseBody !== null) {
    const body = responseBody as { message?: unknown; detail?: unknown; error?: unknown };
    if (typeof body.message === 'string') return body.message;
    if (typeof body.detail === 'string') return body.detail;
    if (typeof body.error === 'string') return body.error;
  }

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody;
  }

  return `Request failed with status ${status}.`;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(method: RequestMethod, path: string, body?: unknown): Promise<T> {
    try {
      
      const response = await fetch(`${this.baseUrl}${normalizePath(path)}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const responseBody = await parseResponseBody(response);
      if (!response.ok) {
        const message = extractErrorMessage(responseBody, response.status);
        throw new ApiError({
          code: mapStatusToCode(response.status),
          status: response.status,
          message,
          details: responseBody,
        });
      }
      return responseBody as T;
    } catch (error) {
      throw toApiError(error);
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const apiClient = new ApiClient(env.apiUrl);
