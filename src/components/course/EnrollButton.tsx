import { useState, useCallback, memo, useEffect } from 'react';
import { ActivityIndicator, Text, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface EnrollButtonProps {
  isEnrolled: boolean;
  onEnroll: () => void;
}

function EnrollButtonComponent({ isEnrolled, onEnroll }: EnrollButtonProps) {
  const [busy, setBusy] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isEnrolled) {
      scale.value = withSpring(1, { damping: 12 });
    }
  }, [isEnrolled, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(async () => {
    if (isEnrolled || busy) return;
    setBusy(true);
    scale.value = withSequence(withSpring(0.94, { damping: 14 }), withSpring(1, { damping: 12 }));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEnroll();
    setBusy(false);
  }, [isEnrolled, busy, onEnroll, scale]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={isEnrolled || busy}
      style={animatedStyle}
      className={`flex-1 py-3.5 rounded-xl flex-row items-center justify-center ${
        isEnrolled ? 'bg-secondary-600' : 'bg-primary-600'
      }`}
      accessibilityRole="button"
      accessibilityLabel={isEnrolled ? 'Enrolled' : 'Enroll now'}
      accessibilityState={{ disabled: isEnrolled || busy }}
    >
      {busy ? (
        <ActivityIndicator color="white" />
      ) : (
        <View className="flex-row items-center">
          <Ionicons
            name={isEnrolled ? 'checkmark-circle' : 'school-outline'}
            size={20}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text className="text-white font-semibold text-base">
            {isEnrolled ? 'Enrolled ✓' : 'Enroll now'}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

export const EnrollButton = memo(EnrollButtonComponent);
