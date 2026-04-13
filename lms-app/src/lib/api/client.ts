import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { BASE_URL, REQUEST_TIMEOUT } from '@/constants/api';
import { secureStorage } from '@/lib/storage/secureStorage';
import { normalizeError } from './errorHandler';

let navigateToLogin: (() => void) | null = null;
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

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
    const token = await secureStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    config.headers['X-Platform'] = 'react-native';
    config.headers['X-App-Version'] = '1.0.0';

    if (__DEV__) {
      console.log(`[API] → ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error: unknown) => Promise.reject(normalizeError(error))
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`[API] ← ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error: unknown) => {
    const axiosError = error as import('axios').AxiosError;
    const originalConfig = axiosError.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (axiosError.response?.status === 401 && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;

      // If a refresh is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve) => {
          refreshQueue.push((token: string) => {
            originalConfig.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalConfig));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const resp = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
          `${BASE_URL}/api/v1/users/refresh-token`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefreshToken } = resp.data.data;
        await secureStorage.setToken(accessToken);
        await secureStorage.setRefreshToken(newRefreshToken);

        // Drain the queue
        refreshQueue.forEach((cb) => cb(accessToken));
        refreshQueue = [];

        originalConfig.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalConfig);
      } catch {
        // Refresh failed — log out
        refreshQueue = [];
        await secureStorage.clearAll();
        navigateToLogin?.();
      } finally {
        isRefreshing = false;
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
