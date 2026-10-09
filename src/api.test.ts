import axios from 'axios';

import { ApiError, getAccessibleHostUuids, getUpcomingChangesForHosts } from './api';
import { isTransientFailure } from './utils/batchRetry';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    request: jest.fn(),
  },
}));

jest.mock('./constants', () => ({
  DR_API: '/api/roadmap/v1',
  DR_LIFECYCLE_HOST_UUIDS: '/lifecycle/host-uuids',
  DR_RELEVANT_UPCOMING_HOSTS: '/relevant/upcoming-changes/hosts?all=true',
}));

const request = axios.request as jest.Mock;

describe('getAccessibleHostUuids', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('requests the hyphenated route and returns the response envelope', async () => {
    const body = { meta: { count: 1, total: 1 }, data: ['host-1'] };
    request.mockResolvedValue({ status: 200, data: body });

    await expect(getAccessibleHostUuids()).resolves.toEqual(body);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'get', url: '/api/roadmap/v1/lifecycle/host-uuids' })
    );
  });

  it('forwards an abort signal on the host uuid request', async () => {
    const controller = new AbortController();
    request.mockResolvedValue({ status: 200, data: { meta: { count: 0, total: 0 }, data: [] } });

    await getAccessibleHostUuids(controller.signal);

    expect(request).toHaveBeenCalledWith(expect.objectContaining({ signal: controller.signal }));
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

describe('getUpcomingChangesForHosts', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('posts the host ids to the all=true hosts route', async () => {
    const body = { meta: { count: 0, total: 0 }, data: [] };
    request.mockResolvedValue({ status: 200, data: body });

    await expect(getUpcomingChangesForHosts(['host-1', 'host-2'])).resolves.toEqual(body);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: '/api/roadmap/v1/relevant/upcoming-changes/hosts?all=true',
        data: { host_ids: ['host-1', 'host-2'] },
      })
    );
  });

  it('forwards an abort signal on the hosts post', async () => {
    const controller = new AbortController();
    request.mockResolvedValue({ status: 200, data: { meta: { count: 0, total: 0 }, data: [] } });

    await getUpcomingChangesForHosts(['host-1'], controller.signal);

    expect(request).toHaveBeenCalledWith(expect.objectContaining({ signal: controller.signal }));
  });
});
