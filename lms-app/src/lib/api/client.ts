import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import { BASE_URL, REQUEST_TIMEOUT } from '@/constants/api';
import { secureStorage } from '@/lib/storage/secureStorage';
import { normalizeError } from './errorHandler';

let navigateToLogin: (() => void) | null = null;

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

    if (axiosError.response?.status === 401) {
      await secureStorage.clearAll();
      navigateToLogin?.();
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
