import React from 'react';
import { View, Text } from 'react-native';

type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  size?: BadgeSize;
}

const COLOR_CLASSES: Record<BadgeColor, { bg: string; text: string }> = {
  primary: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300' },
  success: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300' },
  warning: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-300' },
  error: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300' },
  neutral: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-600 dark:text-neutral-300' },
};

const SIZE_CLASSES: Record<BadgeSize, { container: string; text: string }> = {
  sm: { container: 'px-2 py-0.5 rounded-md', text: 'text-[10px] font-semibold' },
  md: { container: 'px-2.5 py-1 rounded-lg', text: 'text-xs font-semibold' },
};

export const Badge = React.memo(function Badge({
  label,
  color = 'primary',
  size = 'md',
}: BadgeProps) {
  const c = COLOR_CLASSES[color];
  const s = SIZE_CLASSES[size];

  return (
    <View className={`self-start ${c.bg} ${s.container}`} accessibilityRole="text">
      <Text className={`${c.text} ${s.text}`}>{label}</Text>
    </View>
  );
});
