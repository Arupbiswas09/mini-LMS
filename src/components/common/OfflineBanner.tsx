import { View, Text } from 'react-native';
import Animated, {
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Absolutely-positioned offline banner — does not shift layout.
 * Shows when the device loses connectivity; auto-dismisses when reconnected.
 */
export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const offline = !isConnected || !isInternetReachable;

  if (!offline) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(16).mass(0.8)}
      exiting={SlideOutUp.duration(220)}
      style={{ top: insets.top + 4 }}
      className="absolute left-0 right-0 z-50 px-4"
      accessibilityRole="alert"
      accessibilityLabel="You are offline"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <View className="flex-row items-center justify-center rounded-xl bg-warning-500 shadow-md px-4 py-2.5">
        <Ionicons name="cloud-offline-outline" size={17} color="white" />
        <Text className="text-white text-sm font-medium ml-2 text-center flex-1">
          You&apos;re offline — showing cached content
        </Text>
      </View>
    </Animated.View>
  );
}
