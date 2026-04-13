import { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

export type SkeletonVariant = 'line' | 'card' | 'avatar' | 'listItem';

export interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  className?: string;
}

const variantClass: Record<SkeletonVariant, string> = {
  line: 'h-3 rounded-md w-full',
  card: 'h-32 rounded-2xl w-full',
  avatar: 'h-16 w-16 rounded-full',
  listItem: 'h-20 rounded-xl w-full',
};

export function SkeletonLoader({ variant = 'line', className = '' }: SkeletonLoaderProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const opacity = useSharedValue(0.4);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.55;
      return;
    }
    opacity.value = withRepeat(
      withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false
    );
  }, [opacity, shimmer, reduceMotion]);

  const baseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-80, 220]) }],
    opacity: reduceMotion ? 0 : 0.35,
  }));

  return (
    <Animated.View
      className={`overflow-hidden bg-neutral-200 dark:bg-neutral-700 ${variantClass[variant]} ${className}`}
      style={baseStyle}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    >
      {!reduceMotion ? (
        <Animated.View
          className="absolute inset-y-0 w-1/3 bg-white dark:bg-neutral-400"
          style={shimmerStyle}
        />
      ) : null}
    </Animated.View>
  );
}
