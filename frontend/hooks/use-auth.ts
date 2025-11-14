'use client';

import { useCallback, useEffect, useState } from 'react';

import { API_BASE_URL } from '@/lib/api';
import {
  clearSession,
  getClientAccessToken,
  getClientRefreshToken,
  getRememberMePreference,
  setSession,
} from '@/lib/session';
import {
  DEFAULT_ROLE_SLUG,
  getDashboardPathFromRole,
  getRoleNameFromSlug,
  normalizeRoleSlug,
} from '@/lib/roles';

export type AuthPermission = {
  label: string;
  href: string;
  description?: string;
};

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string;
  firstName: string;
  lastName: string | null;
  role: string;
  roleName: string;
  roleRoute: string;
};

type AuthPayload = {
  user: AuthUser | null;
  permissions: AuthPermission[];
};

type AuthState = {
  user: AuthUser | null;
  permissions: AuthPermission[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

let authCache: AuthPayload | null = null;
let authPromise: Promise<AuthPayload> | null = null;

const normalizePermissions = (input: unknown): AuthPermission[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const { label, href, description } = item as Record<string, unknown>;
      if (typeof label !== 'string' || typeof href !== 'string') {
        return null;
      }
      return {
        label,
        href,
        description: typeof description === 'string' ? description : undefined,
      };
    })
    .filter((item): item is AuthPermission => Boolean(item));
};

const normalizeUser = (input: unknown): AuthUser | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const data = input as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id : '';
  if (!id) {
    return null;
  }

  const rawRole = typeof data.role === 'string' ? data.role : DEFAULT_ROLE_SLUG;
  const role = normalizeRoleSlug(rawRole);

  return {
    id,
    email: typeof data.email === 'string' ? data.email : null,
    phone: typeof data.phone === 'string' ? data.phone : '',
    firstName: typeof data.firstName === 'string' ? data.firstName : '',
    lastName: typeof data.lastName === 'string' ? data.lastName : null,
    role,
    roleName:
      typeof data.roleName === 'string'
        ? data.roleName
        : getRoleNameFromSlug(role),
    roleRoute:
      typeof data.roleRoute === 'string'
        ? data.roleRoute
        : getDashboardPathFromRole(role),
  };
};

const tryRefreshTokens = async (): Promise<boolean> => {
  const refreshToken = getClientRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });

    if (!response.ok) {
      clearSession();
      return false;
    }

    const data = await response.json();
    const rawUser = normalizeUser(data.user);
    if (!data.accessToken || !data.refreshToken || !rawUser) {
      clearSession();
      return false;
    }

    const rememberMe = getRememberMePreference();
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      role: rawUser.role,
      userId: rawUser.id,
      rememberMe,
    });

    authCache = null;
    return true;
  } catch {
    clearSession();
    return false;
  }
};

const fetchProfile = async (allowRefresh = true): Promise<AuthPayload> => {
  const accessToken = getClientAccessToken();

  if (!accessToken) {
    return { user: null, permissions: [] };
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });

  if (response.status === 401) {
    if (allowRefresh && (await tryRefreshTokens())) {
      return fetchProfile(false);
    }
    clearSession();
    return { user: null, permissions: [] };
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      typeof errorBody?.message === 'string'
        ? errorBody.message
        : 'Profil maʼlumotlarini olishda xatolik yuz berdi.';
    throw new Error(message);
  }

  const data = await response.json();
  const user = normalizeUser(data.user);
  const permissions = normalizePermissions(data.permissions);

  return {
    user,
    permissions,
  };
};

export function invalidateAuthCache() {
  authCache = null;
  authPromise = null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: authCache?.user ?? null,
    permissions: authCache?.permissions ?? [],
    loading: !authCache,
    error: null,
    refetch: async () => {},
  });

  const runFetch = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const payload = await fetchProfile();
      authCache = payload;
      setState({
        user: payload.user,
        permissions: payload.permissions,
        loading: false,
        error: null,
        refetch: runFetch,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Profilni yuklashda kutilmagan xatolik yuz berdi.';
      authCache = null;
      setState({
        user: null,
        permissions: [],
        loading: false,
        error: message,
        refetch: runFetch,
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (authCache) {
      setState({
        user: authCache.user,
        permissions: authCache.permissions,
        loading: false,
        error: null,
        refetch: runFetch,
      });
      return () => {
        isMounted = false;
      };
    }

    if (!authPromise) {
      authPromise = fetchProfile().finally(() => {
        authPromise = null;
      });
    }

    authPromise
      ?.then((payload) => {
        if (!isMounted) {
          return;
        }
        authCache = payload;
        setState({
          user: payload.user,
          permissions: payload.permissions,
          loading: false,
          error: null,
          refetch: runFetch,
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Profilni yuklashda kutilmagan xatolik yuz berdi.';
        authCache = null;
        setState({
          user: null,
          permissions: [],
          loading: false,
          error: message,
          refetch: runFetch,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [runFetch]);

  return state;
}
