import { normalizeError } from '@/lib/api/errorHandler';

function makeAxiosError(status: number, message: string, headers: Record<string, string> = {}) {
  return {
    response: {
      status,
      data: { message },
      headers,
    },
    message,
  };
}

function makeNetworkError() {
  return { message: 'Network Error' }; // no .response
}

describe('normalizeError', () => {
  it('maps network error (no response)', () => {
    const err = normalizeError(makeNetworkError());
    expect(err.type).toBe('network');
    expect(err.userFriendlyMessage).toContain('offline');
  });

  it('maps 400 to validation type', () => {
    const err = normalizeError(makeAxiosError(400, 'Invalid input'));
    expect(err.type).toBe('validation');
    expect(err.statusCode).toBe(400);
  });

  it('maps 401 to auth type', () => {
    const err = normalizeError(makeAxiosError(401, 'Unauthorized'));
    expect(err.type).toBe('auth');
    expect(err.statusCode).toBe(401);
    expect(err.userFriendlyMessage).toContain('session');
  });

  it('maps 403 to permission type', () => {
    const err = normalizeError(makeAxiosError(403, 'Forbidden'));
    expect(err.type).toBe('permission');
  });

  it('maps 404 to not_found type', () => {
    const err = normalizeError(makeAxiosError(404, 'Not found'));
    expect(err.type).toBe('not_found');
  });

  it('maps 429 to rate_limit with retryAfter', () => {
    const err = normalizeError(makeAxiosError(429, 'Too many requests', { 'retry-after': '30' }));
    expect(err.type).toBe('rate_limit');
    expect(err.retryAfter).toBe(30);
  });

  it('maps 500 to server type', () => {
    const err = normalizeError(makeAxiosError(500, 'Internal server error'));
    expect(err.type).toBe('server');
    expect(err.statusCode).toBe(500);
  });

  it('maps 503 as server type', () => {
    const err = normalizeError(makeAxiosError(503, 'Service unavailable'));
    expect(err.type).toBe('server');
  });

  it('all errors have a userFriendlyMessage with no tech jargon', () => {
    const types = [400, 401, 403, 404, 429, 500];
    types.forEach((status) => {
      const err = normalizeError(makeAxiosError(status, 'error'));
      expect(err.userFriendlyMessage).toBeTruthy();
      expect(err.userFriendlyMessage).not.toContain('axios');
      expect(err.userFriendlyMessage).not.toContain('HTTP');
    });
  });
});
