import { act, renderHook } from '@testing-library/react';
import { BatchLoadProgress, useBatchLoad } from './useBatchLoad';

describe('useBatchLoad', () => {
  it('tracks progress only through the active run and marks successful data ready', async () => {
    let resolveLoad: (value: string) => void = () => undefined;
    const { result } = renderHook(() => useBatchLoad<string>());
    const controller = new AbortController();

    let pending!: Promise<string>;
    act(() => {
      pending = result.current.start(
        async (onProgress, _onSlow, signal) => {
          onProgress({ completed: 2, total: 5 });
          expect(signal).toBe(controller.signal);
          return new Promise<string>((resolve) => {
            resolveLoad = resolve;
          });
        },
        controller.signal,
        5
      );
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.progress).toEqual({ completed: 2, total: 5 });

    await act(async () => {
      resolveLoad('loaded');
      await pending;
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.data).toBe('loaded');
    expect(result.current.isSlow).toBe(false);
  });

  it('shows the slow state and clears it when progress advances', async () => {
    const { result } = renderHook(() => useBatchLoad<string>());
    const controller = new AbortController();
    let resolveLoad: (value: string) => void = () => undefined;
    let reportProgress!: (progress: BatchLoadProgress) => void;
    let reportSlow!: (isSlow: boolean) => void;

    let pending!: Promise<string>;
    act(() => {
      pending = result.current.start(
        async (onProgress, onSlow) => {
          reportProgress = onProgress;
          reportSlow = onSlow;
          return new Promise<string>((resolve) => {
            resolveLoad = resolve;
          });
        },
        controller.signal,
        5
      );
    });

    act(() => reportSlow(true));
    expect(result.current.isSlow).toBe(true);

    act(() => reportSlow(false));
    expect(result.current.isSlow).toBe(false);

    act(() => reportProgress({ completed: 2, total: 5 }));
    expect(result.current.isSlow).toBe(false);
    expect(result.current.progress).toEqual({ completed: 2, total: 5 });
    expect(result.current.status).toBe('loading');

    await act(async () => {
      resolveLoad('loaded');
      await pending;
    });
    expect(result.current.data).toBe('loaded');
  });

  it.each(['resolve', 'reject'] as const)('ignores a superseded task that later %ss', async (outcome) => {
    const { result } = renderHook(() => useBatchLoad<string>());
    let resolveOld!: (value: string) => void;
    let rejectOld!: (error: Error) => void;
    let reportOldProgress!: (progress: BatchLoadProgress) => void;
    let reportOldSlow!: (isSlow: boolean) => void;
    let oldRun!: Promise<string>;
    act(() => {
      oldRun = result.current.start(
        (onProgress, onSlow) => {
          reportOldProgress = onProgress;
          reportOldSlow = onSlow;
          return new Promise((resolve, reject) => {
            resolveOld = resolve;
            rejectOld = reject;
          });
        },
        new AbortController().signal,
        5
      );
    });

    await act(async () => {
      await result.current.start(
        async (onProgress) => {
          onProgress({ completed: 3, total: 3 });
          return 'restarted';
        },
        new AbortController().signal,
        3
      );
    });
    expect(result.current.data).toBe('restarted');

    await act(async () => {
      reportOldProgress({ completed: 1, total: 5 });
      reportOldSlow(true);
      if (outcome === 'resolve') {
        resolveOld('stale');
        await oldRun;
      } else {
        const failure = new Error('stale failure');
        rejectOld(failure);
        await expect(oldRun).rejects.toBe(failure);
      }
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.data).toBe('restarted');
    expect(result.current.progress).toEqual({ completed: 3, total: 3 });
    expect(result.current.isSlow).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('stores non-abort failures without replacing them with an abort state', async () => {
    const { result } = renderHook(() => useBatchLoad<string>());
    const failure = new Error('failed');

    let pending!: Promise<string>;
    act(() => {
      pending = result.current.start(async () => {
        throw failure;
      }, new AbortController().signal);
    });
    await act(async () => {
      await expect(pending).rejects.toBe(failure);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(failure);
  });

  it('marks empty input ready without showing a 0 / 0 progress measure', () => {
    const { result } = renderHook(() => useBatchLoad<string[]>('loading'));

    act(() => {
      result.current.complete([]);
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.data).toEqual([]);
    expect(result.current.progress).toBeNull();
  });
});
