export interface RefreshLifecycleDeps {
  getRefreshToken: () => Promise<string | null>;
  setToken: (token: string) => Promise<void>;
  setRefreshToken: (token: string) => Promise<void>;
  clearAll: () => Promise<void>;
  requestRefresh: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>;
  onAuthFailure?: () => void;
}

export async function refreshAccessTokenWithDeps(
  deps: RefreshLifecycleDeps,
): Promise<string | null> {
  try {
    const refreshToken = await deps.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const next = await deps.requestRefresh(refreshToken);
    await deps.setToken(next.accessToken);
    await deps.setRefreshToken(next.refreshToken);
    return next.accessToken;
  } catch {
    await deps.clearAll();
    deps.onAuthFailure?.();
    return null;
  }
}
