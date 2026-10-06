import { SystemLifecycleChanges } from '../types/SystemLifecycleChanges';
import { SystemsDetail } from '../types/SystemsDetail';
import { isTransientFailure, waitBeforeRetry } from './batchRetry';

/** Hosts per RHEL request. RHEL responses are smaller, so this can sit at the API maximum of 10,000. */
export const BATCH_SIZE = 10000;

/** In-flight RHEL lifecycle requests. One is enough because each batch is large. */
export const MAX_CONCURRENT_REQUESTS = 1;

/** Failed POSTs allowed for one batch. The next batch starts again at zero. */
export const MAX_FAILED_REQUESTS = 3;

export type RhelLoadProgress = {
  requested: number;
  total: number;
};

export type RelevantRhelRow = Omit<SystemLifecycleChanges, 'minor' | 'start_date' | 'end_date'> & {
  minor: number | null;
  start_date: string | null;
  end_date: string | null;
  systems_detail: SystemsDetail[];
};

export interface RelevantRhelClient {
  getRelevantLifecycleSystemsForHosts: (hostIds: string[]) => Promise<{ data?: RelevantRhelRow[] }>;
}

const installedKey = (row: Pick<RelevantRhelRow, 'name' | 'major' | 'minor' | 'lifecycle_type'>) =>
  [row.name, row.major, row.minor ?? '', row.lifecycle_type].join('\0');

const versionKey = (row: Pick<RelevantRhelRow, 'major' | 'minor'>) =>
  row.minor == null ? String(row.major) : `${row.major}.${row.minor}`;

const unionSystems = (current: SystemsDetail[], incoming: SystemsDetail[]): SystemsDetail[] => {
  const byId = new Map<string, SystemsDetail>();
  for (const system of [...current, ...incoming]) {
    if (system?.id && !byId.has(system.id)) {
      byId.set(system.id, system);
    }
  }
  return [...byId.values()];
};

const compareDescending = (
  left: string | number | null | undefined,
  right: string | number | null | undefined
) => {
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
    return rankedRight - rankedLeft;
  }
  if (typeof rankedLeft === 'number') {
    return 1;
  }
  if (typeof rankedRight === 'number') {
    return -1;
  }
  if (rankedLeft < rankedRight) {
    return 1;
  }
  if (rankedLeft > rankedRight) {
    return -1;
  }
  return 0;
};

const sortSystems = (rows: RelevantRhelRow[]) =>
  rows.sort(
    (left, right) =>
      compareDescending(left.lifecycle_type, right.lifecycle_type) ||
      compareDescending(left.major, right.major) ||
      compareDescending(left.minor, right.minor)
  );

/**
 * Load RHEL lifecycle rows for these host UUIDs in batches.
 * Returns one merged list in the same shape as the single relevant RHEL call.
 */
export const loadRelevantLifecycleSystems = async (
  hostIds: string[],
  client: RelevantRhelClient,
  onProgress?: (progress: RhelLoadProgress) => void
): Promise<{ data: SystemLifecycleChanges[] }> => {
  const pending = [...hostIds];
  const total = pending.length;

  if (total === 0) {
    return { data: [] };
  }

  const waiting = new Set<string>();
  const installed = new Map<string, RelevantRhelRow>();
  const installedVersions = new Set<string>();
  const related = new Map<string, RelevantRhelRow>();
  let requested = 0;
  let failure: unknown;

  const mergeRows = (rows: RelevantRhelRow[]) => {
    for (const row of rows) {
      const version = versionKey(row);
      if (row.related) {
        if (!installedVersions.has(version) && !related.has(version)) {
          related.set(version, {
            ...row,
            related: true,
            count: typeof row.count === 'number' ? row.count : 0,
            systems_detail: unionSystems([], row.systems_detail ?? []),
          });
        }
        continue;
      }

      installedVersions.add(version);
      related.delete(version);

      const key = installedKey(row);
      const existing = installed.get(key);
      if (!existing) {
        installed.set(key, {
          ...row,
          related: false,
          count: typeof row.count === 'number' ? row.count : 0,
          systems_detail: unionSystems([], row.systems_detail ?? []),
        });
        continue;
      }

      existing.systems_detail = unionSystems(existing.systems_detail ?? [], row.systems_detail ?? []);
      existing.count = (existing.count ?? 0) + (typeof row.count === 'number' ? row.count : 0);
    }
  };

  const postBatch = async (batch: string[]) => {
    let failedRequests = 0;
    while (!failure) {
      try {
        const response = await client.getRelevantLifecycleSystemsForHosts(batch);
        if (failure) {
          return;
        }
        mergeRows(Array.isArray(response?.data) ? response.data : []);
        return;
      } catch (error) {
        failedRequests += 1;
        if (!isTransientFailure(error) || failedRequests >= MAX_FAILED_REQUESTS) {
          failure = failure ?? error;
          pending.length = 0;
          return;
        }
        await waitBeforeRetry();
      }
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
        await postBatch(batch);
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

  const relatedOnly = [...related.values()].filter((row) => !installedVersions.has(versionKey(row)));
  return { data: sortSystems([...installed.values(), ...relatedOnly]) as SystemLifecycleChanges[] };
};
