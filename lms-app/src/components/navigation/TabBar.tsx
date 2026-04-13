import React, { useCallback } from 'react';
import { View, Text, Pressable, type LayoutChangeEvent } from 'react-native';
import { type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'library-outline',
  bookmarks: 'bookmark-outline',
  profile: 'person-outline',
};

const TAB_ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'library',
  bookmarks: 'bookmark',
  profile: 'person',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const indicatorX = useSharedValue(0);
  const tabWidth = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth.value,
  }));

  const handleTabLayout = useCallback(
    (index: number) => (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      if (index === state.index) {
        tabWidth.value = width;
        indicatorX.value = index * width;
      }
    },
    [state.index, indicatorX, tabWidth],
  );

  return (
    <View className="flex-row border-t border-neutral-200 bg-white pb-6 pt-2 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Animated pill indicator */}
      <Animated.View
        style={indicatorStyle}
        className="absolute left-0 top-0 h-[3px] rounded-full bg-blue-600"
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const label = (options.title ?? route.name) as string;
        const isFocused = state.index === index;

        const iconName = isFocused
          ? TAB_ICONS_ACTIVE[route.name] ?? 'ellipse'
          : TAB_ICONS[route.name] ?? 'ellipse-outline';

        const handlePress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Animate indicator
            const totalWidth = tabWidth.value;
            indicatorX.value = withSpring(index * totalWidth, { damping: 20, stiffness: 200 });

            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={handlePress}
            onLayout={handleTabLayout(index)}
            className="flex-1 items-center justify-center py-1"
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? '#2563eb' : '#9ca3af'}
            />
            <Text
              className={`mt-0.5 text-[10px] font-medium ${
                isFocused ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
