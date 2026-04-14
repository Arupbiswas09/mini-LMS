import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface WebViewProgressBarProps {
  /** 0–1 from WebView onLoadProgress */
  progress: number;
  /** When true, parent stops rendering this bar */
  hidden?: boolean;
}

export function WebViewProgressBar({ progress, hidden }: WebViewProgressBarProps) {
  const { width: windowWidth } = useWindowDimensions();
  const pct = useSharedValue(0);

  useEffect(() => {
    pct.value = withTiming(Math.min(1, Math.max(0, progress)), { duration: 160 });
  }, [progress, pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: pct.value * windowWidth,
  }));

  if (hidden) return null;

  return (
    <View className="h-1 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
      <Animated.View className="h-full bg-primary-600 rounded-full" style={barStyle} />
    </View>
  );
}
