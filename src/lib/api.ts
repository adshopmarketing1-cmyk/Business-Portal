// Centralized API Client Service Layer for POCO Android Backend Server

export const API_URL_KEY = 'salihport_api_base_url';
export const TOKEN_KEY = 'salihport_auth_token';
export const USER_KEY = 'salihport_auth_user';

export const getApiBaseUrl = (): string => {
  const stored = localStorage.getItem(API_URL_KEY);
  if (stored && stored.trim() !== '') {
    return stored.trim().replace(/\/+$/, '');
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:5000';
};

export const saveApiBaseUrl = (url: string): string => {
  let cleaned = url.trim().replace(/\/+$/, '');
  localStorage.setItem(API_URL_KEY, cleaned);
  return cleaned;
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): any | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export interface ApiError {
  message: string;
  status?: number;
  isOffline?: boolean;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      removeToken();
      window.dispatchEvent(new Event('auth_session_expired'));
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || 'Session expired. Please log in again.',
        status: 401,
      } as ApiError;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.error || `Server returned status ${response.status}`,
        status: response.status,
      } as ApiError;
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    // Network or Server Offline error
    console.error('❌ Network / Phone Server Connection Error:', err);
    throw {
      message: `Unable to connect to POCO Server at ${baseUrl}. Please check that the phone is online and Termux tunnel is running.`,
      isOffline: true,
    } as ApiError;
  }
}
