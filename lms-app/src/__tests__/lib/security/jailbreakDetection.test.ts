import { Platform } from 'react-native';
import { Paths } from 'expo-file-system';
import { detectJailbreak } from '@/lib/security/jailbreakDetection';

jest.mock('expo-file-system', () => ({
  Paths: {
    info: jest.fn(),
  },
}));

const mockInfo = Paths.info as jest.MockedFunction<typeof Paths.info>;
const originalPlatform = Platform.OS;

function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
}

describe('detectJailbreak', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    setPlatform(originalPlatform as 'ios' | 'android');
  });

  it('returns safe when no indicators exist', async () => {
    setPlatform('android');
    mockInfo.mockReturnValue({ exists: false, isDirectory: null });

    await expect(detectJailbreak()).resolves.toEqual({
      riskLevel: 'safe',
      indicators: [],
    });
  });

  it('falls back to file URI probing and marks compromised when several indicators are found', async () => {
    setPlatform('ios');
    mockInfo.mockImplementation((candidate: string) => {
      if (!candidate.startsWith('file://')) {
        throw new Error('invalid path');
      }

      const exists = [
        'file:///Applications/Cydia.app',
        'file:///bin/bash',
        'file:///usr/bin/ssh',
      ].includes(candidate);

      return { exists, isDirectory: false };
    });

    const result = await detectJailbreak();

    expect(result.riskLevel).toBe('compromised');
    expect(result.indicators).toHaveLength(3);
    expect(mockInfo).toHaveBeenCalledWith('file:///Applications/Cydia.app');
  });
});
