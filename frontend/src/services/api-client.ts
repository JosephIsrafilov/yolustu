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
    // Justification: responseBody is type unknown. Casting is necessary to access potentially present message/detail properties on the error response payload.
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
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async request<T>(method: RequestMethod, path: string, body?: unknown): Promise<T> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token && shouldAttemptRefresh(path)) {
          headers['Authorization'] = `Bearer ${token}`;
        }
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
      });

      const responseBody = await parseResponseBody(response);

      if (response.status === 401 && typeof window !== 'undefined' && shouldAttemptRefresh(path)) {
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

      // Justification: Fetch responses are dynamically typed. The return type T is provided by the caller, requiring a type assertion to return the casted response body.
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
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { accessToken, refreshToken: rotatedRefreshToken } =
          await this.post<RefreshResponse>('/auth/refresh', { refreshToken });

        localStorage.setItem('token', accessToken);
        localStorage.setItem('refresh_token', rotatedRefreshToken);

        this.onTokenRefreshed(accessToken);
        this.isRefreshing = false;
        return this.request<T>(method, path, body);
      } catch (error) {
        this.isRefreshing = false;
        this.onTokenRefreshFailed(error);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = ROUTES.login;
        }
        throw error;
      }
    }

    return new Promise<T>((resolve, reject) => {
      this.subscribeTokenRefresh(
        () => {
          this.request<T>(method, path, body).then(resolve).catch(reject);
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
