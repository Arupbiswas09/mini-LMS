import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { BASE_URL, REQUEST_TIMEOUT } from '@/constants/api';
import { isTokenExpired } from '@/lib/security';
import { secureStorage } from '@/lib/storage/secureStorage';
import { refreshAccessTokenWithDeps, type RefreshLifecycleDeps } from './refreshLifecycle';
import { normalizeError } from './errorHandler';

let navigateToLogin: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setNavigationHandler(handler: () => void): void {
  navigateToLogin = handler;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export type { RefreshLifecycleDeps };
export { refreshAccessTokenWithDeps };

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessTokenWithDeps({
      getRefreshToken: () => secureStorage.getRefreshToken(),
      setToken: (token) => secureStorage.setToken(token),
      setRefreshToken: (token) => secureStorage.setRefreshToken(token),
      clearAll: () => secureStorage.clearAll(),
      requestRefresh: async (refreshToken) => {
        const resp = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
          `${BASE_URL}/api/v1/users/refresh-token`,
          { refreshToken }
        );
        return {
          accessToken: resp.data.data.accessToken,
          refreshToken: resp.data.data.refreshToken,
        };
      },
      onAuthFailure: () => navigateToLogin?.(),
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000,
  retryCondition: (error) => {
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
  },
  onRetry: (retryCount, error) => {
    if (__DEV__) {
      console.warn(`[API] Retry #${retryCount} for ${error.config?.url}`);
    }
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    let token = await secureStorage.getToken();

    // Proactively refresh access token before it expires to reduce failed requests.
    if (token && isTokenExpired(token)) {
      token = await refreshAccessToken();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if ('Authorization' in config.headers) {
      delete config.headers.Authorization;
    }
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    config.headers['X-Platform'] = 'react-native';
    config.headers['X-App-Version'] = '1.0.0';

    if (__DEV__) {
      console.warn(`[API] → ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: unknown) => Promise.reject(normalizeError(error))
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.warn(`[API] ← ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: unknown) => {
    const axiosError = error as import('axios').AxiosError;
    const originalConfig = axiosError.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (axiosError.response?.status === 401 && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;

      const token = await refreshAccessToken();
      if (token) {
        originalConfig.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalConfig);
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<T>(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<T>(url, data);
  return response.data;
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<T>(url, data);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiClient.patch<T>(url, data);
  return response.data;
}

export async function del<T>(url: string): Promise<T> {
  const response = await apiClient.delete<T>(url);
  return response.data;
}

export default apiClient;
