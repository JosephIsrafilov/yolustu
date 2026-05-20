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
    const body = responseBody as {
      message?: unknown;
      detail?: unknown;
      error?: { message?: string };
    };
    if (typeof body.message === 'string') return body.message;
    if (typeof body.detail === 'string') return body.detail;
    if (body.error && typeof body.error.message === 'string') return body.error.message;
  }

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody;
  }

  return `Request failed with status ${status}.`;
}

class ApiClient {
  private readonly baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(method: RequestMethod, path: string, body?: unknown): Promise<T> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${this.baseUrl}${normalizePath(path)}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const responseBody = await parseResponseBody(response);

      if (response.status === 401 && typeof window !== 'undefined' && !path.includes('/auth/refresh')) {
        return this.handleUnauthorized<T>(method, path, body);
      }

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

  private async handleUnauthorized<T>(method: RequestMethod, path: string, body?: unknown): Promise<T> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { access_token, refresh_token } = await this.post<{
          access_token: string;
          refresh_token: string;
        }>('/auth/refresh', { refresh_token: refreshToken });

        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        this.onTokenRefreshed(access_token);
        this.isRefreshing = false;
        return this.request<T>(method, path, body);
      } catch (error) {
        this.isRefreshing = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw error;
      }
    }

    return new Promise((resolve) => {
      this.subscribeTokenRefresh((token) => {
        resolve(this.request<T>(method, path, body));
      });
    });
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
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
