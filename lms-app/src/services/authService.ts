import { get, post, patch } from '@/lib/api/client';
import { secureStorage } from '@/lib/storage/secureStorage';
import { queryClient } from '@/lib/queryClient';
import type { ApiResponse, AuthTokens, LoginCredentials, RegisterCredentials, User } from '@/types';

type UserLike = User | { user?: User } | { data?: User | { user?: User } } | null | undefined;

function extractUser(payload: UserLike): User {
  const direct = payload as User | undefined;
  if (direct && typeof direct === 'object' && '_id' in direct) {
    return direct;
  }

  const nestedUser = (payload as { user?: User } | undefined)?.user;
  if (nestedUser && typeof nestedUser === 'object' && '_id' in nestedUser) {
    return nestedUser;
  }

  const dataNode = (payload as { data?: User | { user?: User } } | undefined)?.data;
  if (dataNode && typeof dataNode === 'object' && '_id' in dataNode) {
    return dataNode;
  }

  const dataUser = (dataNode as { user?: User } | undefined)?.user;
  if (dataUser && typeof dataUser === 'object' && '_id' in dataUser) {
    return dataUser;
  }

  throw new Error('Invalid user response shape');
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponse {
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await post<ApiResponse<LoginResponse>>('/api/v1/users/login', credentials);
    const { user, accessToken, refreshToken } = response.data;

    await secureStorage.setToken(accessToken);
    await secureStorage.setRefreshToken(refreshToken);

    return user;
  },

  async register(credentials: Omit<RegisterCredentials, 'confirmPassword'>): Promise<User> {
    const response = await post<ApiResponse<RegisterResponse>>('/api/v1/users/register', credentials);
    return response.data.user;
  },

  async logout(): Promise<void> {
    try {
      await post('/api/v1/users/logout');
    } catch {
      // proceed with local cleanup even if API call fails
    } finally {
      await secureStorage.clearAll();
      queryClient.clear();
    }
  },

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = await secureStorage.getRefreshToken();
    const response = await post<ApiResponse<AuthTokens>>('/api/v1/users/refresh-token', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    await secureStorage.setToken(accessToken);
    await secureStorage.setRefreshToken(newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  },

  async getMe(): Promise<User> {
    const response = await get<ApiResponse<{ user: User }> | User | { user: User }>('/api/v1/users/current-user');
    return extractUser(response as UserLike);
  },

  async updateProfile(data: { username?: string }): Promise<User> {
    const response = await patch<ApiResponse<{ user: User }> | User | { user: User }>(
      '/api/v1/users/update-account',
      data
    );
    return extractUser(response as UserLike);
  },

  async updateAvatar(uri: string): Promise<User> {
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'avatar.jpg';
    const ext = filename.split('.').pop() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    formData.append('avatar', {
      uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const response = await patch<ApiResponse<{ user: User }> | User | { user: User }>(
      '/api/v1/users/avatar',
      formData
    );
    return extractUser(response as UserLike);
  },
} as const;
