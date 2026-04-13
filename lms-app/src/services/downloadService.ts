import { Directory, File, Paths } from 'expo-file-system';
import { appStorage } from '@/lib/storage/appStorage';
import type { DownloadState } from '@/types';

type ProgressCallback = (progress: number) => void;

type ActiveDownload = {
  controller: AbortController;
  file: File;
};

const activeDownloads = new Map<string, ActiveDownload>();

function ensureDownloadsDirectory(): Directory {
  const directory = new Directory(Paths.document, 'lms_downloads');
  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }
  return directory;
}

function localFile(filename: string): File {
  return new File(ensureDownloadsDirectory(), filename);
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

  const destFile = localFile(filename);
  const controller = new AbortController();

  if (destFile.exists) {
    destFile.delete();
  }
  destFile.create({ intermediates: true, overwrite: true });

  activeDownloads.set(filename, { controller, file: destFile });

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const totalBytesExpected = Number(response.headers.get('content-length') ?? '0');
    const responseBody = response.body;

    if (responseBody && typeof responseBody.getReader === 'function') {
      const reader = responseBody.getReader();
      const writer = destFile.writableStream().getWriter();
      let totalBytesWritten = 0;
      let done = false;

      try {
        while (!done) {
          const chunk = await reader.read();
          done = chunk.done;
          const value = chunk.value;
          if (!value) continue;

          totalBytesWritten += value.byteLength;
          await writer.write(value);

          const pct =
            totalBytesExpected > 0 ? Math.round((totalBytesWritten / totalBytesExpected) * 100) : 0;
          onProgress?.(pct);
        }
      } finally {
        reader.releaseLock?.();
        await writer.close();
      }
    } else {
      const fileBytes = new Uint8Array(await response.arrayBuffer());
      destFile.write(fileBytes);
    }

    appStorage.setDownloadState(filename, {
      status: 'completed',
      path: destFile.uri,
      size: destFile.size || (totalBytesExpected > 0 ? totalBytesExpected : undefined),
    });
    onProgress?.(100);
    return destFile.uri;
  } catch (err) {
    if (destFile.exists) {
      destFile.delete();
    }
    if (err instanceof Error && err.name === 'AbortError') {
      appStorage.removeDownloadState(filename);
      throw new Error('Download canceled');
    }
    appStorage.setDownloadState(filename, { status: 'error' });
    throw err;
  } finally {
    activeDownloads.delete(filename);
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
    active.controller.abort();
    activeDownloads.delete(filename);
    if (active.file.exists) {
      active.file.delete();
    }
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
