import { env } from '@/lib/env';
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

    if (
      window.location.protocol === 'https:' &&
      url.protocol === 'http:' &&
      url.hostname === window.location.hostname
    ) {
      url.protocol = 'https:';
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

function shouldAttemptRefresh(path: string): boolean {
  if (path.startsWith('/auth/')) {
    return false;
  }

  if (path === '/rides/search') {
    return false;
  }

  if (/^\/rides\/track\/[^/]+$/.test(path)) {
    return false;
  }

  if (/^\/rides\/[^/]+$/.test(path)) {
    return false;
  }

  return true;
}

function hasSessionHint(): boolean {
  return getCookie('csrf_token') !== null;
}

let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  sessionExpiredHandler = handler;
}

class ApiClient {
  private readonly baseUrl: string;
  private refreshPromise: Promise<void> | null = null;
  private sessionInvalid = false;

  constructor(baseUrl: string) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
  }

  private async request<T>(
    method: RequestMethod,
    path: string,
    body?: unknown,
    options?: RequestInit,
    allowRefresh = true,
  ): Promise<T> {
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

      if (
        response.status === 401 &&
        allowRefresh &&
        !this.sessionInvalid &&
        hasSessionHint() &&
        typeof window !== 'undefined' &&
        shouldAttemptRefresh(path)
      ) {
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

      if (path === '/auth/login' || path === '/auth/register' || path === '/auth/refresh') {
        this.sessionInvalid = false;
      }

      return responseBody as T;
    } catch (error) {
      throw toApiError(error);
    }
  }

  private async handleUnauthorized<T>(method: RequestMethod, path: string, body?: unknown, options?: RequestInit): Promise<T> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.post('/auth/refresh')
        .then(() => undefined)
        .catch((error) => {
          this.expireSession();
          throw error;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    await this.refreshPromise;
    try {
      return await this.request<T>(method, path, body, options, false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.expireSession();
      }
      throw error;
    }
  }

  private expireSession() {
    if (this.sessionInvalid) {
      return;
    }
    this.sessionInvalid = true;
    sessionExpiredHandler?.();
  }

  markSessionActive() {
    this.sessionInvalid = false;
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

  /**
   * Fetch a binary resource (image, PDF, etc.) as a Blob.
   * Uses the same baseUrl, cookie auth, and loopback normalization as other methods.
   */
  async getBlob(path: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}${normalizePath(path)}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (
      response.status === 401 &&
      !this.sessionInvalid &&
      hasSessionHint() &&
      typeof window !== 'undefined' &&
      shouldAttemptRefresh(path)
    ) {
      // Try refreshing the session then retry
      if (!this.refreshPromise) {
        this.refreshPromise = this.post('/auth/refresh')
          .then(() => undefined)
          .catch((error) => {
            this.expireSession();
            throw error;
          })
          .finally(() => {
            this.refreshPromise = null;
          });
      }
      await this.refreshPromise;

      const retryResponse = await fetch(`${this.baseUrl}${normalizePath(path)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!retryResponse.ok) {
        throw new ApiError({
          code: mapStatusToCode(retryResponse.status),
          status: retryResponse.status,
          message: `Failed to fetch resource: ${retryResponse.status}`,
        });
      }
      return retryResponse.blob();
    }

    if (!response.ok) {
      throw new ApiError({
        code: mapStatusToCode(response.status),
        status: response.status,
        message: `Failed to fetch resource: ${response.status}`,
      });
    }

    return response.blob();
  }

}

export const apiClient = new ApiClient(env.apiUrl);
