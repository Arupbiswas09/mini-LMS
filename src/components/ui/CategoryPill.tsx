import { memo, useCallback } from 'react';
import { Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CategoryPillProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

function CategoryPillComponent({ label, isSelected, onPress }: CategoryPillProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 16 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 14 });
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className={`mr-2 px-4 py-2 rounded-full border ${
        isSelected
          ? 'bg-primary-600 border-primary-600'
          : 'bg-neutral-100 dark:bg-neutral-800 border-transparent'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Category ${label}`}
      accessibilityState={{ selected: isSelected }}
    >
      <Text
        className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-neutral-600 dark:text-neutral-400'}`}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export const CategoryPill = memo(CategoryPillComponent);
