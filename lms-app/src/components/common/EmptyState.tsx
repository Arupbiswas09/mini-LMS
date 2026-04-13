import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = React.memo(function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="flex-1 items-center justify-center px-8 py-16"
    >
      <Text className="mb-4 text-6xl">{icon}</Text>
      <Text className="mb-2 text-center text-xl font-bold text-neutral-900 dark:text-white">
        {title}
      </Text>
      {description && (
        <Text className="mb-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="primary" size="md" />
      )}
    </Animated.View>
  );
});
