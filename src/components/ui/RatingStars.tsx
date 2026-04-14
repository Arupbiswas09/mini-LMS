import type { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface RatingStarsProps {
  rating: number;
  size?: number;
  showCount?: boolean;
  count?: number;
  starColor?: string;
  emptyStarColor?: string;
}

export function RatingStars({
  rating,
  size = 14,
  showCount,
  count,
  starColor = '#f59e0b',
  emptyStarColor = '#d1d5db',
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5 && full < 5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  const stars: ReactNode[] = [];
  for (let i = 0; i < full; i += 1) {
    stars.push(<Ionicons key={`f-${i}`} name="star" size={size} color={starColor} />);
  }
  if (hasHalf) {
    stars.push(<Ionicons key="h" name="star-half" size={size} color={starColor} />);
  }
  for (let i = 0; i < empty; i += 1) {
    stars.push(<Ionicons key={`e-${i}`} name="star-outline" size={size} color={emptyStarColor} />);
  }

  return (
    <View
      className="flex-row items-center"
      accessibilityRole="text"
      accessibilityLabel={`Rating ${clamped.toFixed(1)} out of 5${count !== undefined ? `, ${count} reviews` : ''}`}
    >
      {stars}
      {showCount && count !== undefined ? (
        <Text className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">({count})</Text>
      ) : null}
    </View>
  );
}
