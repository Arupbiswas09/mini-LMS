import { useState, useCallback, useRef } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { downloadService } from '@/services/downloadService';

export interface UseFileDownloadResult {
  /** 0–100 progress percentage */
  progress: number;
  isDownloading: boolean;
  isCompleted: boolean;
  error: string | null;
  /** Animated style with `width` suitable for a progress bar (apply to a View) */
  progressBarStyle: ReturnType<typeof useAnimatedStyle>;
  /** Kick off the download */
  download: () => Promise<void>;
  /** Cancel is a best-effort operation — clears local state */
  cancel: () => void;
}

export function useFileDownload(url: string, filename: string): UseFileDownloadResult {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    () => downloadService.isDownloaded(filename)
  );
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const animatedProgress = useSharedValue(0);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%` as `${number}%`,
  }));

  const download = useCallback(async () => {
    if (isDownloading || isCompleted) return;
    cancelledRef.current = false;
    setIsDownloading(true);
    setError(null);
    setProgress(0);
    animatedProgress.value = withTiming(0, { duration: 0 });

    try {
      await downloadService.downloadCourseResource(url, filename, (pct) => {
        if (cancelledRef.current) return;
        setProgress(pct);
        animatedProgress.value = withTiming(pct, { duration: 200 });
      });
      if (!cancelledRef.current) {
        setIsCompleted(true);
        animatedProgress.value = withTiming(100, { duration: 200 });
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'Download failed');
      }
    } finally {
      if (!cancelledRef.current) {
        setIsDownloading(false);
      }
    }
  }, [isDownloading, isCompleted, url, filename, animatedProgress]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsDownloading(false);
    setProgress(0);
    animatedProgress.value = withTiming(0, { duration: 200 });
    void downloadService.deleteDownload(filename);
  }, [filename, animatedProgress]);

  return {
    progress,
    isDownloading,
    isCompleted,
    error,
    progressBarStyle,
    download,
    cancel,
  };
}
