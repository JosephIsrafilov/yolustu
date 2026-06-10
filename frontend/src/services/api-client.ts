import { env } from '@/lib/env';
import { ROUTES } from '@/lib/routes';
import { ApiError, type ApiErrorCode, toApiError } from '@/services/api-error';

function normalizePath(path: string): string {
  if (!path) {
    return '';
  }
  return path.startsWith('/') ? path : `/${path}`;
}

function mapStatusToCode(status: number): ApiErrorCode {
  if (status === 400 || status === 422) {
    return 'VALIDATION_ERROR';
  }
  if (status === 401) {
    return 'UNAUTHORIZED';
  }
  if (status === 403) {
    return 'FORBIDDEN';
  }
  if (status === 404) {
    return 'NOT_FOUND';
  }
  if (status === 409) {
    return 'CONFLICT';
  }
  if (status >= 500) {
    return 'SERVER_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const UNSAFE_METHODS = new Set<RequestMethod>(['POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.replace(/\/+$/, '');
  if (typeof window === 'undefined') {
    return trimmedBaseUrl;
  }

  try {
    const url = new URL(trimmedBaseUrl);
    const pageHost = window.location.hostname;
    const isPageLoopback = pageHost === 'localhost' || pageHost === '127.0.0.1';
    const isApiLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (isPageLoopback && isApiLoopback && url.hostname !== pageHost) {
      url.hostname = pageHost;
      return url.toString().replace(/\/+$/, '');
    }
  } catch {
    return trimmedBaseUrl;
  }

  return trimmedBaseUrl;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${encodeURIComponent(name)}=`));
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null;
}

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
    const parsed: unknown = JSON.parse(text);
    return parsed;
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
    if (typeof body.message === 'string') {
      return body.message;
    }
    if (typeof body.detail === 'string') {
      return body.detail;
    }
    if (body.error && typeof body.error.message === 'string') {
      return body.error.message;
    }
  }

  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody;
  }

  return `Request failed with status ${status}.`;
}

interface RefreshSubscriber {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: unknown;
}

function shouldAttemptRefresh(path: string): boolean {
  return !path.startsWith('/auth/');
}

class ApiClient {
  private readonly baseUrl: string;
  private isRefreshing = false;
  private refreshSubscribers: RefreshSubscriber[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
  }

  private async request<T>(method: RequestMethod, path: string, body?: unknown, options?: RequestInit): Promise<T> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      const csrfToken = UNSAFE_METHODS.has(method) ? getCookie('csrf_token') : null;
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      let requestBody: BodyInit | undefined;
      if (body !== undefined) {
        if (typeof FormData !== 'undefined' && body instanceof FormData) {
          requestBody = body;
        } else {
          requestBody = JSON.stringify(body);
        }
      }

      const response = await fetch(`${this.baseUrl}${normalizePath(path)}`, {
        method,
        headers,
        body: requestBody,
        credentials: 'include',
        ...options,
      });

      const responseBody = await parseResponseBody(response);

      if (response.status === 401 && typeof window !== 'undefined' && shouldAttemptRefresh(path)) {
        return this.handleUnauthorized<T>(method, path, body, options);
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

  private async handleUnauthorized<T>(method: RequestMethod, path: string, body?: unknown, options?: RequestInit): Promise<T> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const { accessToken } = await this.post<RefreshResponse>('/auth/refresh');

        this.onTokenRefreshed(accessToken);
        this.isRefreshing = false;
        return this.request<T>(method, path, body, options);
      } catch (error) {
        this.isRefreshing = false;
        this.onTokenRefreshFailed(error);
        throw error;
      }
    }

    return new Promise<T>((resolve, reject) => {
      this.subscribeTokenRefresh(
        () => {
          this.request<T>(method, path, body, options).then(resolve).catch(reject);
        },
        (error: unknown) => {
          reject(error);
        }
      );
    });
  }

  private subscribeTokenRefresh(resolve: (token: string) => void, reject: (err: unknown) => void) {
    this.refreshSubscribers.push({ resolve, reject });
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((subscriber) => {
      subscriber.resolve(token);
    });
    this.refreshSubscribers = [];
  }

  private onTokenRefreshFailed(error: unknown) {
    this.refreshSubscribers.forEach((subscriber) => {
      subscriber.reject(error);
    });
    this.refreshSubscribers = [];
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
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

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = ROUTES.login;
      }
    }
  }
}

export const apiClient = new ApiClient(env.apiUrl);
