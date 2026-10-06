import axios from 'axios';

import { ApiError, getAccessibleHostUuids } from './api';
import { isTransientFailure } from './utils/batchRetry';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    request: jest.fn(),
  },
}));

jest.mock('./constants', () => ({
  DR_API: '/api/roadmap/v1',
  DR_LIFECYCLE_HOST_UUIDS: '/lifecycle/host_uuids',
}));

const request = axios.request as jest.Mock;

describe('requestBackend error status', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('keeps the HTTP status when the error body has no detail', async () => {
    request.mockRejectedValue({
      message: 'Request failed with status code 403',
      response: { status: 403, data: '' },
      request: { response: '' },
    });

    const error = await getAccessibleHostUuids().then(
      () => {
        throw new Error('expected the request to fail');
      },
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status_code: 403 });
    expect(isTransientFailure(error)).toBe(false);
  });

  it('leaves a network failure without a status so it can be retried', async () => {
    request.mockRejectedValue({
      message: 'Network Error',
      request: {},
    });

    const error = await getAccessibleHostUuids().then(
      () => {
        throw new Error('expected the request to fail');
      },
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status_code: undefined });
    expect(isTransientFailure(error)).toBe(true);
  });
});
