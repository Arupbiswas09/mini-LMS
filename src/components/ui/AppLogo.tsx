import { useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';


type AppLogoProps = {
  /** 'splash' = large centered (used in animated splash screen)
   *  'header' = medium (used on auth screens)
   *  'small'  = compact (used in tab bars / nav headers) */
  variant?: 'splash' | 'header' | 'small';
  /** If true, runs the entrance animation on mount */
  animate?: boolean;
  /** If true, runs a continuous gentle pulse after entrance */
  pulse?: boolean;
};

const SIZE = { splash: 120, header: 72, small: 36 } as const;
const FONT = { splash: 28, header: 18, small: 13 } as const;

export function AppLogo({
  variant = 'header',
  animate = true,
  pulse = false,
}: AppLogoProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const size = SIZE[variant];
  const fontSize = FONT[variant];

  // Entrance values
  const opacity = useSharedValue(animate ? 0 : 1);
  const scale = useSharedValue(animate ? 0.6 : 1);
  const translateY = useSharedValue(animate ? 20 : 0);

  // Continuous sparkle rotation for the star decoration
  const starRotate = useSharedValue(0);
  const starScale = useSharedValue(1);

  useEffect(() => {
    if (animate) {
      opacity.value = withDelay(80, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
      scale.value = withDelay(80, withSpring(1, { damping: 14, stiffness: 130 }));
      translateY.value = withDelay(80, withTiming(0, { duration: 420, easing: Easing.out(Easing.quad) }));
    }

    if (pulse) {
      // gentle scale pulse after entrance
      starScale.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(1.18, { duration: 900, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );
      // slow rotation
      starRotate.value = withDelay(
        600,
        withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false)
      );
    }
  }, [animate, pulse, opacity, scale, translateY, starRotate, starScale]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${starRotate.value}deg` },
      { scale: starScale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.wrapper, containerStyle]}>
      {/* Icon */}
      <View style={[styles.iconWrap, { width: size, height: size, borderRadius: size * 0.22 }]}>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          source={require('../../../assets/images/icon.png') as number}
          style={{ width: size, height: size, borderRadius: size * 0.22 }}
          contentFit="cover"
          transition={200}
          accessibilityLabel="Mini LMS icon"
        />
        {/* Sparkle overlay */}
        <Animated.View style={[styles.sparkle, { top: size * 0.06, right: size * 0.06 }, starStyle]}>
          <Text style={[styles.sparkleText, { fontSize: size * 0.16 }]}>✦</Text>
        </Animated.View>
      </View>

      {/* Wordmark */}
      {variant !== 'small' && (
        <View style={styles.wordmark}>
          <Text style={[styles.brand, { fontSize, color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            mini<Text style={styles.brandAccent}>LMS</Text>
          </Text>
          {variant === 'splash' && (
            <Text style={[styles.tagline, { color: isDark ? '#94a3b8' : '#64748b' }]}>Learn anything. Anywhere.</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    overflow: 'hidden',
    // subtle shadow
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleText: {
    color: '#fbbf24',
    fontWeight: '800',
  },
  wordmark: {
    alignItems: 'center',
    gap: 4,
  },
  brand: {
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#2563eb',
  },
  tagline: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748b',
    letterSpacing: 0.3,
  },
});
