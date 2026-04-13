import {
  documentDirectory,
  createDownloadResumable,
  type DownloadResumable,
  type DownloadProgressData,
} from 'expo-file-system/legacy';
import { appStorage } from '@/lib/storage/appStorage';
import type { DownloadState } from '@/types';

type ProgressCallback = (progress: number) => void;

const activeDownloads = new Map<string, DownloadResumable>();

function localUri(filename: string): string {
  const base = documentDirectory ?? '';
  return `${base}lms_downloads/${filename}`;
}

/**
 * Download a remote resource to the device's document directory.
 * Reports progress (0–100) via the optional callback.
 */
async function downloadCourseResource(
  url: string,
  filename: string,
  onProgress?: ProgressCallback
): Promise<string> {
  appStorage.setDownloadState(filename, { status: 'downloading' });

  const destUri = localUri(filename);

  const progressCallback = (data: DownloadProgressData) => {
    const { totalBytesWritten, totalBytesExpectedToWrite } = data;
    const pct =
      totalBytesExpectedToWrite > 0
        ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
        : 0;
    onProgress?.(pct);
  };

  const resumable = createDownloadResumable(url, destUri, {}, progressCallback);
  activeDownloads.set(filename, resumable);

  try {
    const result = await resumable.downloadAsync();
    activeDownloads.delete(filename);

    if (!result || result.status !== 200) {
      throw new Error(`Download failed with status ${result?.status ?? 'unknown'}`);
    }

    appStorage.setDownloadState(filename, {
      status: 'completed',
      path: result.uri,
      size: result.headers['content-length'] ? parseInt(result.headers['content-length'], 10) : undefined,
    });
    onProgress?.(100);
    return result.uri;
  } catch (err) {
    activeDownloads.delete(filename);
    appStorage.setDownloadState(filename, { status: 'error' });
    throw err;
  }
}

/** Returns all download records keyed by filename. */
function getDownloadedFiles(): Record<string, DownloadState> {
  // Build a typed record from the raw MMKV map
  // We expose the raw state as DownloadState-compatible objects
  const result: Record<string, DownloadState> = {};
  // appStorage stores download states per filename but has no "list all" method,
  // so we maintain a separate filename index.
  const raw = appStorage.getDownloadIndex();
  for (const name of raw) {
    const s = appStorage.getDownloadState(name);
    if (s) {
      result[name] = {
        status: s.status as DownloadState['status'],
        progress: s.status === 'completed' ? 100 : 0,
        path: s.path,
        size: s.size,
      };
    }
  }
  return result;
}

/** Cancel an in-progress download and remove stored state. */
async function deleteDownload(filename: string): Promise<void> {
  const active = activeDownloads.get(filename);
  if (active) {
    await active.cancelAsync().catch(() => {});
    activeDownloads.delete(filename);
  }
  appStorage.removeDownloadState(filename);
}

function isDownloaded(filename: string): boolean {
  const state = appStorage.getDownloadState(filename);
  return state?.status === 'completed' && !!state.path;
}

export const downloadService = {
  downloadCourseResource,
  getDownloadedFiles,
  deleteDownload,
  isDownloaded,
} as const;
