import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

function getPasswordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Weak' };
  if (score <= 3) return { score, label: 'Medium' };
  return { score, label: 'Strong' };
}

export interface PasswordStrengthBarProps {
  password: string;
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { score, label } = getPasswordStrength(password);
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = password ? score / 5 : 0;
    progress.value = withTiming(target, { duration: 280 });
  }, [score, password, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.35, 0.65, 1],
      ['#ef4444', '#f59e0b', '#22c55e', '#16a34a']
    ),
  }));

  if (!password) return null;

  return (
    <View className="mt-2">
      <View className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <Animated.View className="h-full rounded-full" style={barStyle} />
      </View>
      <Text className="text-xs mt-1 font-medium text-neutral-600 dark:text-neutral-400">{label}</Text>
    </View>
  );
}
