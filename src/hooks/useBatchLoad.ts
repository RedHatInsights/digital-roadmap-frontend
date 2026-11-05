import { useCallback, useRef, useState } from 'react';
import { isAbortError } from '../utils/batchRetry';

export type BatchLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type BatchLoadProgress = {
  completed: number;
  total: number;
};

export type BatchLoadTask<T> = (
  onProgress: (progress: BatchLoadProgress) => void,
  onSlow: (isSlow: boolean) => void,
  signal: AbortSignal
) => Promise<T>;

export type BatchLoadState<T> = {
  status: BatchLoadStatus;
  data?: T;
  progress: BatchLoadProgress | null;
  isSlow: boolean;
  error?: unknown;
};

const initialState = <T>(status: BatchLoadStatus): BatchLoadState<T> => ({
  status,
  progress: null,
  isSlow: false,
});

export const useBatchLoad = <T>(initialStatus: BatchLoadStatus = 'idle') => {
  const [state, setState] = useState<BatchLoadState<T>>(() => initialState<T>(initialStatus));
  const runRef = useRef(0);

  const start = useCallback(async (task: BatchLoadTask<T>, signal: AbortSignal, total = 0) => {
    const run = ++runRef.current;
    const active = () => runRef.current === run && !signal.aborted;
    let latestProgress = total > 0 ? { completed: 0, total } : null;

    setState({ status: 'loading', progress: latestProgress, isSlow: false });

    try {
      const data = await task(
        (nextProgress) => {
          if (active()) {
            latestProgress = nextProgress;
            setState((current) => ({ ...current, progress: nextProgress, isSlow: false }));
          }
        },
        (isSlow) => {
          if (active()) {
            setState((current) => ({ ...current, isSlow }));
          }
        },
        signal
      );

      if (active()) {
        setState({ status: 'ready', data, progress: latestProgress, isSlow: false });
      }
      return data;
    } catch (error) {
      if (active() && !isAbortError(error)) {
        setState((current) => ({ ...current, status: 'error', isSlow: false, error }));
      }
      throw error;
    }
  }, []);

  const complete = useCallback((data: T) => {
    ++runRef.current;
    setState({ status: 'ready', data, progress: null, isSlow: false });
    return data;
  }, []);

  const reset = useCallback(() => {
    ++runRef.current;
    setState(initialState<T>('loading'));
  }, []);

  const fail = useCallback((error: unknown) => {
    ++runRef.current;
    setState({ status: 'error', progress: null, isSlow: false, error });
  }, []);

  return { ...state, start, complete, reset, fail };
};
