import React, { useCallback } from 'react';
import { View, Pressable, Text, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 120) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible) return null;

  // Reset position when opened
  translateY.value = 0;

  return (
    <View className="absolute inset-0 z-50">
      {/* Backdrop */}
      <Pressable
        onPress={handleBackdropPress}
        className="absolute inset-0 bg-black/50"
        accessibilityLabel="Close modal"
      />

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={sheetStyle}
          className="absolute bottom-0 left-0 right-0 max-h-[80%] rounded-t-3xl bg-white pb-8 dark:bg-neutral-800"
        >
          {/* Handle */}
          <View className="items-center py-3">
            <View className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />
          </View>

          {title && (
            <Text className="mb-4 px-6 text-lg font-bold text-neutral-900 dark:text-white">
              {title}
            </Text>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="px-6"
          >
            {children}
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
