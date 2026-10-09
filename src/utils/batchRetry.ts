/** Pause before another attempt after a transient failure. */
export const RETRY_DELAY_MS = 500;

const statusCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null || !('status_code' in error)) {
    return undefined;
  }

  const status = (error as { status_code?: unknown }).status_code;
  return typeof status === 'number' ? status : undefined;
};

/** Axios cancel, fetch abort, and an AbortController that already fired. */
export const isAbortError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as { name?: unknown; code?: unknown };
  return (
    candidate.name === 'AbortError' || candidate.name === 'CanceledError' || candidate.code === 'ERR_CANCELED'
  );
};

export const abortedError = (signal?: AbortSignal): Error => {
  if (signal?.reason instanceof Error) {
    return signal.reason;
  }
  return new DOMException('The operation was aborted.', 'AbortError');
};

/**
 * Network failures, timeouts, rate limits, and 5xx can succeed on another attempt.
 * Other 4xx responses are permanent for this request. An aborted load is not retried.
 */
export const isTransientFailure = (error: unknown) => {
  if (isAbortError(error)) {
    return false;
  }
  const status = statusCode(error);
  if (status == null) {
    return true;
  }
  if (status === 408 || status === 429) {
    return true;
  }
  return status >= 500;
};

export const waitBeforeRetry = (signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortedError(signal));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, RETRY_DELAY_MS);

    const onAbort = () => {
      clearTimeout(timer);
      reject(abortedError(signal));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
