import { Stream } from '../types/Stream';
import { SystemsDetail } from '../types/SystemsDetail';

/** Hosts per app-stream request. The API accepts at most 10,000. */
export const BATCH_SIZE = 5000;

/** In-flight app-stream requests. Raise this to use more API instances. */
export const MAX_CONCURRENT_REQUESTS = 1;

export type AppstreamLoadProgress = {
  requested: number;
  total: number;
};

export type RelevantAppStreamRow = Omit<Stream, 'os_minor' | 'start_date' | 'end_date' | 'os_lifecycle'> & {
  os_minor: number | null;
  start_date: string | null;
  end_date: string | null;
  os_lifecycle?: string;
  systems_detail: SystemsDetail[];
};

export interface RelevantAppstreamsClient {
  getAccessibleHostUuids: () => Promise<{ accessible_host_uuids?: string[] }>;
  getRelevantLifecycleAppstreamsForHosts: (hostIds: string[]) => Promise<{ data?: RelevantAppStreamRow[] }>;
}

const streamKey = (
  row: Pick<RelevantAppStreamRow, 'name' | 'application_stream_name' | 'os_major' | 'os_minor'>
) => [row.name, row.application_stream_name, row.os_major ?? '', row.os_minor ?? ''].join('\0');

const unionSystems = (current: SystemsDetail[], incoming: SystemsDetail[]): SystemsDetail[] => {
  const byId = new Map<string, SystemsDetail>();
  for (const system of [...current, ...incoming]) {
    if (system?.id && !byId.has(system.id)) {
      byId.set(system.id, system);
    }
  }
  return [...byId.values()];
};

const compareSortValue = (left: string | number | null | undefined, right: string | number | null | undefined) => {
  const rank = (value: string | number | null | undefined) => {
    if (value == null) {
      return -2;
    }
    if (value === '') {
      return -1;
    }
    return value;
  };

  const rankedLeft = rank(left);
  const rankedRight = rank(right);
  if (typeof rankedLeft === 'number' && typeof rankedRight === 'number') {
    return rankedLeft - rankedRight;
  }
  if (typeof rankedLeft === 'number') {
    return -1;
  }
  if (typeof rankedRight === 'number') {
    return 1;
  }
  if (rankedLeft < rankedRight) {
    return -1;
  }
  if (rankedLeft > rankedRight) {
    return 1;
  }
  return 0;
};

const sortStreams = (rows: RelevantAppStreamRow[]) =>
  rows.sort((left, right) => {
    return (
      compareSortValue(left.name, right.name) ||
      compareSortValue(left.os_major, right.os_major) ||
      compareSortValue(left.os_minor, right.os_minor)
    );
  });

/**
 * Fetch accessible host UUIDs, then load app streams for those hosts in batches.
 * Returns one merged list in the same shape as the single relevant-app-streams call.
 */
export const loadRelevantLifecycleAppstreams = async (
  client: RelevantAppstreamsClient,
  onProgress?: (progress: AppstreamLoadProgress) => void
): Promise<{ data: Stream[] }> => {
  const uuidResponse = await client.getAccessibleHostUuids();
  const pending = [...(uuidResponse.accessible_host_uuids ?? [])];
  const total = pending.length;

  if (total === 0) {
    return { data: [] };
  }

  const waiting = new Set<string>();
  const installed = new Map<string, RelevantAppStreamRow>();
  const related = new Map<string, RelevantAppStreamRow>();
  let requested = 0;
  let failure: unknown;

  const mergeRows = (rows: RelevantAppStreamRow[]) => {
    for (const row of rows) {
      const key = streamKey(row);
      if (row.related) {
        if (!installed.has(key) && !related.has(key)) {
          related.set(key, {
            ...row,
            related: true,
            count: typeof row.count === 'number' ? row.count : 0,
            systems_detail: unionSystems([], row.systems_detail ?? []),
          });
        }
        continue;
      }

      const existing = installed.get(key);
      if (!existing) {
        installed.set(key, {
          ...row,
          related: false,
          count: typeof row.count === 'number' ? row.count : 0,
          systems_detail: unionSystems([], row.systems_detail ?? []),
        });
        related.delete(key);
        continue;
      }

      existing.systems_detail = unionSystems(existing.systems_detail ?? [], row.systems_detail ?? []);
      existing.count = (existing.count ?? 0) + (typeof row.count === 'number' ? row.count : 0);
      related.delete(key);
    }
  };

  const worker = async () => {
    while (!failure) {
      const batch = pending.splice(0, BATCH_SIZE);
      if (batch.length === 0) {
        return;
      }

      batch.forEach((id) => waiting.add(id));
      requested += batch.length;
      onProgress?.({ requested, total });

      try {
        const response = await client.getRelevantLifecycleAppstreamsForHosts(batch);
        if (failure) {
          return;
        }
        mergeRows(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        failure = failure ?? error;
        pending.length = 0;
      } finally {
        batch.forEach((id) => waiting.delete(id));
      }
    }
  };

  const workerCount = Math.min(MAX_CONCURRENT_REQUESTS, Math.ceil(total / BATCH_SIZE));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (failure) {
    throw failure;
  }

  const relatedOnly = [...related.values()].filter((row) => !installed.has(streamKey(row)));
  return { data: sortStreams([...installed.values(), ...relatedOnly]) as Stream[] };
};
