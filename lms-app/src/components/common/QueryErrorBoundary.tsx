import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import type { ApiError } from '@/types';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
}

function QueryErrorFallback({
  error,
  onRetry,
  isRetrying,
}: {
  error: Error;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const apiError = (error as unknown as { apiError?: ApiError }).apiError;

  const message =
    apiError?.userFriendlyMessage ??
    'Something went wrong while loading data. Please try again.';

  const statusLabel = apiError?.statusCode ? `Error ${apiError.statusCode}` : 'Network Error';

  return (
    <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-900">
      <Text className="mb-1 text-5xl">📡</Text>
      <Text className="mb-1 text-center text-lg font-bold text-neutral-900 dark:text-white">
        {statusLabel}
      </Text>
      <Text className="mb-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {message}
      </Text>

      <Pressable
        onPress={onRetry}
        disabled={isRetrying}
        className="rounded-xl bg-blue-600 px-8 py-3 disabled:opacity-50"
        accessibilityRole="button"
        accessibilityLabel="Retry loading"
      >
        {isRetrying ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text className="font-semibold text-white">Retry</Text>
        )}
      </Pressable>
    </View>
  );
}

export function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={() => setIsRetrying(false)}
          fallback={undefined}
          resetKeys={[isRetrying]}
        >
          <ErrorBoundary
            fallback={
              <QueryErrorFallback
                error={new Error('Unknown')}
                onRetry={() => {
                  setIsRetrying(true);
                  reset();
                  setTimeout(() => setIsRetrying(false), 100);
                }}
                isRetrying={isRetrying}
              />
            }
          >
            {children}
          </ErrorBoundary>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
