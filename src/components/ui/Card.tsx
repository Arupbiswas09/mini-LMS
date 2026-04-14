import React, { useCallback } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'elevated' | 'outlined' | 'ghost';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  className?: string;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  elevated:
    'bg-white dark:bg-neutral-800 shadow-md rounded-2xl',
  outlined:
    'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl',
  ghost: 'bg-transparent rounded-2xl',
};

export const Card = React.memo(function Card({
  children,
  variant = 'elevated',
  onPress,
  className = '',
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [onPress, scale]);

  const base = `${VARIANT_CLASSES[variant]} p-4 ${className}`;

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        className={base}
        accessibilityRole="button"
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View className={base}>{children}</View>;
});
