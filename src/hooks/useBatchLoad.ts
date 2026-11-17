import { useCallback, useRef, useState } from 'react';
import { isAbortError } from '../utils/batchRetry';

export type BatchLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export type BatchLoadProgress = {
  completed: number;
  total: number;
};

export type BatchLoadTask<T> = (
  onProgress: (progress: BatchLoadProgress) => void,
  signal: AbortSignal
) => Promise<T>;

export type BatchLoadState<T> = {
  status: BatchLoadStatus;
  data?: T;
  progress: BatchLoadProgress | null;
  error?: unknown;
};

const initialState = <T>(status: BatchLoadStatus): BatchLoadState<T> => ({
  status,
  progress: null,
});

export const useBatchLoad = <T>(initialStatus: BatchLoadStatus = 'idle') => {
  const [state, setState] = useState<BatchLoadState<T>>(() => initialState<T>(initialStatus));
  const runRef = useRef(0);

  const start = useCallback(async (task: BatchLoadTask<T>, signal: AbortSignal, total = 0) => {
    const run = ++runRef.current;
    const active = () => runRef.current === run && !signal.aborted;
    let latestProgress = total > 0 ? { completed: 0, total } : null;

    setState({ status: 'loading', progress: latestProgress });

    try {
      const data = await task((nextProgress) => {
        if (active()) {
          latestProgress = nextProgress;
          setState((current) => ({ ...current, progress: nextProgress }));
        }
      }, signal);

      if (active()) {
        setState({ status: 'ready', data, progress: latestProgress });
      }
      return data;
    } catch (error) {
      if (active() && !isAbortError(error)) {
        setState((current) => ({ ...current, status: 'error', error }));
      }
      throw error;
    }
  }, []);

  const complete = useCallback((data: T) => {
    ++runRef.current;
    setState({ status: 'ready', data, progress: null });
    return data;
  }, []);

  const reset = useCallback(() => {
    ++runRef.current;
    setState(initialState<T>('loading'));
  }, []);

  const fail = useCallback((error: unknown) => {
    ++runRef.current;
    setState({ status: 'error', progress: null, error });
  }, []);

  return { ...state, start, complete, reset, fail };
};
