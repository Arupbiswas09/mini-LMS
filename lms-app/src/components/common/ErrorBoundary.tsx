import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Sentry from '@sentry/react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetKeys?: unknown[];
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, errorInfo.componentStack);
    }

    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });

    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (!this.state.hasError) return;
    const prevKeys = prevProps.resetKeys ?? [];
    const currKeys = this.props.resetKeys ?? [];
    const changed = prevKeys.length !== currKeys.length || prevKeys.some((k, i) => k !== currKeys[i]);
    if (changed) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = (): void => {
    this.setState({ hasError: false, error: null });
    router.replace('/');
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-900">
        <Text className="mb-2 text-6xl">⚠️</Text>
        <Text className="mb-2 text-center text-xl font-bold text-neutral-900 dark:text-white">
          Something went wrong
        </Text>
        <Text className="mb-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </Text>

        <Pressable
          onPress={this.handleRetry}
          className="mb-3 w-full rounded-xl bg-blue-600 px-6 py-3"
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text className="text-center font-semibold text-white">Retry</Text>
        </Pressable>

        <Pressable
          onPress={this.handleGoHome}
          className="w-full rounded-xl border border-neutral-300 px-6 py-3 dark:border-neutral-600"
          accessibilityRole="button"
          accessibilityLabel="Go Home"
        >
          <Text className="text-center font-semibold text-neutral-700 dark:text-neutral-200">
            Go Home
          </Text>
        </Pressable>
      </View>
    );
  }
}
