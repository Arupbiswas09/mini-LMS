import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { secureStorage } from '@/lib/storage/secureStorage';
import { appStorage } from '@/lib/storage/appStorage';
import { detectJailbreak } from '@/lib/security/jailbreakDetection';
import { analyticsService } from '@/services/analyticsService';
import { showToast } from '@/components/common/ToastManager';
import type { User } from '@/types';

// Mock the Axios client so no real HTTP calls are made and no fetch adapter errors occur
jest.mock('@/lib/api/client', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}));

// Mock all side-effect dependencies
jest.mock('@/services/authService');
jest.mock('@/lib/storage/secureStorage', () => ({
  secureStorage: {
    setToken: jest.fn(),
    getToken: jest.fn(() => Promise.resolve(null)),
    setRefreshToken: jest.fn(),
    getRefreshToken: jest.fn(() => Promise.resolve(null)),
    clearAll: jest.fn(),
    setBiometricCredentials: jest.fn(),
    getBiometricCredentials: jest.fn(() => Promise.resolve(null)),
    clearBiometricCredentials: jest.fn(),
    removeBiometricCredentials: jest.fn(),
  },
}));
jest.mock('@/lib/storage/appStorage', () => ({
  appStorage: {
    getPreferences: jest.fn(() => ({ biometricEnabled: false })),
    setPreferences: jest.fn(),
    getBookmarks: jest.fn(() => new Set()),
    getEnrolledCourses: jest.fn(() => new Set()),
    setBookmarks: jest.fn(),
    setEnrolledCourses: jest.fn(),
    clear: jest.fn(),
  },
}));
jest.mock('@/lib/security/jailbreakDetection', () => ({
  detectJailbreak: jest.fn(async () => ({ riskLevel: 'safe', indicators: [] })),
}));
jest.mock('@/services/analyticsService', () => ({
  analyticsService: {
    track: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock('@/components/common/ToastManager', () => ({
  showToast: jest.fn(),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;
const mockAppStorage = appStorage as jest.Mocked<typeof appStorage>;
const mockDetectJailbreak = detectJailbreak as jest.MockedFunction<typeof detectJailbreak>;
const mockAnalytics = analyticsService as jest.Mocked<typeof analyticsService>;
const mockShowToast = showToast as jest.MockedFunction<typeof showToast>;

const fakeUser: User = {
  _id: 'user-1',
  username: 'johndoe',
  email: 'john@example.com',
  role: 'USER',
  isEmailVerified: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    // Fully reset Zustand store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isRestoringSession: true,
      error: null,
      securityNotice: null,
    });
    jest.clearAllMocks();
    mockDetectJailbreak.mockResolvedValue({ riskLevel: 'safe', indicators: [] });
  });

  describe('login', () => {
    it('sets user and isAuthenticated on success', async () => {
      mockAuthService.login.mockResolvedValueOnce(fakeUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'john@example.com', password: 'pass' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('john@example.com');
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error message on failure', async () => {
      const apiError = {
        type: 'auth',
        statusCode: 401,
        message: 'Invalid credentials',
        userFriendlyMessage: 'Your session has expired.',
      };
      mockAuthService.login.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login({ email: 'bad@example.com', password: 'wrong' });
        } catch {
          // expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    it('resets isLoading to false whether or not it succeeds', async () => {
      mockAuthService.login.mockRejectedValueOnce(new Error('Network Error'));

      const { result } = renderHook(() => useAuthStore());
      await act(async () => {
        try { await result.current.login({ email: 'e@e.com', password: 'p' }); } catch {}
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('disables biometric login on compromised devices', async () => {
      mockDetectJailbreak.mockResolvedValueOnce({
        riskLevel: 'compromised',
        indicators: ['root-1', 'root-2', 'root-3'],
      });
      mockAuthService.login.mockResolvedValueOnce(fakeUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'john@example.com', password: 'pass' });
      });

      expect(result.current.securityNotice).toContain('Biometric sign-in has been disabled');
      expect(mockAppStorage.setPreferences).toHaveBeenCalledWith({ biometricEnabled: false });
      expect(mockSecureStorage.removeBiometricCredentials).toHaveBeenCalledTimes(1);
      expect(mockShowToast).toHaveBeenCalledWith('warning', expect.stringContaining('disabled'), 4500);
    });
  });

  describe('register', () => {
    it('registers, logs in, and tracks analytics', async () => {
      mockAuthService.register.mockResolvedValueOnce(fakeUser);
      mockAuthService.login.mockResolvedValueOnce(fakeUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          username: 'johndoe',
          email: 'john@example.com',
          password: 'pass',
          confirmPassword: 'pass',
        });
      });

      expect(mockAuthService.register).toHaveBeenCalledWith({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'pass',
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockAnalytics.track).toHaveBeenCalledWith('auth_register_success', expect.objectContaining({ userId: 'user-1' }));
    });
  });

  describe('logout', () => {
    it('clears user and isAuthenticated', async () => {
      mockAuthService.login.mockResolvedValueOnce(fakeUser);
      mockAuthService.logout.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'john@example.com', password: 'pass' });
      });
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('restoreSession', () => {
    it('stops restoring when no token exists', async () => {
      mockSecureStorage.getToken.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.restoreSession();
      });

      expect(result.current.isRestoringSession).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('restores user when token exists', async () => {
      mockSecureStorage.getToken.mockResolvedValueOnce('token');
      mockAuthService.getMe.mockResolvedValueOnce(fakeUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.restoreSession();
      });

      expect(result.current.isRestoringSession).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?._id).toBe('user-1');
    });

    it('clears auth when restore fails', async () => {
      mockSecureStorage.getToken.mockResolvedValueOnce('token');
      mockAuthService.getMe.mockRejectedValueOnce(new Error('boom'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.restoreSession();
      });

      expect(mockSecureStorage.clearAll).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('refreshUser', () => {
    it('refreshes user when token exists', async () => {
      mockSecureStorage.getToken.mockResolvedValueOnce('token');
      mockAuthService.getMe.mockResolvedValueOnce({ ...fakeUser, username: 'updated' });

      const { result } = renderHook(() => useAuthStore());
      act(() => {
        useAuthStore.setState({ user: fakeUser, isAuthenticated: true });
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user?.username).toBe('updated');
    });

    it('does nothing when token is missing', async () => {
      mockSecureStorage.getToken.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockAuthService.getMe).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('merges partial user data', async () => {
      mockAuthService.login.mockResolvedValueOnce(fakeUser);
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({ email: 'john@example.com', password: 'pass' });
      });

      act(() => {
        result.current.updateUser({ username: 'newname' });
      });

      expect(result.current.user?.username).toBe('newname');
      expect(result.current.user?.email).toBe('john@example.com');
    });
  });

  describe('setError / clearError', () => {
    it('sets and clears error', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => { result.current.setError('Something broke'); });
      expect(result.current.error).toBe('Something broke');

      act(() => { result.current.clearError(); });
      expect(result.current.error).toBeNull();
    });

    it('clears security notice', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ securityNotice: 'warning' });
        result.current.clearSecurityNotice();
      });

      expect(result.current.securityNotice).toBeNull();
    });
  });
});
