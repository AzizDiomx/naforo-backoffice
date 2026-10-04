const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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

async function refreshToken(): Promise<string | null> {
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) throw new Error();
    const json = await res.json();
    if (json.success && json.data.accessToken) {
      localStorage.setItem('accessToken', json.data.accessToken);
      localStorage.setItem('refreshToken', json.data.refreshToken);
      return json.data.accessToken;
    }
    return null;
  } catch {
    // Session expirée -> Déconnexion
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return null;
  }
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = localStorage.getItem('accessToken');

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

  // 1. Gestion du rafraîchissement du token expiré (401)
  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
    const newToken = await refreshToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${API_BASE_URL}${endpoint}`, config);
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
  
  // Téléchargement de fichiers (Multipart Form Data)
  upload: async <T = any>(endpoint: string, formData: FormData): Promise<T> => {
    const token = localStorage.getItem('accessToken');
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new ApiError(errJson.message || 'Échec du téléversement', response.status);
    }
    const json = await response.json();
    return json.data as T;
  },
  postFormData: async <T = any>(endpoint: string, formData: FormData): Promise<T> => {
    return api.upload<T>(endpoint, formData);
  }
};
