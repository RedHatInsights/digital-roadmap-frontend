import { abortedError, isAbortError, isTransientFailure, waitBeforeRetry } from './batchRetry';

/** Hosts per upcoming request. These queries read installed packages, so keep batches smaller than RHEL. */
export const BATCH_SIZE = 5000;

/** In-flight upcoming requests. Keep this at 1 unless the API instances have spare capacity. */
export const MAX_CONCURRENT_REQUESTS = 1;

/** Failed POSTs allowed for one batch. The next batch starts again at zero. */
export const MAX_FAILED_REQUESTS = 3;

export type UpcomingLoadProgress = {
  requested: number;
  total: number;
};

export type UpcomingSystemDetail = {
  id: string;
  display_name: string;
  os_major?: number;
  os_minor?: number | null;
};

export type UpcomingChangeDetails = {
  summary?: string;
  architecture?: string | null;
  potentiallyAffectedSystemsCount: number;
  potentiallyAffectedSystemsDetail: UpcomingSystemDetail[];
  potentiallyAffectedSystems?: string[];
  trainingTicket?: string;
  deployedDate?: string | null;
  lastModified?: string;
  dateAdded?: string;
  detailFormat?: number;
};

export type UpcomingChangeRow = {
  name: string;
  type: string;
  package?: string;
  packages?: string[];
  release: string;
  date: string;
  details?: UpcomingChangeDetails;
};

export interface UpcomingChangesClient {
  getUpcomingChangesForHosts: (hostIds: string[], signal?: AbortSignal) => Promise<{ data?: UpcomingChangeRow[] }>;
}

const itemKey = (row: Pick<UpcomingChangeRow, 'name' | 'release'>) => [row.name, row.release].join('\0');

const unionSystems = (
  current: UpcomingSystemDetail[],
  incoming: UpcomingSystemDetail[]
): UpcomingSystemDetail[] => {
  const byId = new Map<string, UpcomingSystemDetail>();
  for (const system of [...current, ...incoming]) {
    if (system?.id && !byId.has(system.id)) {
      byId.set(system.id, system);
    }
  }
  return [...byId.values()];
};

const withSystems = (row: UpcomingChangeRow, systems: UpcomingSystemDetail[]): UpcomingChangeRow => ({
  ...row,
  details: {
    ...row.details,
    potentiallyAffectedSystemsDetail: systems,
    potentiallyAffectedSystemsCount: systems.length,
    potentiallyAffectedSystems: systems.map((system) => system.id),
  },
});

/**
 * Load upcoming changes for these host UUIDs in batches.
 * Returns one merged list in the same shape as a single all=true upcoming call.
 * An empty id list still requests the catalog, with no affected systems.
 */
export const loadAllUpcomingChanges = async (
  hostIds: string[],
  client: UpcomingChangesClient,
  onProgress?: (progress: UpcomingLoadProgress) => void,
  signal?: AbortSignal
): Promise<{ meta: { count: number; total: number }; data: UpcomingChangeRow[] }> => {
  if (signal?.aborted) {
    throw abortedError(signal);
  }

  const pending = [...hostIds];
  const total = pending.length;
  const merged = new Map<string, UpcomingChangeRow>();
  const order: string[] = [];
  let requested = 0;
  let failure: unknown;

  const mergeRows = (rows: UpcomingChangeRow[]) => {
    for (const row of rows) {
      const key = itemKey(row);
      const incoming = row.details?.potentiallyAffectedSystemsDetail ?? [];
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, withSystems(row, unionSystems([], incoming)));
        order.push(key);
        continue;
      }

      const systems = unionSystems(existing.details?.potentiallyAffectedSystemsDetail ?? [], incoming);
      merged.set(key, withSystems(existing, systems));
    }
  };

  const stopIfAborted = (error?: unknown) => {
    if (!signal?.aborted && !isAbortError(error)) {
      return false;
    }
    failure = failure ?? (isAbortError(error) ? error : abortedError(signal));
    pending.length = 0;
    return true;
  };

  const postBatch = async (batch: string[]) => {
    let failedRequests = 0;
    while (!failure) {
      if (stopIfAborted()) {
        return;
      }
      try {
        const response = await client.getUpcomingChangesForHosts(batch, signal);
        if (failure || stopIfAborted()) {
          return;
        }
        mergeRows(Array.isArray(response?.data) ? response.data : []);
        return;
      } catch (error) {
        if (stopIfAborted(error)) {
          return;
        }
        failedRequests += 1;
        if (!isTransientFailure(error) || failedRequests >= MAX_FAILED_REQUESTS) {
          failure = failure ?? error;
          pending.length = 0;
          return;
        }
        try {
          await waitBeforeRetry(signal);
        } catch (waitError) {
          failure = failure ?? waitError;
          pending.length = 0;
          return;
        }
      }
    }
  };

  if (total === 0) {
    onProgress?.({ requested: 0, total: 0 });
    await postBatch([]);
  } else {
    const worker = async () => {
      while (!failure) {
        if (stopIfAborted()) {
          return;
        }
        const batch = pending.splice(0, BATCH_SIZE);
        if (batch.length === 0) {
          return;
        }

        requested += batch.length;
        onProgress?.({ requested, total });

        await postBatch(batch);
      }
    };

    const workerCount = Math.min(MAX_CONCURRENT_REQUESTS, Math.ceil(total / BATCH_SIZE));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
  }

  if (failure) {
    throw failure;
  }

  const data = order.map((key) => merged.get(key) as UpcomingChangeRow);
  return { meta: { count: data.length, total: data.length }, data };
};
