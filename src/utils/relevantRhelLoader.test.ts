import { SystemsDetail } from '../types/SystemsDetail';
import * as batchRetry from './batchRetry';
import {
  BATCH_SIZE,
  MAX_CONCURRENT_REQUESTS,
  MAX_FAILED_REQUESTS,
  RelevantRhelClient,
  RelevantRhelRow,
  loadRelevantLifecycleSystems,
} from './relevantRhelLoader';

jest.mock('./batchRetry', () => {
  const actual = jest.requireActual('./batchRetry');
  return {
    ...actual,
    waitBeforeRetry: jest.fn(() => Promise.resolve()),
  };
});

const makeIds = (count: number) => Array.from({ length: count }, (_, index) => `host-${index}`);

const system = (overrides: Partial<RelevantRhelRow> = {}): RelevantRhelRow => ({
  name: 'RHEL',
  display_name: 'RHEL',
  major: 9,
  minor: 0,
  start_date: '2022-05-17',
  end_date: '2032-05-31',
  count: 1,
  lifecycle_type: 'mainline',
  support_status: 'Supported',
  related: false,
  systems_detail: [{ id: 'host-1', display_name: 'host-1' }],
  ...overrides,
});

const host = (id: string): SystemsDetail => ({ id, display_name: id });

describe('loadRelevantLifecycleSystems', () => {
  beforeEach(() => {
    jest.mocked(batchRetry.waitBeforeRetry).mockClear();
  });

  it('uses one request at a time and batches 5000 host ids', async () => {
    expect(BATCH_SIZE).toBe(10000);
    expect(MAX_CONCURRENT_REQUESTS).toBe(1);
    expect(MAX_FAILED_REQUESTS).toBe(3);

    const ids = makeIds(BATCH_SIZE * 2 + 1);
    const calls: string[][] = [];
    const releases: Array<() => void> = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const progress: Array<{ requested: number; total: number }> = [];

    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: (hostIds) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        calls.push(hostIds);
        return new Promise((resolve) => {
          releases.push(() => {
            inFlight -= 1;
            resolve({ data: [] });
          });
        });
      },
    };

    const pending = loadRelevantLifecycleSystems(ids, client, (update) => progress.push(update));

    await waitForCalls(calls, 1);
    expect(calls[0]).toHaveLength(BATCH_SIZE);
    expect(calls[0]).toEqual(ids.slice(0, BATCH_SIZE));
    expect(progress).toEqual([{ requested: BATCH_SIZE, total: ids.length }]);
    expect(maxInFlight).toBe(1);

    releases[0]();
    await waitForCalls(calls, 2);
    expect(calls[1]).toHaveLength(BATCH_SIZE);
    expect(progress[1]).toEqual({ requested: BATCH_SIZE * 2, total: ids.length });
    expect(maxInFlight).toBe(1);

    releases[1]();
    await waitForCalls(calls, 3);
    expect(calls[2]).toEqual(ids.slice(BATCH_SIZE * 2));
    expect(progress[2]).toEqual({ requested: ids.length, total: ids.length });

    releases[2]();
    await expect(pending).resolves.toEqual({ data: [] });
    expect(maxInFlight).toBe(1);
  });

  it('merges installed rows and drops a related row once that version is installed', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const firstHost = ids[0];
    const lastHost = ids[BATCH_SIZE];

    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: async (hostIds) => {
        if (hostIds[0] === firstHost) {
          return {
            data: [
              system({
                count: 2,
                systems_detail: [host(firstHost), host('extra')],
              }),
              system({
                minor: 4,
                related: true,
                count: 0,
                systems_detail: [],
                support_status: 'Not installed',
              }),
              system({
                minor: 6,
                related: true,
                count: 0,
                systems_detail: [],
                support_status: 'Not installed',
              }),
            ],
          };
        }

        return {
          data: [
            system({
              count: 1,
              systems_detail: [host(lastHost)],
            }),
            system({
              minor: 4,
              lifecycle_type: 'EUS',
              related: false,
              count: 1,
              systems_detail: [host(lastHost)],
              support_status: 'Supported',
            }),
            system({
              minor: 6,
              related: true,
              count: 0,
              systems_detail: [],
              support_status: 'Not installed',
            }),
          ],
        };
      },
    };

    const result = await loadRelevantLifecycleSystems(ids, client);

    expect(result.data.map((row) => [row.lifecycle_type, row.major, row.minor, row.related])).toEqual([
      ['mainline', 9, 6, true],
      ['mainline', 9, 0, false],
      ['EUS', 9, 4, false],
    ]);

    const installedNine = result.data.find((row) => row.minor === 0);
    expect(installedNine?.count).toBe(3);
    expect(installedNine?.systems_detail).toEqual([host(firstHost), host('extra'), host(lastHost)]);

    const eus = result.data.find((row) => row.lifecycle_type === 'EUS');
    expect(eus).toMatchObject({ related: false, count: 1, minor: 4 });
    expect(eus?.systems_detail).toEqual([host(lastHost)]);
  });

  it('does not request RHEL lifecycle when there are no host uuids', async () => {
    const fetchHosts = jest.fn();
    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: fetchHosts,
    };

    await expect(loadRelevantLifecycleSystems([], client)).resolves.toEqual({ data: [] });
    expect(fetchHosts).not.toHaveBeenCalled();
  });

  it('retries a failed batch with the same ids and does not advance progress', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const progress: Array<{ requested: number; total: number }> = [];
    const fetchHosts = jest
      .fn<Promise<{ data: RelevantRhelRow[] }>, [string[]]>()
      .mockRejectedValueOnce(new Error('once'))
      .mockResolvedValue({ data: [] });
    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: fetchHosts,
    };

    await loadRelevantLifecycleSystems(ids, client, (update) => progress.push(update));

    expect(fetchHosts).toHaveBeenCalledTimes(3);
    expect(batchRetry.waitBeforeRetry).toHaveBeenCalledTimes(1);
    expect(fetchHosts.mock.calls[0][0]).toEqual(ids.slice(0, BATCH_SIZE));
    expect(fetchHosts.mock.calls[1][0]).toEqual(ids.slice(0, BATCH_SIZE));
    expect(fetchHosts.mock.calls[2][0]).toEqual(ids.slice(BATCH_SIZE));
    expect(progress).toEqual([
      { requested: BATCH_SIZE, total: ids.length },
      { requested: ids.length, total: ids.length },
    ]);
  });

  it('rejects after three failed requests and does not start the next batch', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const error = new Error('boom');
    const fetchHosts = jest.fn().mockRejectedValue(error);
    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: fetchHosts,
    };

    await expect(loadRelevantLifecycleSystems(ids, client)).rejects.toBe(error);
    expect(fetchHosts).toHaveBeenCalledTimes(MAX_FAILED_REQUESTS);
    expect(batchRetry.waitBeforeRetry).toHaveBeenCalledTimes(MAX_FAILED_REQUESTS - 1);
    expect(fetchHosts.mock.calls.every(([hostIds]) => hostIds.length === BATCH_SIZE)).toBe(true);
  });

  it('gives each batch a fresh retry allowance after an earlier batch recovers', async () => {
    const ids = makeIds(BATCH_SIZE * 2 + 1);
    const fetchHosts = jest
      .fn()
      .mockRejectedValueOnce(new Error('batch-1'))
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(new Error('batch-2'))
      .mockResolvedValueOnce({ data: [] })
      .mockRejectedValueOnce(new Error('batch-3'))
      .mockResolvedValue({ data: [] });
    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: fetchHosts,
    };

    await loadRelevantLifecycleSystems(ids, client);

    expect(fetchHosts).toHaveBeenCalledTimes(6);
    expect(fetchHosts.mock.calls[0][0]).toEqual(ids.slice(0, BATCH_SIZE));
    expect(fetchHosts.mock.calls[1][0]).toEqual(ids.slice(0, BATCH_SIZE));
    expect(fetchHosts.mock.calls[2][0]).toEqual(ids.slice(BATCH_SIZE, BATCH_SIZE * 2));
    expect(fetchHosts.mock.calls[3][0]).toEqual(ids.slice(BATCH_SIZE, BATCH_SIZE * 2));
    expect(fetchHosts.mock.calls[4][0]).toEqual(ids.slice(BATCH_SIZE * 2));
    expect(fetchHosts.mock.calls[5][0]).toEqual(ids.slice(BATCH_SIZE * 2));
  });

  it('does not request when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchHosts = jest.fn();
    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: fetchHosts,
    };

    await expect(
      loadRelevantLifecycleSystems(makeIds(1), client, undefined, controller.signal)
    ).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchHosts).not.toHaveBeenCalled();
  });

  it('does not retry or continue after an aborted batch', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const controller = new AbortController();
    const canceled = Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' });
    const fetchHosts = jest.fn().mockImplementation(() => {
      controller.abort();
      return Promise.reject(canceled);
    });
    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: fetchHosts,
    };

    await expect(loadRelevantLifecycleSystems(ids, client, undefined, controller.signal)).rejects.toBe(canceled);
    expect(fetchHosts).toHaveBeenCalledTimes(1);
    expect(fetchHosts).toHaveBeenCalledWith(ids.slice(0, BATCH_SIZE), controller.signal);
    expect(batchRetry.waitBeforeRetry).not.toHaveBeenCalled();
  });

  it('does not retry a permanent client error', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const error = Object.assign(new Error('bad request'), { status_code: 400 });
    const fetchHosts = jest.fn().mockRejectedValue(error);
    const client: RelevantRhelClient = {
      getRelevantLifecycleSystemsForHosts: fetchHosts,
    };

    await expect(loadRelevantLifecycleSystems(ids, client)).rejects.toBe(error);
    expect(fetchHosts).toHaveBeenCalledTimes(1);
    expect(batchRetry.waitBeforeRetry).not.toHaveBeenCalled();
  });
});

const waitForCalls = async (calls: string[][], count: number) => {
  const deadline = Date.now() + 1000;
  while (calls.length < count) {
    if (Date.now() > deadline) {
      throw new Error(`Expected ${count} calls, received ${calls.length}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};
