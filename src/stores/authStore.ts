import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { secureStorage } from '@/lib/storage/secureStorage';
import { appStorage } from '@/lib/storage/appStorage';
import { detectJailbreak } from '@/lib/security/jailbreakDetection';
import { analyticsService } from '@/services/analyticsService';
import { showToast } from '@/components/common/ToastManager';
import { getUserFriendlyMessage } from '@/lib/api/errorHandler';
import type { ApiError } from '@/types';
import type { LoginCredentials, RegisterCredentials, User } from '@/types';

function errorMessage(err: unknown): string {
  if (err !== null && typeof err === 'object' && 'userFriendlyMessage' in err) {
    return getUserFriendlyMessage(err as ApiError);
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoringSession: boolean;
  error: string | null;
  securityNotice: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  setError: (msg: string) => void;
  clearError: () => void;
  clearSecurityNotice: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    immer((set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isRestoringSession: true,
      error: null,
      securityNotice: null,

      clearSecurityNotice: () => {
        set((state) => {
          state.securityNotice = null;
        });
      },

      login: async (credentials) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          const security = await detectJailbreak();
          if (security.riskLevel !== 'safe') {
            const notice =
              security.riskLevel === 'compromised'
                ? 'Device security risk detected. Biometric sign-in has been disabled.'
                : 'Device appears modified. Please use caution with sensitive actions.';
            set((state) => {
              state.securityNotice = notice;
            });
            showToast('warning', notice, 4500);

            if (security.riskLevel === 'compromised') {
              appStorage.setPreferences({ biometricEnabled: false });
              await secureStorage.removeBiometricCredentials();
            }
          }

          const user = await authService.login(credentials);
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });

          await analyticsService.track('auth_login_success', {
            userId: user._id,
            email: user.email,
          });

          const prefs = appStorage.getPreferences();
          if (prefs.biometricEnabled) {
            await secureStorage.setBiometricCredentials({
              email: credentials.email,
              password: credentials.password,
            });
          }
        } catch (err) {
          const message = errorMessage(err);
          set((state) => {
            state.error = message;
            state.isLoading = false;
          });
          throw err;
        }
      },

      register: async (credentials) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });
        try {
          await authService.register({
            username: credentials.username,
            email: credentials.email,
            password: credentials.password,
          });
          const user = await authService.login({
            email: credentials.email,
            password: credentials.password,
          });
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
          const prefs = appStorage.getPreferences();
          if (prefs.biometricEnabled) {
            await secureStorage.setBiometricCredentials({
              email: credentials.email,
              password: credentials.password,
            });
          }

          await analyticsService.track('auth_register_success', {
            userId: user._id,
            email: user.email,
          });
        } catch (err) {
          const message = errorMessage(err);
          set((state) => {
            state.error = message;
            state.isLoading = false;
          });
          throw err;
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });
        try {
          await analyticsService.track('auth_logout');
          await authService.logout();
        } finally {
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
          });
        }
      },

      restoreSession: async () => {
        set((state) => {
          state.isRestoringSession = true;
        });
        try {
          const security = await detectJailbreak();
          if (security.riskLevel !== 'safe') {
            const notice =
              security.riskLevel === 'compromised'
                ? 'Device security risk detected. Biometric sign-in has been disabled.'
                : 'Device appears modified. Please use caution with sensitive actions.';
            set((state) => {
              state.securityNotice = notice;
            });

            if (security.riskLevel === 'compromised') {
              appStorage.setPreferences({ biometricEnabled: false });
              await secureStorage.removeBiometricCredentials();
            }
          }

          const token = await secureStorage.getToken();
          if (!token) {
            set((state) => {
              state.isRestoringSession = false;
            });
            return;
          }
          const user = await authService.getMe();
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isRestoringSession = false;
          });
        } catch {
          await secureStorage.clearAll();
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isRestoringSession = false;
          });
        }
      },

      refreshUser: async () => {
        const token = await secureStorage.getToken();
        if (!token) return;
        try {
          const user = await authService.getMe();
          set((state) => {
            state.user = user;
          });
        } catch {
          // keep existing user on transient failure
        }
      },

      updateUser: (partial) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, partial);
          }
        });
      },

      setError: (msg) => {
        set((state) => {
          state.error = msg;
        });
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    { name: 'auth-store', enabled: __DEV__ }
  )
);
