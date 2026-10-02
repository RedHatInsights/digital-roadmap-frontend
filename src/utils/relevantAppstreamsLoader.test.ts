import { SystemsDetail } from '../types/SystemsDetail';
import {
  BATCH_SIZE,
  MAX_CONCURRENT_REQUESTS,
  RelevantAppStreamRow,
  RelevantAppstreamsClient,
  loadRelevantLifecycleAppstreams,
} from './relevantAppstreamsLoader';

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
  it('uses one request at a time and batches 5000 host ids', async () => {
    expect(BATCH_SIZE).toBe(5000);
    expect(MAX_CONCURRENT_REQUESTS).toBe(1);

    const ids = makeIds(BATCH_SIZE * 2 + 1);
    const calls: string[][] = [];
    const releases: Array<() => void> = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const progress: Array<{ requested: number; total: number }> = [];

    const client: RelevantAppstreamsClient = {
      getAccessibleHostUuids: async () => ({ accessible_host_uuids: ids }),
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

    const pending = loadRelevantLifecycleAppstreams(client, (update) => progress.push(update));

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
      getAccessibleHostUuids: async () => ({ accessible_host_uuids: ids }),
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

    const result = await loadRelevantLifecycleAppstreams(client);
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

  it('does not request app streams when there are no host uuids', async () => {
    const fetchHosts = jest.fn();
    const client: RelevantAppstreamsClient = {
      getAccessibleHostUuids: async () => ({ accessible_host_uuids: [] }),
      getRelevantLifecycleAppstreamsForHosts: fetchHosts,
    };

    await expect(loadRelevantLifecycleAppstreams(client)).resolves.toEqual({ data: [] });
    expect(fetchHosts).not.toHaveBeenCalled();
  });

  it('rejects when a batch fails and does not request the next batch', async () => {
    const ids = makeIds(BATCH_SIZE + 1);
    let rejectBatch: (error: Error) => void = () => undefined;
    let started: () => void = () => undefined;
    const startedPromise = new Promise<void>((resolve) => {
      started = resolve;
    });
    const fetchHosts = jest.fn(
      () =>
        new Promise<{ data: RelevantAppStreamRow[] }>((_, reject) => {
          started();
          rejectBatch = reject;
        })
    );
    const client: RelevantAppstreamsClient = {
      getAccessibleHostUuids: async () => ({ accessible_host_uuids: ids }),
      getRelevantLifecycleAppstreamsForHosts: fetchHosts,
    };

    const pending = loadRelevantLifecycleAppstreams(client);
    await startedPromise;
    expect(fetchHosts).toHaveBeenCalledTimes(1);

    const error = new Error('boom');
    rejectBatch(error);

    await expect(pending).rejects.toBe(error);
    expect(fetchHosts).toHaveBeenCalledTimes(1);
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
