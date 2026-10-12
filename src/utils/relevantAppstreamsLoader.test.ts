import { SystemsDetail } from '../types/SystemsDetail';
import * as batchRetry from './batchRetry';
import {
  BATCH_SIZE,
  MAX_CONCURRENT_REQUESTS,
  MAX_FAILED_REQUESTS,
  RelevantAppStreamRow,
  RelevantAppstreamsClient,
  loadRelevantLifecycleAppstreams,
} from './relevantAppstreamsLoader';

jest.mock('./batchRetry', () => {
  const actual = jest.requireActual('./batchRetry');
  return {
    ...actual,
    waitBeforeRetry: jest.fn(() => Promise.resolve()),
  };
});

const makeIds = (count: number) => Array.from({ length: count }, (_, index) => `host-${index}`);

const stream = (overrides: Partial<RelevantAppStreamRow> = {}): RelevantAppStreamRow => ({
  name: 'python39',
  display_name: 'Python 3.9',
  application_stream_name: 'Python 3.9',
  os_major: 9,
  os_minor: 0,
  start_date: '2019-05-07',
  end_date: '2024-04-30',
  support_status: 'Supported',
  count: 1,
  rolling: false,
  related: false,
  systems_detail: [{ id: 'host-1', display_name: 'host-1' }],
  ...overrides,
});

const host = (id: string): SystemsDetail => ({ id, display_name: id });

