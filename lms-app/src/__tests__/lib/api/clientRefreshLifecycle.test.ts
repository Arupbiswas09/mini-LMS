import { refreshAccessTokenWithDeps } from '@/lib/api/refreshLifecycle';

describe('refreshAccessTokenWithDeps', () => {
  it('refreshes successfully when refresh token exists', async () => {
    const deps = {
      getRefreshToken: jest.fn(async () => 'refresh-token'),
      setToken: jest.fn(async () => {}),
      setRefreshToken: jest.fn(async () => {}),
      clearAll: jest.fn(async () => {}),
      requestRefresh: jest.fn(async () => ({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      })),
      onAuthFailure: jest.fn(),
    };

    const token = await refreshAccessTokenWithDeps(deps);

    expect(token).toBe('new-access');
    expect(deps.requestRefresh).toHaveBeenCalledWith('refresh-token');
    expect(deps.setToken).toHaveBeenCalledWith('new-access');
    expect(deps.setRefreshToken).toHaveBeenCalledWith('new-refresh');
    expect(deps.clearAll).not.toHaveBeenCalled();
    expect(deps.onAuthFailure).not.toHaveBeenCalled();
  });

  it('clears session and triggers fallback when refresh token is missing', async () => {
    const deps = {
      getRefreshToken: jest.fn(async () => null),
      setToken: jest.fn(async () => {}),
      setRefreshToken: jest.fn(async () => {}),
      clearAll: jest.fn(async () => {}),
      requestRefresh: jest.fn(async () => ({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      })),
      onAuthFailure: jest.fn(),
    };

    const token = await refreshAccessTokenWithDeps(deps);

    expect(token).toBeNull();
    expect(deps.requestRefresh).not.toHaveBeenCalled();
    expect(deps.clearAll).toHaveBeenCalledTimes(1);
    expect(deps.onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it('clears session and triggers fallback when refresh request fails', async () => {
    const deps = {
      getRefreshToken: jest.fn(async () => 'refresh-token'),
      setToken: jest.fn(async () => {}),
      setRefreshToken: jest.fn(async () => {}),
      clearAll: jest.fn(async () => {}),
      requestRefresh: jest.fn(async () => {
        throw new Error('refresh failed');
      }),
      onAuthFailure: jest.fn(),
    };

    const token = await refreshAccessTokenWithDeps(deps);

    expect(token).toBeNull();
    expect(deps.requestRefresh).toHaveBeenCalledTimes(1);
    expect(deps.clearAll).toHaveBeenCalledTimes(1);
    expect(deps.onAuthFailure).toHaveBeenCalledTimes(1);
  });
});
