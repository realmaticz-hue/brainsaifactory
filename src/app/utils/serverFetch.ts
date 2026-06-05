import { projectId, publicAnonKey } from './supabase/info';
import { supabase } from './supabase/client';

export const SERVER_BASE =
  `https://${projectId}.supabase.co/functions/v1/make-server-7d87310d`;

export function resolveServerUrl(path = ''): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith('/')
    ? path
    : `/${path}`;

  return `${SERVER_BASE}${normalized}`;
}

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

  const headersObj: Record<string, string> = {};

  const isFormData =
    typeof FormData !== 'undefined' &&
    init.body instanceof FormData;

  if (init.body != null && !isFormData) {
    headersObj['Content-Type'] = 'application/json';
  }

  // Copy ALL supplied headers, including Authorization
  if (init.headers) {
    const suppliedHeaders = new Headers(init.headers);

    suppliedHeaders.forEach((value, key) => {
      headersObj[key] = value;
    });
  }

  // If Authorization wasn't supplied,
  // try to use the logged-in user's JWT
  const hasAuth =
    headersObj['Authorization'] ||
    headersObj['authorization'];

  if (!hasAuth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headersObj['Authorization'] =
        `Bearer ${session.access_token}`;
    } else {
      // Final fallback for public endpoints
      headersObj['Authorization'] =
        `Bearer ${publicAnonKey}`;
    }
  }

  const headers = new Headers(headersObj);

  console.log(
    `[serverFetch] → ${init.method ?? 'GET'} ${url}`
  );

  console.log(
    '[serverFetch] Auth Type:',
    headers.get('Authorization')?.startsWith('Bearer eyJ')
      ? 'USER_JWT'
      : 'ANON_KEY'
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