describe('loadRelevantLifecycleAppstreams', () => {
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

    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: (hostIds) => {
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

    const pending = loadRelevantLifecycleAppstreams(ids, client, (update) => progress.push(update));

    await waitForCalls(calls, 1);
    expect(calls[0]).toHaveLength(5000);
    expect(calls[0]).toEqual(ids.slice(0, 5000));
    expect(progress).toEqual([{ requested: 5000, total: ids.length }]);
    expect(maxInFlight).toBe(1);

    releases[0]();
    await waitForCalls(calls, 2);
    expect(calls[1]).toHaveLength(5000);
    expect(progress[1]).toEqual({ requested: 10000, total: ids.length });
    expect(maxInFlight).toBe(1);

    releases[1]();
    await waitForCalls(calls, 3);
    expect(calls[2]).toEqual(ids.slice(10000));
    expect(progress[2]).toEqual({ requested: ids.length, total: ids.length });

    releases[2]();
    await expect(pending).resolves.toEqual({ data: [] });
    expect(maxInFlight).toBe(1);
  });

  it('merges installed rows and drops a related row once that stream is installed', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const firstHost = ids[0];
    const lastHost = ids[BATCH_SIZE];
    const nodeStream = {
      name: 'nodejs18',
      display_name: 'Node.js 18',
      application_stream_name: 'Node.js 18',
      os_major: 9,
      os_minor: 2,
    };
    const postgresStream = {
      name: 'postgresql15',
      display_name: 'PostgreSQL 15',
      application_stream_name: 'PostgreSQL 15',
      os_major: 8,
      os_minor: null,
    };

    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: async (hostIds) => {
        if (hostIds[0] === firstHost) {
          return {
            data: [
              stream({
                count: 2,
                systems_detail: [host(firstHost), host('extra')],
              }),
              stream({
                ...nodeStream,
                related: true,
                count: 0,
                systems_detail: [],
                support_status: 'Not installed',
              }),
              stream({
                ...postgresStream,
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
            stream({
              count: 1,
              systems_detail: [host(lastHost)],
            }),
            stream({
              ...nodeStream,
              related: false,
              count: 1,
              systems_detail: [host(lastHost)],
              support_status: 'Supported',
            }),
            stream({
              ...postgresStream,
              related: true,
              count: 0,
              systems_detail: [],
              support_status: 'Not installed',
            }),
          ],
        };
      },
    };

    const result = await loadRelevantLifecycleAppstreams(ids, client);
    const names = result.data.map((row) => row.name);

    expect(names).toEqual(['nodejs18', 'postgresql15', 'python39']);

    const node = result.data.find((row) => row.name === 'nodejs18');
    expect(node).toMatchObject({
      related: false,
      count: 1,
      support_status: 'Supported',
    });
    expect(node?.systems_detail).toEqual([host(lastHost)]);

    const postgres = result.data.find((row) => row.name === 'postgresql15');
    expect(postgres).toMatchObject({ related: true, count: 0 });

    const python = result.data.find((row) => row.name === 'python39');
    expect(python?.count).toBe(3);
    expect(python?.systems_detail).toEqual([host(firstHost), host('extra'), host(lastHost)]);
  });

  it.each([
    ['after the related batch', true],
    ['before the related batch', false],
  ])('keeps the installed stream when it arrives %s', async (_order, installedLast) => {
    const ids = makeIds(BATCH_SIZE + 1);
    const installed = stream({
      name: 'Node.js 24',
      display_name: 'Node.js 24',
      application_stream_name: 'Node.js 24',
      os_major: 10,
      os_minor: 1,
      count: 1,
      systems_detail: [host(installedLast ? ids[BATCH_SIZE] : ids[0])],
    });
    const related = stream({
      name: 'Node.js 22',
      display_name: 'Node.js 24',
      application_stream_name: 'Node.js 24',
      os_major: 10,
      os_minor: 1,
      related: true,
      count: 0,
      support_status: 'Not installed',
      systems_detail: [],
    });
    const firstRow = installedLast ? related : installed;
    const secondRow = installedLast ? installed : related;
    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: async (hostIds) => ({
        data: [hostIds[0] === ids[0] ? firstRow : secondRow],
      }),
    };

    const result = await loadRelevantLifecycleAppstreams(ids, client);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      name: 'Node.js 24',
      display_name: 'Node.js 24',
      related: false,
      count: 1,
      systems_detail: installed.systems_detail,
    });
  });

  it('deduplicates a related stream found through different installed streams across batches', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: async (hostIds) => ({
        data: [
          stream({
            name: hostIds[0] === ids[0] ? 'Node.js 22' : 'Node.js 24',
            display_name: 'Node.js 26',
            application_stream_name: 'Node.js 26',
            os_major: 10,
            os_minor: 3,
            related: true,
            count: 0,
            systems_detail: [],
          }),
        ],
      }),
    };

    const result = await loadRelevantLifecycleAppstreams(ids, client);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({ display_name: 'Node.js 26', related: true, count: 0 });
  });

  it('does not request app streams when there are no host uuids', async () => {
    const fetchHosts = jest.fn();
    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: fetchHosts,
    };

    await expect(loadRelevantLifecycleAppstreams([], client)).resolves.toEqual({ data: [] });
    expect(fetchHosts).not.toHaveBeenCalled();
  });

  it('retries a failed batch with the same ids and does not advance progress', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const progress: Array<{ requested: number; total: number }> = [];
    const fetchHosts = jest
      .fn<Promise<{ data: RelevantAppStreamRow[] }>, [string[]]>()
      .mockRejectedValueOnce(new Error('once'))
      .mockResolvedValue({ data: [] });
    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: fetchHosts,
    };

    await loadRelevantLifecycleAppstreams(ids, client, (update) => progress.push(update));

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
    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: fetchHosts,
    };

    await expect(loadRelevantLifecycleAppstreams(ids, client)).rejects.toBe(error);
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
    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: fetchHosts,
    };

    await loadRelevantLifecycleAppstreams(ids, client);

    expect(fetchHosts).toHaveBeenCalledTimes(6);
    expect(fetchHosts.mock.calls[0][0]).toEqual(ids.slice(0, BATCH_SIZE));
    expect(fetchHosts.mock.calls[1][0]).toEqual(ids.slice(0, BATCH_SIZE));
    expect(fetchHosts.mock.calls[2][0]).toEqual(ids.slice(BATCH_SIZE, BATCH_SIZE * 2));
    expect(fetchHosts.mock.calls[3][0]).toEqual(ids.slice(BATCH_SIZE, BATCH_SIZE * 2));
    expect(fetchHosts.mock.calls[4][0]).toEqual(ids.slice(BATCH_SIZE * 2));
    expect(fetchHosts.mock.calls[5][0]).toEqual(ids.slice(BATCH_SIZE * 2));
  });

  it('does not retry a permanent client error', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    const error = Object.assign(new Error('bad request'), { status_code: 400 });
    const fetchHosts = jest.fn().mockRejectedValue(error);
    const client: RelevantAppstreamsClient = {
      getRelevantLifecycleAppstreamsForHosts: fetchHosts,
    };

    await expect(loadRelevantLifecycleAppstreams(ids, client)).rejects.toBe(error);
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
