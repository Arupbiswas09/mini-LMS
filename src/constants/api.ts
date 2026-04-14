const DEFAULT_BASE_URL = 'https://api.freeapi.app';

function resolveBaseUrl(): string {
  const candidate = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (!candidate) return DEFAULT_BASE_URL;

  // Keep config resilient in case env is malformed in CI or local shells.
  if (!/^https?:\/\//i.test(candidate)) return DEFAULT_BASE_URL;

  return candidate.replace(/\/+$/, '');
}

export const BASE_URL = resolveBaseUrl();

export const Endpoints = {
  auth: {
    login: '/api/v1/users/login',
    register: '/api/v1/users/register',
    logout: '/api/v1/users/logout',
    refreshToken: '/api/v1/users/refresh-token',
    currentUser: '/api/v1/users/current-user',
    updateAccount: '/api/v1/users/update-account',
    updateAvatar: '/api/v1/users/avatar',
    changePassword: '/api/v1/users/change-password',
  },
  courses: {
    list: '/api/v1/public/randomproducts',
    detail: (id: string) => `/api/v1/public/randomproducts/${id}`,
  },
  instructors: {
    list: '/api/v1/public/randomusers',
  },
} as const;

export const REQUEST_TIMEOUT = 15_000;

export const RETRY_CONFIG = {
  retries: 3,
  retryDelay: (retryCount: number) => Math.pow(2, retryCount) * 1000,
} as const;
