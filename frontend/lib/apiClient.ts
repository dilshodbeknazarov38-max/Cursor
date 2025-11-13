'use client';

import { API_BASE_URL } from '@/lib/api';
import { clearSession, getClientAccessToken } from '@/lib/session';

type ApiClientOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cache?: RequestCache;
};

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;

  constructor(message: string, status: number, data?: T) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const buildUrl = (path: string) => {
  if (path.startsWith('http')) {
    return path;
  }
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

export async function apiClient<TResponse = unknown>(
  path: string,
  options: ApiClientOptions = {},
): Promise<TResponse> {
  const url = buildUrl(path);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  const token = getClientAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    signal: options.signal,
    cache: options.cache ?? 'no-cache',
    credentials: 'include',
  };

  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    init.body =
      headers['Content-Type'] === 'application/json'
        ? JSON.stringify(options.body)
        : (options.body as BodyInit);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  let data: unknown = undefined;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Clear session to force re-authentication
      clearSession();
    }

    const message =
      (typeof data === 'object' && data !== null && 'message' in data
        ? ((data as { message: string }).message ?? '')
        : '') ||
      `So'rov bajarilmadi (HTTP ${response.status}).`;

    throw new ApiError(message, response.status, data);
  }

  return data as TResponse;
}

export const apiGet = <T = unknown>(
  path: string,
  options?: Omit<ApiClientOptions, 'method' | 'body'>,
) => apiClient<T>(path, { ...options, method: 'GET' });

export const apiPost = <T = unknown, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiClientOptions, 'method' | 'body'>,
) => apiClient<T>(path, { ...options, method: 'POST', body });

export const apiPut = <T = unknown, TBody = unknown>(
  path: string,
  body?: TBody,
  options?: Omit<ApiClientOptions, 'method' | 'body'>,
) => apiClient<T>(path, { ...options, method: 'PUT', body });

export const apiDelete = <T = unknown>(
  path: string,
  options?: Omit<ApiClientOptions, 'method' | 'body'>,
) => apiClient<T>(path, { ...options, method: 'DELETE' });
