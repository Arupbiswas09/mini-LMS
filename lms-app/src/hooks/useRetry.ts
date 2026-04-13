import { useCallback, useRef, useState } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  baseDelay?: number;
}

interface UseRetryResult<T> {
  execute: () => Promise<T | undefined>;
  isRetrying: boolean;
  retryCount: number;
  error: Error | null;
  reset: () => void;
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {},
): UseRetryResult<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef(false);

  const execute = useCallback(async (): Promise<T | undefined> => {
    abortRef.current = false;
    setIsRetrying(true);
    setError(null);
    setRetryCount(0);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (abortRef.current) break;

      try {
        const result = await fn();
        setIsRetrying(false);
        setRetryCount(attempt);
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));

        if (attempt === maxRetries) {
          setError(e);
          setIsRetrying(false);
          setRetryCount(attempt);
          return undefined;
        }

        setRetryCount(attempt + 1);
        // Exponential backoff: 1s, 2s, 4s…
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    }

    setIsRetrying(false);
    return undefined;
  }, [fn, maxRetries, baseDelay]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setIsRetrying(false);
    setRetryCount(0);
    setError(null);
  }, []);

  return { execute, isRetrying, retryCount, error, reset };
}
