import { useCallback } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import type { User, RegisterCredentials } from '@/types';
import type { LoginFormValues, RegisterFormValues } from '@/lib/validation/schemas';

export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  handleLoginSubmit: SubmitHandler<LoginFormValues>;
  handleRegisterSubmit: SubmitHandler<RegisterFormValues>;
}

export function useAuth(): UseAuthResult {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);

  const handleLoginSubmit = useCallback<SubmitHandler<LoginFormValues>>(
    async (values) => {
      clearError();
      await login({ email: values.email, password: values.password });
    },
    [login, clearError]
  );

  const handleRegisterSubmit = useCallback<SubmitHandler<RegisterFormValues>>(
    async (values) => {
      clearError();
      await register(values);
    },
    [register, clearError]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    handleLoginSubmit,
    handleRegisterSubmit,
  };
}
