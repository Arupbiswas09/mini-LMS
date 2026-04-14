import apiClient, { get, post, patch } from '@/lib/api/client';
import { secureStorage } from '@/lib/storage/secureStorage';
import { queryClient } from '@/lib/queryClient';
import type { ApiResponse, AuthTokens, LoginCredentials, RegisterCredentials, User } from '@/types';

type UserLike = User | { user?: User } | { data?: User | { user?: User } } | null | undefined;

type UserApiShape = (User & { avatar?: User['avatar'] | string }) & { avatarUrl?: string };

function normalizeUser(user: UserApiShape): User {
  // Backend responses vary: `avatar` may be `{ url }`, a string URL, or `avatarUrl`.
  const avatarUrl =
    typeof user.avatar === 'string'
      ? user.avatar
      : typeof user.avatar?.url === 'string'
        ? user.avatar.url
        : typeof user.avatarUrl === 'string'
          ? user.avatarUrl
          : undefined;

  const avatar =
    avatarUrl && avatarUrl.trim().length > 0
      ? { ...(typeof user.avatar === 'object' && user.avatar ? user.avatar : {}), url: avatarUrl.trim() }
      : undefined;

  return { ...user, avatar } satisfies User;
}

function extractUser(payload: UserLike): User {
  const direct = payload as UserApiShape | undefined;
  if (direct && typeof direct === 'object' && '_id' in direct) {
    return normalizeUser(direct);
  }

  const nestedUser = (payload as { user?: UserApiShape } | undefined)?.user;
  if (nestedUser && typeof nestedUser === 'object' && '_id' in nestedUser) {
    return normalizeUser(nestedUser);
  }

  const dataNode = (payload as { data?: UserApiShape | { user?: UserApiShape } } | undefined)?.data;
  if (dataNode && typeof dataNode === 'object' && '_id' in dataNode) {
    return normalizeUser(dataNode);
  }

  const dataUser = (dataNode as { user?: UserApiShape } | undefined)?.user;
  if (dataUser && typeof dataUser === 'object' && '_id' in dataUser) {
    return normalizeUser(dataUser);
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

    // Must override JSON default headers for multipart uploads.
    const response = await apiClient.patch<ApiResponse<{ user: User }> | User | { user: User }>(
      '/api/v1/users/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return extractUser(response.data as UserLike);
  },
} as const;
