const mockDownloadStates = new Map<string, { status: string; path?: string; size?: number }>();
const mockDirectorySet = new Set<string>();
const mockFileBytes = new Map<string, Uint8Array>();

function mockJoinUri(parts: Array<string | { uri: string }>): string {
  return parts.map((part) => (typeof part === 'string' ? part : part.uri)).join('/');
}

jest.mock('@/lib/storage/appStorage', () => ({
  appStorage: {
    setDownloadState: jest.fn((filename: string, state: { status: string; path?: string; size?: number }) => {
      mockDownloadStates.set(filename, state);
    }),
    getDownloadState: jest.fn((filename: string) => mockDownloadStates.get(filename)),
    getDownloadIndex: jest.fn(() => Array.from(mockDownloadStates.keys())),
    removeDownloadState: jest.fn((filename: string) => {
      mockDownloadStates.delete(filename);
    }),
  },
}));

jest.mock('expo-file-system', () => {
  class MockDirectory {
    uri: string;

    constructor(...uris: Array<string | { uri: string }>) {
      this.uri = mockJoinUri(uris);
    }

    get exists() {
      return mockDirectorySet.has(this.uri);
    }

    create() {
      mockDirectorySet.add(this.uri);
    }
  }

  class MockFile {
    uri: string;

    constructor(...uris: Array<string | { uri: string }>) {
      this.uri = mockJoinUri(uris);
    }

    get exists() {
      return mockFileBytes.has(this.uri);
    }

    get size() {
      return mockFileBytes.get(this.uri)?.byteLength ?? 0;
    }

    create() {
      mockFileBytes.set(this.uri, new Uint8Array());
    }

    delete() {
      mockFileBytes.delete(this.uri);
    }

    writableStream() {
      return {
        getWriter: () => ({
          write: async (chunk: Uint8Array) => {
            const current = mockFileBytes.get(this.uri) ?? new Uint8Array();
            const next = new Uint8Array(current.byteLength + chunk.byteLength);
            next.set(current, 0);
            next.set(chunk, current.byteLength);
            mockFileBytes.set(this.uri, next);
          },
          close: async () => {},
        }),
      };
    }

    write(chunk: Uint8Array) {
      mockFileBytes.set(this.uri, chunk);
    }
  }

  return {
    Paths: {
      document: 'file:///docs',
    },
    Directory: MockDirectory,
    File: MockFile,
  };
});

import { downloadService } from '@/services/downloadService';

function makeReader(chunks: Uint8Array[]) {
  let index = 0;
  return {
    read: jest.fn(async () => {
      if (index >= chunks.length) return { done: true, value: undefined };
      const value = chunks[index];
      index += 1;
      return { done: false, value };
    }),
    releaseLock: jest.fn(),
  };
}

describe('downloadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDownloadStates.clear();
    mockDirectorySet.clear();
    mockFileBytes.clear();
  });

  it('downloads via streams, reports progress, and stores completion state', async () => {
    const progress: number[] = [];
    const reader = makeReader([new Uint8Array([1, 2]), new Uint8Array([3, 4])]);

    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: (name: string) => (name === 'content-length' ? '4' : null) },
      body: { getReader: () => reader },
    })) as jest.Mock;

    const uri = await downloadService.downloadCourseResource('https://example.com/file.bin', 'file.bin', (pct) => {
      progress.push(pct);
    });

    expect(uri).toBe('file:///docs/lms_downloads/file.bin');
    expect(progress).toEqual([50, 100, 100]);
    expect(downloadService.isDownloaded('file.bin')).toBe(true);
    expect(downloadService.getDownloadedFiles()).toMatchObject({
      'file.bin': {
        status: 'completed',
        progress: 100,
        path: 'file:///docs/lms_downloads/file.bin',
        size: 4,
      },
    });
  });

  it('cancels an active download and clears stored state', async () => {
    global.fetch = jest.fn(
      (_url: string, init?: RequestInit) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        })
    ) as jest.Mock;

    const promise = downloadService.downloadCourseResource('https://example.com/file.bin', 'file.bin');
    await downloadService.deleteDownload('file.bin');

    await expect(promise).rejects.toThrow('Download canceled');
    expect(downloadService.isDownloaded('file.bin')).toBe(false);
    expect(downloadService.getDownloadedFiles()).toEqual({});
  });
});
