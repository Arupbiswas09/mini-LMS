import { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, Text, Platform, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { secureStorage } from '@/lib/storage/secureStorage';

export interface BiometricLoginButtonProps {
  onAuthenticated: (credentials: { email: string; password: string }) => void;
  disabled?: boolean;
}

export function BiometricLoginButton({ onAuthenticated, disabled }: BiometricLoginButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (Platform.OS === 'web') return;
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const creds = await secureStorage.getBiometricCredentials();
      if (!cancelled && hasHardware && enrolled && creds) {
        setVisible(true);
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePress = useCallback(async () => {
    const creds = await secureStorage.getBiometricCredentials();
    if (!creds) {
      Alert.alert('Biometric sign-in', 'No saved credentials. Sign in with your password once first.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to Mini LMS',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      biometricsSecurityLevel: 'strong',
    });
    if (result.success) {
      onAuthenticated(creds);
    }
  }, [onAuthenticated]);

  if (!visible) return null;

  return (
    <TouchableOpacity
      className={`mt-4 flex-row items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 py-3.5 px-4 ${
        disabled ? 'opacity-50' : ''
      }`}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Sign in with biometrics"
      accessibilityHint="Uses Face ID, Touch ID, or fingerprint to sign in with saved credentials"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Ionicons
        name={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print-outline'}
        size={22}
        color="#2563eb"
      />
      <Text className="text-primary-600 font-semibold text-base ml-2">Biometric sign-in</Text>
    </TouchableOpacity>
  );
}
