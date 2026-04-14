import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from '@/lib/storage/secureStorage';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
}

function mapAuthenticationType(
  types: LocalAuthentication.AuthenticationType[],
): BiometricType {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'none';
}

export async function isBiometricAvailable(): Promise<BiometricStatus> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return { isAvailable: false, isEnrolled: false, biometricType: 'none' };
  }

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  return {
    isAvailable: true,
    isEnrolled,
    biometricType: mapAuthenticationType(types),
  };
}

export async function enrollBiometric(
  email: string,
  password: string,
): Promise<boolean> {
  const status = await isBiometricAvailable();
  if (!status.isAvailable || !status.isEnrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to enable biometric login',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  if (!result.success) return false;

  await secureStorage.setBiometricCredentials({ email, password });
  return true;
}

export async function authenticateWithBiometric(): Promise<{
  email: string;
  password: string;
} | null> {
  const status = await isBiometricAvailable();
  if (!status.isAvailable || !status.isEnrolled) return null;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Log in with biometrics',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  if (!result.success) return null;

  return await secureStorage.getBiometricCredentials();
}

export async function removeBiometricCredentials(): Promise<void> {
  await secureStorage.removeBiometricCredentials();
}
