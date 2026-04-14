import React, { useCallback } from 'react';
import { Pressable, Text, ActivityIndicator, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
}

const VARIANT_CLASSES: Record<ButtonVariant, { base: string; text: string }> = {
  primary: {
    base: 'bg-blue-600 dark:bg-blue-500',
    text: 'text-white',
  },
  secondary: {
    base: 'bg-neutral-200 dark:bg-neutral-700',
    text: 'text-neutral-900 dark:text-white',
  },
  ghost: {
    base: 'bg-transparent',
    text: 'text-blue-600 dark:text-blue-400',
  },
  danger: {
    base: 'bg-red-600 dark:bg-red-500',
    text: 'text-white',
  },
  success: {
    base: 'bg-green-600 dark:bg-green-500',
    text: 'text-white',
  },
};

const SIZE_CLASSES: Record<ButtonSize, { base: string; text: string; icon: number }> = {
  sm: { base: 'px-3 py-1.5 rounded-lg', text: 'text-xs font-semibold', icon: 14 },
  md: { base: 'px-5 py-2.5 rounded-xl', text: 'text-sm font-semibold', icon: 18 },
  lg: { base: 'px-6 py-3.5 rounded-xl', text: 'text-base font-bold', icon: 20 },
};

const SPINNER_COLORS: Record<ButtonVariant, string> = {
  primary: '#ffffff',
  secondary: '#374151',
  ghost: '#2563eb',
  danger: '#ffffff',
  success: '#ffffff',
};

export const Button = React.memo(function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, loading, onPress]);

  const v = VARIANT_CLASSES[variant];
  const s = SIZE_CLASSES[size];
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={animatedStyle}
      className={`flex-row items-center justify-center ${v.base} ${s.base} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={SPINNER_COLORS[variant]} />
      ) : (
        <>
          {iconLeft && (
            <Ionicons name={iconLeft} size={s.icon} className={`mr-1.5 ${v.text}`} />
          )}
          <Text className={`${v.text} ${s.text}`}>{label}</Text>
          {iconRight && (
            <Ionicons name={iconRight} size={s.icon} className={`ml-1.5 ${v.text}`} />
          )}
        </>
      )}
    </AnimatedPressable>
  );
});
