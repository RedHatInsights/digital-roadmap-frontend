import * as batchRetry from './batchRetry';
import {
  BATCH_SIZE,
  MAX_CONCURRENT_REQUESTS,
  MAX_FAILED_REQUESTS,
  UpcomingChangeRow,
  UpcomingChangesClient,
  loadAllUpcomingChanges,
} from './relevantUpcomingLoader';

jest.mock('./batchRetry', () => {
  const actual = jest.requireActual('./batchRetry');
  return {
    ...actual,
    waitBeforeRetry: jest.fn(() => Promise.resolve()),
  };
});

const makeIds = (count: number) => Array.from({ length: count }, (_, index) => `host-${index}`);

const change = (overrides: Partial<UpcomingChangeRow> = {}): UpcomingChangeRow => ({
  name: 'Ruby 3.3 Deprecation',
  type: 'deprecation',
  package: 'ruby',
  packages: ['ruby'],
  release: '9.6',
  date: '2026-05-31',
  details: {
    summary: 'Ruby leaves the default streams',
    architecture: 'x86_64',
    potentiallyAffectedSystemsCount: 1,
    potentiallyAffectedSystemsDetail: [{ id: 'host-1', display_name: 'host-1', os_major: 9, os_minor: 4 }],
    potentiallyAffectedSystems: ['host-1'],
    trainingTicket: 'TEST-1',
    deployedDate: '2024-11-01',
    lastModified: '2024-01-01',
    detailFormat: 0,
  },
  ...overrides,
});

const host = (id: string, osMajor = 9) => ({ id, display_name: id, os_major: osMajor, os_minor: 0 });

