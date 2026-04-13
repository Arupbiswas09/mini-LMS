import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string>;
}

export function normalizeError(error: unknown): ApiError {
  const axiosError = error as AxiosError<ApiErrorBody>;

  if (!axiosError.response) {
    return {
      type: 'network',
      message: 'No network response',
      userFriendlyMessage: "You're offline. Please check your internet connection and try again.",
    };
  }

  const { status, data } = axiosError.response;
  const serverMessage = data?.message ?? axiosError.message;

  switch (true) {
    case status === 400:
      return {
        type: 'validation',
        statusCode: 400,
        message: serverMessage,
        userFriendlyMessage: 'The information you provided is invalid. Please check your input.',
        fieldErrors: data?.errors,
      };
    case status === 401:
      return {
        type: 'auth',
        statusCode: 401,
        message: serverMessage,
        userFriendlyMessage: 'Your session has expired. Please log in again.',
      };
    case status === 403:
      return {
        type: 'permission',
        statusCode: 403,
        message: serverMessage,
        userFriendlyMessage: "You don't have permission to perform this action.",
      };
    case status === 404:
      return {
        type: 'not_found',
        statusCode: 404,
        message: serverMessage,
        userFriendlyMessage: "We couldn't find what you were looking for.",
      };
    case status === 429: {
      const retryAfterHeader = axiosError.response.headers['retry-after'] as string | undefined;
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
      return {
        type: 'rate_limit',
        statusCode: 429,
        message: serverMessage,
        userFriendlyMessage: 'Too many requests. Please wait a moment before trying again.',
        retryAfter,
      };
    }
    case status >= 500:
      return {
        type: 'server',
        statusCode: status,
        message: serverMessage,
        userFriendlyMessage: 'Something went wrong on our end. Please try again later.',
      };
    default:
      return {
        type: 'unknown',
        statusCode: status,
        message: serverMessage,
        userFriendlyMessage: 'An unexpected error occurred. Please try again.',
      };
  }
}

export function getUserFriendlyMessage(error: ApiError): string {
  return error.userFriendlyMessage;
}
