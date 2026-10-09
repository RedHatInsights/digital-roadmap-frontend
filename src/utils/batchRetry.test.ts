import { isAbortError, isTransientFailure, waitBeforeRetry } from './batchRetry';

describe('isTransientFailure', () => {
  it('retries network failures, timeouts, rate limits, and server errors', () => {
    expect(isTransientFailure(new Error('network'))).toBe(true);
    expect(isTransientFailure(Object.assign(new Error('timeout'), { status_code: 408 }))).toBe(true);
    expect(isTransientFailure(Object.assign(new Error('rate limit'), { status_code: 429 }))).toBe(true);
    expect(isTransientFailure(Object.assign(new Error('unavailable'), { status_code: 503 }))).toBe(true);
  });

  it('does not retry other client errors', () => {
    expect(isTransientFailure(Object.assign(new Error('bad request'), { status_code: 400 }))).toBe(false);
    expect(isTransientFailure(Object.assign(new Error('unauthorized'), { status_code: 401 }))).toBe(false);
    expect(isTransientFailure(Object.assign(new Error('missing'), { status_code: 404 }))).toBe(false);
  });

  it('does not retry an aborted request', () => {
    const canceled = Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' });
    expect(isAbortError(canceled)).toBe(true);
    expect(isTransientFailure(canceled)).toBe(false);
    expect(isAbortError(new DOMException('The operation was aborted.', 'AbortError'))).toBe(true);
  });

  it('rejects the retry wait when the signal aborts', async () => {
    const controller = new AbortController();
    const pending = waitBeforeRetry(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});
