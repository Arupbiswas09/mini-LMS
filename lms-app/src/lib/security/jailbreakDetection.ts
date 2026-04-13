import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export type SecurityRiskLevel = 'safe' | 'suspicious' | 'compromised';

interface JailbreakResult {
  riskLevel: SecurityRiskLevel;
  indicators: string[];
}

const ANDROID_SU_PATHS = [
  '/system/app/Superuser.apk',
  '/sbin/su',
  '/system/bin/su',
  '/system/xbin/su',
  '/data/local/xbin/su',
  '/data/local/bin/su',
  '/system/sd/xbin/su',
  '/system/bin/failsafe/su',
  '/data/local/su',
] as const;

const IOS_JAILBREAK_PATHS = [
  '/Applications/Cydia.app',
  '/Library/MobileSubstrate/MobileSubstrate.dylib',
  '/bin/bash',
  '/usr/sbin/sshd',
  '/etc/apt',
  '/private/var/lib/apt/',
  '/usr/bin/ssh',
] as const;

async function checkPathExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

async function checkAndroidIndicators(): Promise<string[]> {
  const indicators: string[] = [];

  for (const path of ANDROID_SU_PATHS) {
    if (await checkPathExists(path)) {
      indicators.push(`Found su binary at ${path}`);
    }
  }

  return indicators;
}

async function checkIOSIndicators(): Promise<string[]> {
  const indicators: string[] = [];

  for (const path of IOS_JAILBREAK_PATHS) {
    if (await checkPathExists(path)) {
      indicators.push(`Found jailbreak indicator at ${path}`);
    }
  }

  return indicators;
}

export async function detectJailbreak(): Promise<JailbreakResult> {
  const indicators: string[] = [];

  if (Platform.OS === 'android') {
    indicators.push(...(await checkAndroidIndicators()));
  } else if (Platform.OS === 'ios') {
    indicators.push(...(await checkIOSIndicators()));
  }

  let riskLevel: SecurityRiskLevel;
  if (indicators.length === 0) {
    riskLevel = 'safe';
  } else if (indicators.length <= 2) {
    riskLevel = 'suspicious';
  } else {
    riskLevel = 'compromised';
  }

  return { riskLevel, indicators };
}
