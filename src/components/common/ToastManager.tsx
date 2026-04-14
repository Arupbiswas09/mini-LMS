import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, Pressable, AccessibilityInfo, View as RNView } from 'react-native';
import Animated, {
  SlideInUp,
  SlideOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

type ShowToastFn = (type: ToastType, message: string, duration?: number) => void;

// ─── Singleton ref so any module can call showToast ────────────────────────

let _showToast: ShowToastFn | null = null;

export function showToast(type: ToastType, message: string, duration?: number): void {
  _showToast?.(type, message, duration);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const BG_COLOR: Record<ToastType, string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warning: 'bg-yellow-500',
  info: 'bg-blue-600',
};

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
};

let nextId = 0;

// ─── Component ──────────────────────────────────────────────────────────────

export function ToastManager() {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show: ShowToastFn = useCallback(
    (type, message, duration) => {
      const id = String(++nextId);
      const ms = duration ?? DEFAULT_DURATION[type];
      const toast: Toast = { id, type, message, duration: ms };

      setToasts((prev) => [...prev.slice(-4), toast]); // max 5 toasts

      const timer = setTimeout(() => remove(id), ms);
      timers.current.set(id, timer);

      // Announce for accessibility
      AccessibilityInfo.announceForAccessibility(message);
    },
    [remove],
  );

  // Register singleton
  useEffect(() => {
    _showToast = show;
    const currentTimers = timers.current;
    return () => {
      _showToast = null;
      currentTimers.forEach((t) => clearTimeout(t));
    };
  }, [show]);

  if (toasts.length === 0) return null;

  return (
    <RNView
      style={{ top: insets.top + 8 }}
      className="absolute left-4 right-4 z-50"
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
    >
      {toasts.map((toast) => (
        <Animated.View
          key={toast.id}
          entering={SlideInUp.duration(250).withInitialValues({ transform: [{ translateY: -60 }] })}
          exiting={SlideOutUp.duration(200)}
          layout={LinearTransition.springify()}
        >
          <Pressable
            onPress={() => remove(toast.id)}
            className={`mb-2 flex-row items-center rounded-xl px-4 py-3 shadow-lg ${BG_COLOR[toast.type]}`}
            accessibilityRole="alert"
          >
            <Text className="mr-2 text-base font-bold text-white">
              {ICONS[toast.type]}
            </Text>
            <Text className="flex-1 text-sm font-medium text-white" numberOfLines={2}>
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      ))}
    </RNView>
  );
}