describe('loadAllUpcomingChanges', () => {
  beforeEach(() => {
    jest.mocked(batchRetry.waitBeforeRetry).mockClear();
  });

  it('uses one request at a time and batches 5000 host ids', async () => {
    expect(BATCH_SIZE).toBe(5000);
    expect(MAX_CONCURRENT_REQUESTS).toBe(1);
    expect(MAX_FAILED_REQUESTS).toBe(3);

    const ids = makeIds(BATCH_SIZE * 2 + 1);
    const calls: string[][] = [];
    const releases: Array<() => void> = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const progress: Array<{ requested: number; total: number }> = [];

    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: (hostIds) => {
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

    const pending = loadAllUpcomingChanges(ids, client, (update) => progress.push(update));

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
    await expect(pending).resolves.toEqual({ meta: { count: 0, total: 0 }, data: [] });
    expect(maxInFlight).toBe(1);
  });

  it('merges rows that share a name and release and keeps zero-count items', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const firstHost = ids[0];
    const lastHost = ids[BATCH_SIZE];
    const nobody = change({
      name: 'Test package that nobody has',
      release: '10.0',
      type: 'change',
      package: 'nobody',
      details: {
        summary: 'No hosts match',
        potentiallyAffectedSystemsCount: 0,
        potentiallyAffectedSystemsDetail: [],
        potentiallyAffectedSystems: [],
      },
    });
    const otherRelease = change({
      name: 'Ruby 3.3 Deprecation',
      release: '10.0',
      details: {
        summary: 'RHEL 10 ruby',
        potentiallyAffectedSystemsCount: 1,
        potentiallyAffectedSystemsDetail: [host(firstHost, 10)],
        potentiallyAffectedSystems: [firstHost],
      },
    });

    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: async (hostIds) => {
        if (hostIds[0] === firstHost) {
          return {
            data: [
              nobody,
              change({
                details: {
                  summary: 'Ruby leaves the default streams',
                  potentiallyAffectedSystemsCount: 2,
                  potentiallyAffectedSystemsDetail: [host(firstHost), host('extra')],
                  potentiallyAffectedSystems: [firstHost, 'extra'],
                },
              }),
              otherRelease,
            ],
          };
        }

        return {
          data: [
            nobody,
            change({
              details: {
                summary: 'A later batch must not replace the summary',
                potentiallyAffectedSystemsCount: 2,
                potentiallyAffectedSystemsDetail: [host(firstHost), host(lastHost)],
                potentiallyAffectedSystems: [firstHost, lastHost],
              },
            }),
            change({
              name: 'Ruby 3.3 Deprecation',
              release: '10.0',
              details: {
                summary: 'RHEL 10 ruby',
                potentiallyAffectedSystemsCount: 0,
                potentiallyAffectedSystemsDetail: [],
                potentiallyAffectedSystems: [],
              },
            }),
          ],
        };
      },
    };

    const result = await loadAllUpcomingChanges(ids, client);

    expect(result.data.map((row) => [row.name, row.release])).toEqual([
      ['Test package that nobody has', '10.0'],
      ['Ruby 3.3 Deprecation', '9.6'],
      ['Ruby 3.3 Deprecation', '10.0'],
    ]);
    expect(result.meta).toEqual({ count: 3, total: 3 });

    const ruby = result.data[1];
    expect(ruby.details?.summary).toBe('Ruby leaves the default streams');
    expect(ruby.details?.potentiallyAffectedSystemsCount).toBe(3);
    expect(ruby.details?.potentiallyAffectedSystems).toEqual([firstHost, 'extra', lastHost]);
    expect(ruby.details?.potentiallyAffectedSystemsDetail).toEqual([
      host(firstHost),
      host('extra'),
      host(lastHost),
    ]);

    expect(result.data[0].details?.potentiallyAffectedSystemsCount).toBe(0);
    expect(result.data[2].details).toMatchObject({
      potentiallyAffectedSystemsCount: 1,
      potentiallyAffectedSystems: [firstHost],
    });
  });

  it('requests the full catalog once when there are no host uuids', async () => {
    const catalog = [
      change({
        details: {
          summary: 'No hosts',
          potentiallyAffectedSystemsCount: 0,
          potentiallyAffectedSystemsDetail: [],
          potentiallyAffectedSystems: [],
        },
      }),
    ];
    const fetchHosts = jest.fn().mockResolvedValue({ data: catalog });
    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: fetchHosts,
    };

    const result = await loadAllUpcomingChanges([], client);

    expect(fetchHosts).toHaveBeenCalledTimes(1);
    expect(fetchHosts).toHaveBeenCalledWith([], undefined);
    expect(result.meta).toEqual({ count: 1, total: 1 });
    expect(result.data[0].details?.potentiallyAffectedSystemsCount).toBe(0);
  });

  it('retries a failed batch with the same ids and does not advance progress', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const progress: Array<{ requested: number; total: number }> = [];
    const fetchHosts = jest
      .fn<Promise<{ data: UpcomingChangeRow[] }>, [string[]]>()
      .mockRejectedValueOnce(new Error('once'))
      .mockResolvedValue({ data: [] });
    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: fetchHosts,
    };

    await loadAllUpcomingChanges(ids, client, (update) => progress.push(update));

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
    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: fetchHosts,
    };

    await expect(loadAllUpcomingChanges(ids, client)).rejects.toBe(error);
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
    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: fetchHosts,
    };

    await loadAllUpcomingChanges(ids, client);

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
    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: fetchHosts,
    };

    await expect(loadAllUpcomingChanges(makeIds(1), client, undefined, controller.signal)).rejects.toMatchObject({
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
    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: fetchHosts,
    };

    await expect(loadAllUpcomingChanges(ids, client, undefined, controller.signal)).rejects.toBe(canceled);
    expect(fetchHosts).toHaveBeenCalledTimes(1);
    expect(fetchHosts).toHaveBeenCalledWith(ids.slice(0, BATCH_SIZE), controller.signal);
    expect(batchRetry.waitBeforeRetry).not.toHaveBeenCalled();
  });

  it('does not retry a permanent client error', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const error = Object.assign(new Error('bad request'), { status_code: 400 });
    const fetchHosts = jest.fn().mockRejectedValue(error);
    const client: UpcomingChangesClient = {
      getUpcomingChangesForHosts: fetchHosts,
    };

    await expect(loadAllUpcomingChanges(ids, client)).rejects.toBe(error);
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
