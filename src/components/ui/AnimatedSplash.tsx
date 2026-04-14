import { useEffect } from 'react';
import { StyleSheet, Dimensions, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { AppLogo } from './AppLogo';

const { width, height } = Dimensions.get('window');

type Props = {
  /** Called once the exit animation is complete */
  onFinished: () => void;
};

/**
 * AnimatedSplash
 * Renders a full-screen branded splash overlay.
 * Sequence:
 *   0 ms  → logo fades + scales in  (600 ms)
 *   700 ms → hold with pulse
 *   1500 ms → entire screen fades out (500 ms)
 *   2000 ms → onFinished() fires
 */
export function AnimatedSplash({ onFinished }: Props) {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? '#0f172a' : '#ffffff';
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // After logo entrance + brief hold, fade the whole screen out
    screenOpacity.value = withDelay(
      1500,
      withSequence(
        withTiming(0, {
          duration: 500,
          easing: Easing.out(Easing.quad),
        })
      )
    );

    // Fire callback after the full sequence
    const timer = setTimeout(() => {
      runOnJS(onFinished)();
    }, 2100);

    return () => clearTimeout(timer);
  }, [onFinished, screenOpacity]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle, { backgroundColor: bg }]} pointerEvents="none">
      {/* Radial glow behind the logo */}
      <Animated.View style={styles.glow} />

      <AppLogo variant="splash" animate pulse />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    width,
    height,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#2563eb',
    opacity: 0.07,
    // Not animating the glow separately — kept simple & performant
  },
});
