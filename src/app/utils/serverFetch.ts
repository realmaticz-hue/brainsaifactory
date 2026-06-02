
import { projectId, publicAnonKey } from './supabase/info';

export const SERVER_BASE =
  `https://${projectId}.supabase.co/functions/v1/make-server-7d87310d`;

/**
 * Returns a fully-qualified Edge Function URL.
 */
export function resolveServerUrl(path = ''): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith('/')
    ? path
    : `/${path}`;

  return `${SERVER_BASE}${normalized}`;
}

/**
 * Returns a callback URL for OAuth, webhooks,
 * Stripe redirects, magic links, etc.
 *
 * Examples:
 * resolveCallbackUrl('/auth/callback')
 * resolveCallbackUrl('oauth/google/callback')
 */
export function resolveCallbackUrl(path = '/auth/callback'): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : '';

  const normalized = path.startsWith('/')
    ? path
    : `/${path}`;

  return `${origin}${normalized}`;
}

export async function serverFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = resolveServerUrl(path);

  const headersObj: Record<string, string> = {
    Authorization: `Bearer ${publicAnonKey}`,
  };

  const isFormData =
    typeof FormData !== 'undefined' &&
    init.body instanceof FormData;

  if (init.body != null && !isFormData) {
    headersObj['Content-Type'] = 'application/json';
  }

  if (init.headers) {
    const suppliedHeaders = new Headers(init.headers);

    suppliedHeaders.forEach((value, key) => {
      if (key.toLowerCase() !== 'authorization') {
        headersObj[key] = value;
      }
    });
  }

  const headers = new Headers(headersObj);

  console.log(
    `[serverFetch] → ${init.method ?? 'GET'} ${url}`
  );

  const response = await fetch(url, {
    ...init,
    headers,
  });

  console.log(
    `[serverFetch] ← ${response.status} ${response.statusText}`
  );

  return response;
}

