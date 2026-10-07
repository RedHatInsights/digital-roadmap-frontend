/** Pause before another attempt after a transient failure. */
export const RETRY_DELAY_MS = 500;

const statusCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null || !('status_code' in error)) {
    return undefined;
  }

  const status = (error as { status_code?: unknown }).status_code;
  return typeof status === 'number' ? status : undefined;
};

/**
 * Network failures, timeouts, rate limits, and 5xx can succeed on another attempt.
 * Other 4xx responses are permanent for this request.
 */
export const isTransientFailure = (error: unknown) => {
  const status = statusCode(error);
  if (status == null) {
    return true;
  }
  if (status === 408 || status === 429) {
    return true;
  }
  return status >= 500;
};

export const waitBeforeRetry = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, RETRY_DELAY_MS);
  });
