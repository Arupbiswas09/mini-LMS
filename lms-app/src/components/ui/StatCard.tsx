import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

export interface StatCardProps {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  const progress = useSharedValue(0);
  const [display, setDisplay] = useState(0);

  useAnimatedReaction(
    () => progress.value,
    (current) => {
      runOnJS(setDisplay)(Math.round(current));
    },
    [progress]
  );

  useEffect(() => {
    progress.value = withTiming(value, { duration: 700 });
  }, [value, progress]);

  return (
    <View
      className="flex-1 mx-1 bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 items-center border border-neutral-100 dark:border-neutral-700"
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Ionicons name={icon} size={22} color="#2563eb" importantForAccessibility="no-hide-descendants" />
      <Text className="text-xl font-bold text-neutral-900 dark:text-white mt-2">{display}</Text>
      <Text className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 text-center">
        {label}
      </Text>
    </View>
  );
}
