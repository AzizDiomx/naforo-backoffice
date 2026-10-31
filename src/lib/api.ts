const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL: string = (
  (!isLocalhost && isBrowser)
    ? (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'https://backend.naforo.company/api/v1')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1')
).replace(/\/+$/, '');

export const API_ORIGIN: string = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export function getFileUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://localhost:3000') || path.startsWith('http://127.0.0.1:3000') || path.includes('localhost:3000')) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_ORIGIN);
    }
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (path.includes('localhost') || path.includes('127.0.0.1'))) {
      return path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_ORIGIN);
    }
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${cleanPath}`;
}

export class ApiError extends Error {
  status: number;
  errors?: any;

  constructor(message: string, status: number, errors?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/refresh-token',
];

function isPublicAuthEndpoint(endpoint: string): boolean {
  return PUBLIC_AUTH_ENDPOINTS.some((pub) => endpoint.startsWith(pub));
}

function isPublicAuthPage(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password') ||
    path.startsWith('/reset-password') ||
    path.startsWith('/verify-email')
  );
}

/**
 * Décode la charge utile (payload) d'un JWT sans dépendance externe
 * et vérifie s'il est expiré ou expire dans moins de `bufferSeconds` secondes.
 */
export function isTokenExpiringSoon(token: string | null, bufferSeconds = 60): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp - nowSeconds <= bufferSeconds;
  } catch {
    return true;
  }
}

let isRedirectingToLogin = false;

export function handleSessionExpired(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  if (isPublicAuthPage() || isRedirectingToLogin) return;
  isRedirectingToLogin = true;

  const currentPath = window.location.pathname + window.location.search;
  const redirectParam =
    currentPath && currentPath !== '/' && !currentPath.startsWith('/login')
      ? `&redirect=${encodeURIComponent(currentPath)}`
      : '';
  window.location.href = `/login?expired=1${redirectParam}`;
}

// Mutex single-flight : garantit qu'une seule requête /auth/refresh-token est envoyée à la fois
// même si 5 composants déclenchent un rafraîchissement en parallèle.
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      handleSessionExpired();
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleSessionExpired();
        }
        return null;
      }

      const json = await res.json();
      if (json.success && json.data?.accessToken) {
        localStorage.setItem('accessToken', json.data.accessToken);
        if (json.data.refreshToken) {
          localStorage.setItem('refreshToken', json.data.refreshToken);
        }
        return json.data.accessToken as string;
      }

      handleSessionExpired();
      return null;
    } catch {
      // En cas de coupure réseau temporaire (offline), ne pas déconnecter brutalement l'utilisateur
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = isBrowser ? localStorage.getItem('accessToken') : null;
  const isPublic = isPublicAuthEndpoint(endpoint);

  // 0. Rafraîchissement proactif si le jeton d'accès est expiré ou expire dans moins de 60s
  if (isBrowser && !isPublic && endpoint !== '/auth/logout') {
    const hasRefresh = Boolean(localStorage.getItem('refreshToken'));
    if ((!token && hasRefresh) || (token && isTokenExpiringSoon(token, 60) && hasRefresh)) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = refreshed;
      }
    }
  }

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // 1. Gestion réactive du rafraîchissement du token expiré (401)
  if (response.status === 401 && !isPublic && endpoint !== '/auth/logout') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  // 2. Traitement des erreurs globales
  if (!response.ok) {
    let message = 'Une erreur inconnue est survenue';
    let errors = null;
    try {
      const errorJson = await response.json();
      message = errorJson.message || message;
      errors = errorJson.errors || null;
    } catch {
      // Pas de corps JSON renvoyé
    }

    if (typeof window !== 'undefined') {
      const lower = message.toLowerCase();
      if (
        lower.includes("période d'essai") ||
        lower.includes("essai gratuit") ||
        (lower.includes("starter") && (lower.includes("échéance") || lower.includes("terminée") || lower.includes("terme")))
      ) {
        window.dispatchEvent(new CustomEvent('show-starter-trial-modal', { detail: { message } }));
      }
    }

    throw new ApiError(message, response.status, errors);
  }

  const json = await response.json();
  return json.data as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => fetchApi<T>(endpoint, { method: 'GET', ...options }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) => fetchApi<T>(endpoint, { method: 'DELETE', ...options }),
  
  // Téléchargement de fichiers (Multipart Form Data) avec rafraîchissement automatique du token
  upload: async <T = any>(endpoint: string, formData: FormData): Promise<T> => {
    let token = isBrowser ? localStorage.getItem('accessToken') : null;
    const hasRefresh = isBrowser && Boolean(localStorage.getItem('refreshToken'));

    if (isBrowser && ((!token && hasRefresh) || (token && isTokenExpiringSoon(token, 60) && hasRefresh))) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = refreshed;
      }
    }

    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: formData,
        });
      }
    }
    
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new ApiError(errJson.message || 'Échec du téléversement', response.status, errJson.errors);
    }
    const json = await response.json();
    return json.data as T;
  },
  postFormData: async <T = any>(endpoint: string, formData: FormData): Promise<T> => {
    return api.upload<T>(endpoint, formData);
  },
  getFileUrl: (path?: string | null) => getFileUrl(path),
  baseUrl: API_BASE_URL,
  origin: API_ORIGIN,
};
