function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeLoopbackHost(url: URL): URL {
  if (typeof window === 'undefined') {
    return url;
  }

  const pageHost = window.location.hostname;
  const isPageLoopback = pageHost === 'localhost' || pageHost === '127.0.0.1';
  const isUrlLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  if (isPageLoopback && isUrlLoopback && url.hostname !== pageHost) {
    url.hostname = pageHost;
  }

  if (window.location.protocol === 'https:' && url.protocol === 'http:') {
    url.protocol = 'https:';
  }

  return url;
}

export function normalizeWebSocketBaseUrl(baseUrl: string): string {
  const trimmed = trimTrailingSlashes(baseUrl);
  try {
    const url = normalizeLoopbackHost(new URL(trimmed));
    url.pathname = trimTrailingSlashes(url.pathname).replace(/\/api\/v1$/, '') || '';
    return trimTrailingSlashes(url.toString());
  } catch {
    return trimTrailingSlashes(trimmed.replace(/\/api\/v1$/, ''));
  }
}

export function buildApiWebSocketUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiPath = normalizedPath.startsWith('/api/v1')
    ? normalizedPath
    : `/api/v1${normalizedPath}`;
  return `${normalizeWebSocketBaseUrl(env.wsUrl)}${apiPath}`;
}

export function buildApiAssetUrl(path: string): string {
  try {
    const apiUrl = normalizeLoopbackHost(new URL(env.apiUrl));

    if (/^https?:\/\//i.test(path)) {
      const assetUrl = normalizeLoopbackHost(new URL(path));
      if (window.location.protocol === 'https:' && assetUrl.protocol === 'http:') {
        assetUrl.protocol = 'https:';
      }
      const isAssetLoopback =
        assetUrl.hostname === 'localhost' || assetUrl.hostname === '127.0.0.1';
      const isApiLoopback =
        apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1';

      if (isAssetLoopback && isApiLoopback) {
        return new URL(`${assetUrl.pathname}${assetUrl.search}${assetUrl.hash}`, apiUrl.origin).toString();
      }

      return assetUrl.toString();
    }

    return new URL(path.startsWith('/') ? path : `/${path}`, apiUrl.origin).toString();
  } catch {
    return path;
  }
}

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://127.0.0.1:8000',
  mapProvider: process.env.NEXT_PUBLIC_MAP_PROVIDER ?? 'auto',
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
} satisfies {
  apiUrl: string;
  wsUrl: string;
  mapProvider: string;
  googleMapsApiKey: string;
};
