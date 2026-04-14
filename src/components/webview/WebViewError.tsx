import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface WebViewErrorProps {
  error?: Error | null;
  onRetry: () => void;
  isRetrying?: boolean;
}

function messageFor(error: Error | null | undefined): string {
  if (!error) return 'Something went wrong while loading this page.';
  const msg = error.message.toLowerCase();
  if (msg.includes('network') || msg.includes('internet')) {
    return 'Check your connection and try again.';
  }
  if (msg.includes('ssl') || msg.includes('certificate')) {
    return 'A secure connection could not be established.';
  }
  return error.message || 'Unable to load content.';
}

export function WebViewError({ error, onRetry, isRetrying }: WebViewErrorProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 bg-white dark:bg-neutral-900">
      <Ionicons name="cloud-offline-outline" size={48} color="#9ca3af" />
      <Text className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-4 text-center">
        Could not load course view
      </Text>
      <Text className="text-neutral-500 dark:text-neutral-400 text-center mt-2 text-sm">
        {messageFor(error ?? null)}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        disabled={isRetrying}
        className="mt-8 bg-primary-600 px-8 py-3 rounded-xl flex-row items-center gap-2"
        accessibilityRole="button"
        accessibilityState={{ disabled: !!isRetrying }}
      >
        {isRetrying ? <ActivityIndicator color="#fff" /> : null}
        <Text className="text-white font-semibold">{isRetrying ? 'Retrying…' : 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );
}
