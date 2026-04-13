import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
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
  },
}));
jest.mock('@/lib/storage/appStorage', () => ({
  appStorage: {
    getPreferences: jest.fn(() => ({ biometricEnabled: false })),
    getBookmarks: jest.fn(() => new Set()),
    getEnrolledCourses: jest.fn(() => new Set()),
    setBookmarks: jest.fn(),
    setEnrolledCourses: jest.fn(),
    clear: jest.fn(),
  },
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

const fakeUser: User = {
  _id: 'user-1',
  username: 'johndoe',
  email: 'john@example.com',
  role: 'user',
  avatar: null,
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
    });
    jest.clearAllMocks();
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
  });
});
