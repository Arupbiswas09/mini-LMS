import React from 'react';
import { View, Text } from 'react-native';
import { type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

type ProgressColor = 'primary' | 'success' | 'warning' | 'error';

interface ProgressBarProps {
  progress: number; // 0–100
  color?: ProgressColor;
  label?: string;
  showPercentage?: boolean;
  height?: number;
}

const BAR_COLORS: Record<ProgressColor, string> = {
  primary: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-500',
  error: 'bg-red-600',
};

export const ProgressBar = React.memo(function ProgressBar({
  progress,
  color = 'primary',
  label,
  showPercentage = false,
  height = 8,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  const animatedWidth = useAnimatedStyle<ViewStyle>(() => ({
    width: withSpring(`${clamped}%` as unknown as number, { damping: 20, stiffness: 120 }),
  }));

  return (
    <View className="w-full">
      {(label || showPercentage) && (
        <View className="mb-1 flex-row items-center justify-between">
          {label && (
            <Text className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {Math.round(clamped)}%
            </Text>
          )}
        </View>
      )}
      <View
        className="w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
        style={{ height }}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: clamped }}
      >
        <Animated.View
          className={`h-full rounded-full ${BAR_COLORS[color]}`}
          style={[animatedWidth]}
        />
      </View>
    </View>
  );
});
