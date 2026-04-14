import React, { useState, useCallback, forwardRef } from 'react';
import { View, TextInput, Text, Pressable, type TextInputProps } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends Omit<TextInputProps, 'onChange'> {
  label?: string;
  error?: string;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  clearable?: boolean;
  disabled?: boolean;
  onChangeText?: (text: string) => void;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    iconLeft,
    iconRight,
    clearable = false,
    disabled = false,
    value,
    onChangeText,
    ...rest
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleClear = useCallback(() => onChangeText?.(''), [onChangeText]);

  const borderColor = error
    ? 'border-red-500'
    : isFocused
      ? 'border-blue-500'
      : 'border-neutral-300 dark:border-neutral-600';

  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center rounded-xl border bg-white px-3 dark:bg-neutral-800 ${borderColor} ${disabled ? 'opacity-50' : ''}`}
      >
        {iconLeft && (
          <Ionicons
            name={iconLeft}
            size={18}
            color={isFocused ? '#3b82f6' : '#9ca3af'}
            style={{ marginRight: 8 }}
          />
        )}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          className="flex-1 py-3 text-base text-neutral-900 dark:text-white"
          placeholderTextColor="#9ca3af"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          {...rest}
        />

        {clearable && value ? (
          <Pressable onPress={handleClear} hitSlop={8} accessibilityLabel="Clear input">
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </Pressable>
        ) : iconRight ? (
          <Ionicons
            name={iconRight}
            size={18}
            color={isFocused ? '#3b82f6' : '#9ca3af'}
          />
        ) : null}
      </View>

      {error && (
        <Animated.Text
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="mt-1 text-xs text-red-500"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
});
