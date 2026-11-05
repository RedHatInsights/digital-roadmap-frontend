import './Lifecycle.scss';
import React, { lazy, useEffect, useRef, useState } from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import {
  Alert,
  AlertActionCloseButton,
  Bullseye,
  Button,
  Card,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Skeleton,
  Spinner,
  Stack,
} from '@patternfly/react-core';
import { ErrorObject } from '../../types/ErrorObject';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import {
  getAccessibleHostUuids,
  getAllLifecycleAppstreams,
  getAllLifecycleSystems,
  getRelevantLifecycleAppstreams,
  getRelevantLifecycleSystems,
} from '../../api';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
import { useSearchParams } from 'react-router-dom';
import { isAbortError } from '../../utils/batchRetry';
import { buildExportData, buildURL, checkValidityOfQueryParam } from '../../utils/utils';
import {
  DEFAULT_CHART_SORTBY_VALUE,
  DEFAULT_DROPDOWN_VALUE,
  RHEL_10_STREAMS_DROPDOWN_VALUE,
  RHEL_8_STREAMS_DROPDOWN_VALUE,
  RHEL_SYSTEMS_DROPDOWN_VALUE,
  filterChartDataByName,
  filterChartDataByRelease,
  filterChartDataByReleaseDate,
  filterChartDataByRetirementDate,
  filterChartDataBySystems,
} from './filteringUtils';
const LifecycleChart = lazy(() => import('../../Components/LifecycleChart/LifecycleChart'));
const LifecycleChartSystem = lazy(() => import('../../Components/LifecycleChartSystem/LifecycleChartSystem'));
const LifecycleFilters = lazy(() => import('../../Components/LifecycleFilters/LifecycleFilters'));
const LifecycleTable = lazy(() => import('../../Components/LifecycleTable/LifecycleTable'));
import { exportData as exportToFile } from '../../utils/export';
import ErrorState from '@patternfly/react-component-groups/dist/dynamic/ErrorState';
import { getNewName } from '../../utils/utils';
import { ExtendedFilter } from '../../types/Filter';
import BatchLoadAlert from '../BatchLoadAlert/BatchLoadAlert';
import { useBatchLoad } from '../../hooks/useBatchLoad';

const PREPARING_DESCRIPTION =
  'Large environments can take a few minutes to calculate. Keep this tab open to watch progress.';
const READY_ALERT_TITLE = 'Relevant lifecycle data is ready.';
const WORKSPACE_FILTERING_MESSAGE = 'Error: Workspace filtering is not yet implemented';

type DatasetStatus = 'loading' | 'ready' | 'error';
type RelevantSurface = 'rhel' | 'app';

type LifecycleCache = {
  allSystems: SystemLifecycleChanges[];
  allApps: Stream[];
  installedSystems: SystemLifecycleChanges[];
  relatedSystems: SystemLifecycleChanges[];
  installedApps: Stream[];
  relatedApps: Stream[];
};

const emptyCache = (): LifecycleCache => ({
  allSystems: [],
  allApps: [],
  installedSystems: [],
  relatedSystems: [],
  installedApps: [],
  relatedApps: [],
});

const toErrorObject = (error: unknown): ErrorObject => {
  if (error instanceof Error) {
    const withStatus = error as Error & { status_code?: number };
    return { message: withStatus.message, status_code: withStatus.status_code };
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const candidate = error as { message?: unknown; status_code?: unknown };
    if (typeof candidate.message === 'string') {
      return {
        message: candidate.message,
        status_code: typeof candidate.status_code === 'number' ? candidate.status_code : undefined,
      };
    }
  }
  return { message: String(error) };
};

const toErrorObjectOrUndefined = (error: unknown): ErrorObject | undefined =>
  error === undefined ? undefined : toErrorObject(error);

const isWorkspaceFilteringError = (error: ErrorObject | undefined) =>
  error?.message === WORKSPACE_FILTERING_MESSAGE;

const LifecycleContentSkeleton = () => (
  <Stack hasGutter className="drf-lifecycle__content-skeleton">
    {['42%', '58%', '36%', '70%', '48%', '84%'].map((width) => (
      <Skeleton key={width} width={width} height="16px" screenreaderText="Loading lifecycle chart" />
    ))}
  </Stack>
);

// Define DEFAULT_FILTERS with the ExtendedFilter type
const DEFAULT_FILTERS: ExtendedFilter = {
  name: '',
  chartSortBy: DEFAULT_CHART_SORTBY_VALUE,
  lifecycleDropdown: DEFAULT_DROPDOWN_VALUE,
  viewFilter: 'installed-only',
};

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {
  const loadAbortRef = useRef(new AbortController());
  const cacheRef = useRef<LifecycleCache>(emptyCache());
  const rhelReadyRef = useRef(false);
  const appReadyRef = useRef(false);
  const allSystemsReadyRef = useRef(false);
  const allAppsReadyRef = useRef(false);
  const dismissedReadyRef = useRef(new Set<string>());
  const [systemLifecycleChanges, setSystemLifecycleChanges] = useState<SystemLifecycleChanges[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const rhelBatch = useBatchLoad<SystemLifecycleChanges[]>('loading');
  const appBatch = useBatchLoad<Stream[]>('loading');
  const [allSystemsStatus, setAllSystemsStatus] = useState<DatasetStatus>('loading');
  const [allAppsStatus, setAllAppsStatus] = useState<DatasetStatus>('loading');
  const [allSystemsError, setAllSystemsError] = useState<ErrorObject>();
  const [allAppsError, setAllAppsError] = useState<ErrorObject>();
  const [readyAlertSurfaces, setReadyAlertSurfaces] = useState<Set<RelevantSurface>>(() => new Set());
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject>();
  const [noDataAvailable, setNoDataAvailable] = useState<boolean>(false);
  const [filteredChartData, setFilteredChartData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [appLifecycleChanges, setAppLifecycleChanges] = useState<Stream[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  // drop down menu
  const [lifecycleDropdownValue, setLifecycleDropdownValue] = React.useState<string>(DEFAULT_DROPDOWN_VALUE);
  const [chartSortByValue, setChartSortByValue] = React.useState<string>(DEFAULT_CHART_SORTBY_VALUE);
  const [chartDirection, setChartDirection] = React.useState<string>('asc');
  const [filters, setFilters] = useState<ExtendedFilter>(DEFAULT_FILTERS);
  // Add state for view filter (all, installed-only, installed-and-related)
  const [selectedViewFilter, setSelectedViewFilter] = useState<string>('installed-only');
  const viewRef = useRef(selectedViewFilter);
  const dropdownRef = useRef(lifecycleDropdownValue);
  const chartSortRef = useRef(chartSortByValue);
  const chartDirectionRef = useRef(chartDirection);
  viewRef.current = selectedViewFilter;
  dropdownRef.current = lifecycleDropdownValue;
  chartSortRef.current = chartSortByValue;
  chartDirectionRef.current = chartDirection;

  const [filterField, setFilterField] = useState<'Name' | 'Version' | 'Status'>('Name');
  const [rhelVersionOptions, setRhelVersionOptions] = useState<string[]>([]);
  const [rhelVersionFilter, setRhelVersionFilter] = useState<string[]>([]);

  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [isSwitchingView, setIsSwitchingView] = useState(false);
  const [appsSwitchKey, setAppsSwitchKey] = useState(0);

  const [disableInstalledOnly, setDisableInstalledOnly] = useState<boolean>(false);

  const isAppStream = (v: string) =>
    v === DEFAULT_DROPDOWN_VALUE || v === RHEL_8_STREAMS_DROPDOWN_VALUE || v === RHEL_10_STREAMS_DROPDOWN_VALUE;

  const updateFilters = React.useCallback(
    (patch: Partial<ExtendedFilter> | ((prev: ExtendedFilter) => Partial<ExtendedFilter>)) => {
      setFilters((prev) => {
        const partial = typeof patch === 'function' ? patch(prev) : patch;
        const next = { ...prev, ...partial };
        setSearchParams(buildURL(next));
        return next;
      });
    },
    [setSearchParams]
  );

  const getDefaultOrder = (sortBy: string): 'asc' | 'desc' => {
    switch (sortBy) {
      case 'Retirement date':
        return 'asc';
      case 'Systems':
        return 'desc';
      case 'Name':
        return 'asc';
      case 'Release version':
        return 'desc';
      case 'Release date':
        return 'desc';
      default:
        return 'asc';
    }
  };

  // Helper function to generate the RHEL version filter array
  const computeRhelVersionOptions = (systems: SystemLifecycleChanges[]): string[] => {
    const majors = new Set<number>();
    systems.forEach((s) => {
      if (typeof s.major === 'number') majors.add(s.major);
    });
    return Array.from(majors)
      .sort((a, b) => a - b)
      .map((m) => `RHEL ${m}`);
  };

  // Unified filter application to ensure consistent filtering
  const applyAllActiveFilters = (
    data: Stream[] | SystemLifecycleChanges[],
    dropdownValue: string,
    nameFilterValue: string,
    field: 'Name' | 'Version' | 'Status' = filterField,
    versions: string[] = rhelVersionFilter,
    statuses: string[] = statusFilter
  ) => {
    let filteredData = data;

    if (
      [DEFAULT_DROPDOWN_VALUE, RHEL_8_STREAMS_DROPDOWN_VALUE, RHEL_10_STREAMS_DROPDOWN_VALUE].includes(
        dropdownValue
      )
    ) {
      let result = data as Stream[];

      if (nameFilterValue) {
        result = result.filter((datum) =>
          `${datum.display_name.toLowerCase()}`.includes(nameFilterValue.toLowerCase())
        );
      }

      if (Array.isArray(statuses) && statuses.length > 0) {
        result = result.filter((datum) => statuses.includes(datum.support_status));
      }

      filteredData = result;
    } else if (dropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      let result = data as SystemLifecycleChanges[];

      if (Array.isArray(versions) && versions.length > 0) {
        result = result.filter((datum) => versions.includes(`RHEL ${datum.major}`));
      }

      if (Array.isArray(statuses) && statuses.length > 0) {
        result = result.filter((datum) => statuses.includes(datum.support_status));
      }

      if (nameFilterValue) {
        const keyword = nameFilterValue.toLowerCase();
        result = result.filter((datum) => {
          const product = `${datum.name.toLowerCase()} ${datum.major}.${datum.minor}`;
          return product.includes(nameFilterValue.toLowerCase());
        });
      }

      filteredData = result;
    }

    setFilteredTableData(filteredData);

    const chartData = filterChartData(filteredData, chartSortByValue, dropdownValue, chartDirection);
    setFilteredChartData(chartData);

    return filteredData;
  };

  // todo
  // use one sort by value with asc/desc. Asc/desc is set in the handler of the sort.
  // useefect depending on the asc/desc change which will change the data

  const setOrderingStates = (value: string, order?: string) => {
    setChartSortByValue(value);
    if (order) {
      setChartDirection(order);
    } else {
      setChartDirection(getDefaultOrder(value));
    }
  };

  React.useEffect(() => {
    updateSortedData(chartSortByValue, chartDirection);
  }, [chartSortByValue, chartDirection]);

  const updateSortedData = (value: string, order?: string) => {
    const effectiveOrder = order ?? chartDirection ?? getDefaultOrder(value);
    updateFilters({ chartSortBy: value, chartOrder: effectiveOrder });
    const baseData =
      lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE ? systemLifecycleChanges : appLifecycleChanges;

    setFilteredChartData(filterChartData(baseData, value, lifecycleDropdownValue, effectiveOrder));
  };

  const restartLoad = () => {
    setIsRetrying(true);
    loadAbortRef.current.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;
    dismissedReadyRef.current.clear();
    void initializeData(controller.signal, { preserveAll: true });
  };

  const onLifecycleDropdownSelect = (value: string) => {
    const isCrossDomainSwitch = isAppStream(dropdownRef.current) !== isAppStream(value);
    if (isCrossDomainSwitch) {
      setNameFilter('');
      setRhelVersionFilter([]);
      setStatusFilter([]);
      setFilterField('Name');
      updateFilters({ name: '', versions: [], statuses: [] });
      setAppsSwitchKey((key) => key + 1);
    }

    dropdownRef.current = value;
    setLifecycleDropdownValue(value);
    updateFilters({ lifecycleDropdown: value });
    setIsSwitchingView(true);
    syncDisplayedView(value, viewRef.current);
    queueMicrotask(() => setIsSwitchingView(false));
  };

  const publishDataset = (dropdown: string, view: string) => {
    const cache = cacheRef.current;
    const systems =
      view === 'all'
        ? cache.allSystems
        : view === 'installed-only'
        ? cache.installedSystems
        : cache.relatedSystems;
    const apps =
      view === 'all' ? cache.allApps : view === 'installed-only' ? cache.installedApps : cache.relatedApps;

    if (dropdown === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      const updated = updateLifecycleData(systems);
      setSystemLifecycleChanges(updated);
      setFilteredTableData(updated);
      setFilteredChartData(filterChartData(updated, chartSortRef.current, dropdown, chartDirectionRef.current));
      return;
    }

    const streams = filterAppDataByDropdown([...apps], dropdown);
    setAppLifecycleChanges(streams);
    setFilteredTableData(streams);
    setFilteredChartData(filterChartData(streams, chartSortRef.current, dropdown, chartDirectionRef.current));
  };

  // Only successfully loaded Relevant data can disable a view or trigger an empty-data fallback.
  const syncDisplayedView = (dropdown: string, requestedView: string) => {
    const cache = cacheRef.current;
    const systems = dropdown === RHEL_SYSTEMS_DROPDOWN_VALUE;
    const relevantReady = systems ? rhelReadyRef.current : appReadyRef.current;
    const installedCount = systems
      ? getSystemsCountForDropdown(cache.installedSystems)
      : getAppCountForDropdown(cache.installedApps, dropdown);
    const relatedCount = systems
      ? getSystemsCountForDropdown(cache.relatedSystems)
      : getAppCountForDropdown(cache.relatedApps, dropdown);

    setNoDataAvailable(relevantReady && relatedCount === 0);
    setDisableInstalledOnly(relevantReady && installedCount === 0 && relatedCount > 0);

    let view = requestedView;
    if (relevantReady && view !== 'all') {
      if (relatedCount === 0) {
        view = 'all';
      } else if (view === 'installed-only' && installedCount === 0) {
        view = 'installed-and-related';
      }
    }
    if (view !== requestedView) {
      viewRef.current = view;
      setSelectedViewFilter(view);
      updateFilters({ viewFilter: view });
    }

    const catalogReady = systems ? allSystemsReadyRef.current : allAppsReadyRef.current;
    const ready = view === 'all' ? catalogReady : relevantReady;
    if (ready) {
      publishDataset(dropdown, view);
    } else {
      // Never carry rows from a different view through a failed or restarted load.
      if (systems) setSystemLifecycleChanges([]);
      else setAppLifecycleChanges([]);
      setFilteredTableData([]);
      setFilteredChartData([]);
    }
  };

  const rememberRelevantSystems = (rows: SystemLifecycleChanges[]) => {
    const installed = rows.filter((datum) => datum.related === false);
    cacheRef.current.relatedSystems = rows;
    cacheRef.current.installedSystems = installed;
  };

  const rememberRelevantApps = (rows: Stream[]) => {
    const installed = rows.filter((datum) => datum.related === false);
    cacheRef.current.relatedApps = rows;
    cacheRef.current.installedApps = installed;
  };

  const noteReadyAlert = (surface: RelevantSurface) => {
    const activeSurface = dropdownRef.current === RHEL_SYSTEMS_DROPDOWN_VALUE ? 'rhel' : 'app';
    if (viewRef.current === 'all' && activeSurface === surface && !dismissedReadyRef.current.has(surface)) {
      setReadyAlertSurfaces((current) => new Set(current).add(surface));
    }
  };

  const dismissReadyAlert = (surface: RelevantSurface) => {
    dismissedReadyRef.current.add(surface);
    setReadyAlertSurfaces((current) => {
      const next = new Set(current);
      next.delete(surface);
      return next;
    });
  };

  const markSurfaceError = (surface: 'rhel' | 'app' | 'all-systems' | 'all-apps', error: unknown) => {
    if (isAbortError(error)) {
      return;
    }
    const object = toErrorObject(error);
    if (surface === 'all-systems') {
      allSystemsReadyRef.current = false;
      setAllSystemsStatus('error');
      setAllSystemsError(object);
    } else if (surface === 'all-apps') {
      allAppsReadyRef.current = false;
      setAllAppsStatus('error');
      setAllAppsError(object);
    }
    if (isWorkspaceFilteringError(object)) {
      setError(object);
    }
  };

  const clearPageErrorUnlessLocked = () => {
    setError((current) => (isWorkspaceFilteringError(current) ? current : undefined));
  };

  // First data fetch. Later calls are Retry / Retry all.
  const initializeData = async (
    signal: AbortSignal = loadAbortRef.current.signal,
    options?: { preserveAll?: boolean }
  ) => {
    const preserveAll = options?.preserveAll ?? false;
    setIsLoading(true);
    setReadyAlertSurfaces(new Set());
    setNoDataAvailable(false);
    rhelReadyRef.current = false;
    appReadyRef.current = false;
    rhelBatch.reset();
    appBatch.reset();
    clearPageErrorUnlessLocked();
    if (!preserveAll) {
      cacheRef.current = emptyCache();
    }
    if (!preserveAll || !allSystemsReadyRef.current) {
      allSystemsReadyRef.current = false;
      setAllSystemsStatus('loading');
      setAllSystemsError(undefined);
    }
    if (!preserveAll || !allAppsReadyRef.current) {
      allAppsReadyRef.current = false;
      setAllAppsStatus('loading');
      setAllAppsError(undefined);
    }
    rememberRelevantSystems([]);
    rememberRelevantApps([]);
    syncDisplayedView(dropdownRef.current, viewRef.current);

    const allSystemsDone =
      preserveAll && allSystemsReadyRef.current
        ? Promise.resolve(cacheRef.current.allSystems)
        : getAllLifecycleSystems(signal)
            .then((response) => {
              if (signal.aborted) {
                return [] as SystemLifecycleChanges[];
              }
              const allSystems = (response.data || []).filter(
                (datum: SystemLifecycleChanges) => datum.minor !== null
              );
              cacheRef.current.allSystems = allSystems;
              allSystemsReadyRef.current = true;
              setAllSystemsStatus('ready');
              setAllSystemsError(undefined);
              setRhelVersionOptions(computeRhelVersionOptions(allSystems));
              if (viewRef.current === 'all' && dropdownRef.current === RHEL_SYSTEMS_DROPDOWN_VALUE) {
                syncDisplayedView(RHEL_SYSTEMS_DROPDOWN_VALUE, 'all');
              }
              clearPageErrorUnlessLocked();
              return allSystems;
            })
            .catch((error) => {
              if (!signal.aborted) {
                markSurfaceError('all-systems', error);
              }
              throw error;
            });

    const allAppsDone =
      preserveAll && allAppsReadyRef.current
        ? Promise.resolve(cacheRef.current.allApps)
        : getAllLifecycleAppstreams(signal)
            .then((response) => {
              if (signal.aborted) {
                return [] as Stream[];
              }
              const allApps = response.data || [];
              cacheRef.current.allApps = allApps;
              allAppsReadyRef.current = true;
              setAllAppsStatus('ready');
              setAllAppsError(undefined);
              if (viewRef.current === 'all' && dropdownRef.current !== RHEL_SYSTEMS_DROPDOWN_VALUE) {
                syncDisplayedView(dropdownRef.current, 'all');
              }
              clearPageErrorUnlessLocked();
              return allApps;
            })
            .catch((error) => {
              if (!signal.aborted) {
                markSurfaceError('all-apps', error);
              }
              throw error;
            });

    const catalogResults = Promise.allSettled([allSystemsDone, allAppsDone]);

    try {
      const uuidResponse = await getAccessibleHostUuids(signal);
      if (signal.aborted) {
        return;
      }
      const hostIds = uuidResponse.data ?? [];

      if (hostIds.length === 0) {
        rememberRelevantSystems([]);
        rememberRelevantApps([]);
        rhelBatch.complete([]);
        appBatch.complete([]);
        setIsRetrying(false);
        rhelReadyRef.current = true;
        appReadyRef.current = true;
        noteReadyAlert('rhel');
        noteReadyAlert('app');
        syncDisplayedView(dropdownRef.current, viewRef.current);
      } else {
        setIsRetrying(false);

        const rhelDone = rhelBatch
          .start(
            (onProgress, onSlow, batchSignal) =>
              getRelevantLifecycleSystems(hostIds, onProgress, batchSignal, onSlow).then(
                (response) => response.data || []
              ),
            signal,
            hostIds.length
          )
          .then((rows) => {
            if (signal.aborted) {
              return [] as SystemLifecycleChanges[];
            }
            rememberRelevantSystems(rows);
            if (!allSystemsReadyRef.current) {
              setRhelVersionOptions(computeRhelVersionOptions(rows));
            }
            rhelReadyRef.current = true;
            noteReadyAlert('rhel');
            if (dropdownRef.current === RHEL_SYSTEMS_DROPDOWN_VALUE) {
              syncDisplayedView(dropdownRef.current, viewRef.current);
            }
            return rows;
          });

        const appDone = appBatch
          .start(
            (onProgress, onSlow, batchSignal) =>
              getRelevantLifecycleAppstreams(hostIds, onProgress, batchSignal, onSlow).then(
                (response) => response.data || []
              ),
            signal,
            hostIds.length
          )
          .then((rows) => {
            if (signal.aborted) {
              return [] as Stream[];
            }
            rememberRelevantApps(rows);
            appReadyRef.current = true;
            noteReadyAlert('app');
            if (dropdownRef.current !== RHEL_SYSTEMS_DROPDOWN_VALUE) {
              syncDisplayedView(dropdownRef.current, viewRef.current);
            }
            return rows;
          });

        await Promise.allSettled([rhelDone, appDone]);
      }

      await catalogResults;
    } catch (error: any) {
      if (signal.aborted || isAbortError(error)) {
        return;
      }
      console.error('Error fetching lifecycle changes:', error);
      const object = toErrorObject(error);
      rhelBatch.fail(object);
      appBatch.fail(object);
      markSurfaceError('rhel', error);
      markSurfaceError('app', error);
      setError(object);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // Count "systems" by summing the `count` field (not by number of rows).
  // If the backend returns rows with count=0 (or missing), we treat that as "no data" for display purposes.
  const getAppCountForDropdown = (data: Stream[], dropdownValue: string): number =>
    filterAppDataByDropdown(data, dropdownValue).reduce((sum, item) => {
      const c = typeof item.count === 'number' ? item.count : 0;
      return sum + (Number.isFinite(c) ? c : 0);
    }, 0);

  const getSystemsCountForDropdown = (data: SystemLifecycleChanges[]): number =>
    data.reduce((sum, item) => {
      const c = typeof item.count === 'number' ? item.count : 0;
      return sum + (Number.isFinite(c) ? c : 0);
    }, 0);

  const handleViewFilterChange = (filter: string) => {
    viewRef.current = filter;
    setSelectedViewFilter(filter);
    updateFilters({ viewFilter: filter });
    setIsSwitchingView(true);
    syncDisplayedView(dropdownRef.current, filter);
    queueMicrotask(() => setIsSwitchingView(false));
  };

  const updateLifecycleData = (data: SystemLifecycleChanges[]) => {
    // Create a new array with new objects to avoid modifying the original data
    return data.map((datum) => {
      // Create a new object instead of modifying the original
      return {
        ...datum,
        name: getNewName(datum.name, datum.major, datum.minor, datum.lifecycle_type),
      };
    });
  };

  const nameQueryParam = searchParams.get('name');
  const dropdownQueryParam = searchParams.get('lifecycleDropdown');
  const sortByParam = searchParams.get('chartSortBy');
  const orderParam = searchParams.get('chartOrder');
  const viewFilterParam = searchParams.get('viewFilter');
  const versionsParam = searchParams.get('versions');
  const statusesParam = searchParams.get('statuses');

  useEffect(() => {
    const controller = new AbortController();
    loadAbortRef.current = controller;

    // Get view filter from URL params
    let initialViewFilter = 'installed-only';

    if (
      viewFilterParam &&
      (viewFilterParam === 'all' ||
        viewFilterParam === 'installed-only' ||
        viewFilterParam === 'installed-and-related')
    ) {
      initialViewFilter = viewFilterParam;
      setSelectedViewFilter(viewFilterParam);
    }

    // Set the initial filter state from URL params
    const initialFilters = structuredClone(DEFAULT_FILTERS) as ExtendedFilter;
    if (nameQueryParam) initialFilters.name = nameQueryParam;
    if (
      dropdownQueryParam &&
      [
        DEFAULT_DROPDOWN_VALUE,
        RHEL_8_STREAMS_DROPDOWN_VALUE,
        RHEL_10_STREAMS_DROPDOWN_VALUE,
        RHEL_SYSTEMS_DROPDOWN_VALUE,
      ].includes(dropdownQueryParam)
    ) {
      initialFilters.lifecycleDropdown = dropdownQueryParam;
    }
    if (sortByParam && checkValidityOfQueryParam('sortByQueryParam', sortByParam)) {
      initialFilters.chartSortBy = sortByParam;
    }
    if (orderParam) initialFilters.chartOrder = orderParam;
    else if (sortByParam) initialFilters.chartOrder = getDefaultOrder(sortByParam);
    else initialFilters.chartOrder = getDefaultOrder(DEFAULT_CHART_SORTBY_VALUE);

    if (versionsParam) {
      const raw = decodeURIComponent(versionsParam)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      initialFilters.versions = raw;
      setRhelVersionFilter(raw);
    }

    if (statusesParam) {
      const raw = decodeURIComponent(statusesParam)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      initialFilters.statuses = raw;
      setStatusFilter(raw);
    }

    initialFilters.viewFilter = initialViewFilter;

    // Set filterField based on which filters are present in URL (status takes precedence)
    if (statusesParam && decodeURIComponent(statusesParam).trim()) {
      setFilterField('Status');
    } else if (versionsParam && decodeURIComponent(versionsParam).trim()) {
      setFilterField('Version');
    }

    const initialDropdown = initialFilters.lifecycleDropdown ?? DEFAULT_DROPDOWN_VALUE;
    dropdownRef.current = initialDropdown;
    viewRef.current = initialViewFilter;
    setNameFilter(initialFilters.name ?? '');
    setLifecycleDropdownValue(initialDropdown);
    setChartSortByValue(initialFilters.chartSortBy ?? DEFAULT_CHART_SORTBY_VALUE);
    setChartDirection(initialFilters.chartOrder as 'asc' | 'desc');

    updateFilters(() => initialFilters);

    void initializeData(controller.signal);
    return () => loadAbortRef.current.abort();
  }, []);

  useEffect(() => {
    if (allSystemsStatus !== 'ready') return;
    const valid = rhelVersionFilter.filter((version) => rhelVersionOptions.includes(version));
    if (valid.length !== rhelVersionFilter.length) {
      setRhelVersionFilter(valid);
      updateFilters({ versions: valid });
    }
  }, [allSystemsStatus, rhelVersionOptions, rhelVersionFilter, updateFilters]);

  useEffect(() => {
    const dataSource =
      lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE ? systemLifecycleChanges : appLifecycleChanges;

    applyAllActiveFilters(
      dataSource,
      lifecycleDropdownValue,
      nameFilter,
      filterField,
      rhelVersionFilter,
      statusFilter
    );
  }, [
    nameFilter,
    rhelVersionFilter,
    statusFilter,
    filterField,
    lifecycleDropdownValue,
    systemLifecycleChanges,
    appLifecycleChanges,
    chartSortByValue,
    chartDirection,
  ]);

  // Update resetDataFiltering to use the properly filtered app data
  const resetDataFiltering = () => {
    let currentData: Stream[] | SystemLifecycleChanges[] = [];
    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE ||
      lifecycleDropdownValue === RHEL_10_STREAMS_DROPDOWN_VALUE
    ) {
      currentData = appLifecycleChanges;
    } else if (lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      currentData = systemLifecycleChanges;
    } else {
      // Fallback to app lifecycle changes if no valid dropdown value
      currentData = appLifecycleChanges;
    }

    setFilteredTableData(currentData);
    const chartData = filterChartData(currentData, chartSortByValue, lifecycleDropdownValue, chartDirection);
    setFilteredChartData(chartData);
  };

  const filterChartData = (
    data: Stream[] | SystemLifecycleChanges[],
    sortBy: string,
    dropdownValue: string,
    order?: string
  ): Stream[] | SystemLifecycleChanges[] => {
    if (!data || data.length === 0) {
      return [];
    }

    switch (sortBy) {
      case 'Name':
        return filterChartDataByName(data, dropdownValue, order);
      case 'Release version':
        return filterChartDataByRelease(data, dropdownValue, order);
      case 'Release date':
        return filterChartDataByReleaseDate(data, dropdownValue, order);
      case 'Retirement date':
        return filterChartDataByRetirementDate(data, dropdownValue, order);
      case 'Systems':
        return filterChartDataBySystems(data, dropdownValue, order);
      default:
        return filterChartDataByRetirementDate(data, dropdownValue, order);
    }
  };

  // Use the unified filter function
  const doFilter = (name: string) => {
    if (name !== '') {
      const dataSource =
        lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE ? systemLifecycleChanges : appLifecycleChanges;
      const isSystemsDropdown = lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE;
      applyAllActiveFilters(
        dataSource,
        lifecycleDropdownValue,
        name,
        filterField,
        isSystemsDropdown ? rhelVersionFilter : [],
        statusFilter
      );
    } else {
      resetDataFiltering();
    }
  };

  const filterData = (name: string) => {
    if (name !== '') {
      doFilter(name);
    } else {
      const dataSource =
        lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE ? systemLifecycleChanges : appLifecycleChanges;
      const isSystemsDropdown = lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE;
      applyAllActiveFilters(
        dataSource,
        lifecycleDropdownValue,
        '',
        filterField,
        isSystemsDropdown ? rhelVersionFilter : [],
        statusFilter
      );
    }
  };

  const onNameFilterChange = (name: string) => {
    setNameFilter(name);
    filterData(name);
    updateFilters({ name });
  };

  // Update resetFilters to use cached data
  const resetFilters = () => {
    setNameFilter('');
    setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
    setChartSortByValue(DEFAULT_CHART_SORTBY_VALUE);
    setFilters(DEFAULT_FILTERS);
    setSelectedViewFilter('installed-only');
    setFilterField('Name');
    setRhelVersionFilter([]);
    setStatusFilter([]);
    setSearchParams(buildURL(DEFAULT_FILTERS));

    dropdownRef.current = DEFAULT_DROPDOWN_VALUE;
    viewRef.current = 'installed-only';
    setChartDirection(getDefaultOrder(DEFAULT_CHART_SORTBY_VALUE));
    setIsSwitchingView(true);
    syncDisplayedView(DEFAULT_DROPDOWN_VALUE, 'installed-only');
    queueMicrotask(() => setIsSwitchingView(false));
  };

  // Helper function to filter app data based on dropdown value
  const filterAppDataByDropdown = (data: Stream[], dropdownValue: string): Stream[] => {
    if (dropdownValue === RHEL_10_STREAMS_DROPDOWN_VALUE) {
      return data.filter((stream) => stream.os_major === 10);
    } else if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      return data.filter((stream) => stream.os_major === 9);
    } else if (dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
      return data.filter((stream) => stream.os_major === 8);
    }
    return data;
  };

  const appStreamDropdownValues = [
    DEFAULT_DROPDOWN_VALUE,
    RHEL_8_STREAMS_DROPDOWN_VALUE,
    RHEL_10_STREAMS_DROPDOWN_VALUE,
  ];

  const handleExport = (format: 'csv' | 'json' | 'xml') => {
    const data = buildExportData(filteredTableData, lifecycleDropdownValue, appStreamDropdownValues);
    exportToFile(format, data);
  };

  const redirectToDashboard = () => {
    // get the base url and append the dashboard path
    const dashUrl = `${window.location.origin}/insights/dashboard`;
    // redirect to the dash board
    window.location.href = dashUrl;
  };

  const lockedState = (
    <Bullseye>
      <EmptyState
        headingLevel="h2"
        icon={LockIcon}
        titleText="Planning is not yet enabled for your organization"
        variant={EmptyStateVariant.sm}
      >
        <EmptyStateBody>Workspace filtering has not been implemented.</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="primary" onClick={redirectToDashboard}>
              Return to home page
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </Bullseye>
  );

  const activeIsSystems = lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE;
  const activeRelevantStatus = activeIsSystems ? rhelBatch.status : appBatch.status;
  const activeCatalogStatus = activeIsSystems ? allSystemsStatus : allAppsStatus;
  const activeDatasetStatus = selectedViewFilter === 'all' ? activeCatalogStatus : activeRelevantStatus;
  const activeProgress = activeIsSystems ? rhelBatch.progress : appBatch.progress;
  const activeSurfaceError = activeIsSystems
    ? selectedViewFilter === 'all'
      ? allSystemsError
      : toErrorObjectOrUndefined(rhelBatch.error)
    : selectedViewFilter === 'all'
    ? allAppsError
    : toErrorObjectOrUndefined(appBatch.error);
  const exportDisabled = activeDatasetStatus !== 'ready';
  const exportDisabledTooltipContent = activeDatasetStatus === 'error' ? 'Data failed to load' : 'Still loading';
  const activeSurface = activeIsSystems ? 'rhel' : 'app';
  const preparingTotal = activeProgress?.total ?? 0;
  const preparingTitle =
    preparingTotal > 0
      ? `We're preparing life cycle data for ${preparingTotal.toLocaleString('en-US')} systems`
      : "We're preparing life cycle data";

  if (
    [
      error,
      toErrorObjectOrUndefined(rhelBatch.error),
      toErrorObjectOrUndefined(appBatch.error),
      allSystemsError,
      allAppsError,
    ].some((item) => isWorkspaceFilteringError(item))
  ) {
    return lockedState;
  }

  const nothingReady =
    allSystemsStatus !== 'ready' &&
    allAppsStatus !== 'ready' &&
    rhelBatch.status !== 'ready' &&
    appBatch.status !== 'ready';
  if (error && nothingReady) {
    return (
      <ErrorState
        titleText="Failed to load data"
        bodyText={String(error.message)}
        customFooter={<Button onClick={restartLoad}>Retry all</Button>}
      />
    );
  }

  const emptyState = (
    <Bullseye>
      <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No results found" variant={EmptyStateVariant.sm}>
        <EmptyStateBody>Clear all filters and try again.</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="link" onClick={resetFilters}>
              Clear all filters
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </Bullseye>
  );

  const renderRelevantError = () => (
    <EmptyState headingLevel="h2" titleText="Failed to load data" variant={EmptyStateVariant.sm}>
      <EmptyStateBody>
        {String(activeSurfaceError?.message ?? 'Failed to load relevant lifecycle data')}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="link" onClick={restartLoad}>
            Retry all
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );

  const renderCatalogError = () => (
    <ErrorState
      titleText="Failed to load data"
      bodyText={String(activeSurfaceError?.message ?? 'Failed to load lifecycle catalog')}
      customFooter={<Button onClick={restartLoad}>Retry all</Button>}
    />
  );

  const renderContent = () => {
    const LoadingComponent = (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );

    if (selectedViewFilter !== 'all' && activeRelevantStatus === 'error') {
      return renderRelevantError();
    }
    if (selectedViewFilter === 'all' && activeCatalogStatus === 'error') {
      return renderCatalogError();
    }
    if (selectedViewFilter === 'all' && activeCatalogStatus !== 'ready') {
      return <LifecycleContentSkeleton />;
    }
    if (selectedViewFilter !== 'all' && activeRelevantStatus !== 'ready') {
      return <LifecycleContentSkeleton />;
    }

    // Check if any filters are active
    const hasActiveFilters = nameFilter !== '' || rhelVersionFilter.length > 0 || statusFilter.length > 0;

    if (hasActiveFilters && (filteredTableData.length === 0 || filteredChartData.length === 0)) {
      return emptyState;
    }

    // Resolve the runtime crash issue caused by React temporarily rendering mismatched data types
    // during view switching between AppStreams and RHEL Systems.
    const isSystemsView = lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE;

    const dataReadyForView =
      filteredChartData.length > 0 &&
      (isSystemsView
        ? (filteredChartData as SystemLifecycleChanges[]).some((d) => typeof d.major === 'number')
        : (filteredChartData as Stream[]).some((d) => typeof d.os_major === 'number'));

    if (isSwitchingView) {
      return LoadingComponent;
    }

    if (!dataReadyForView) {
      return (
        <LifecycleTable
          data={filteredTableData}
          viewFilter={selectedViewFilter}
          chartSortByValue={chartSortByValue}
          orderingValue={chartDirection}
          updateChartSortValue={setOrderingStates}
          lifecycleDropdownValue={lifecycleDropdownValue}
        />
      );
    }

    // TEMPORARY BUG FIX for https://github.com/patternfly/patternfly-react/issues/11724
    // RSPEED-908
    // When the bug is resolved, this can be removed and just the LifecycleChart component can be used.
    // NOTE: The LifecycleChartSystem is 1:1 copy of LifecycleChart, just needs to be separated.
    const ChartComponent = isSystemsView ? LifecycleChartSystem : LifecycleChart;

    // Create a copy of filteredChartData and reverse it
    const reversedChartData = [...filteredChartData].reverse() as typeof filteredChartData;

    return (
      <>
        <ChartComponent
          key={`${isSystemsView ? 'systems' : 'apps'}:${selectedViewFilter}`}
          lifecycleData={reversedChartData}
          viewFilter={selectedViewFilter}
        />
        <LifecycleTable
          data={filteredChartData}
          viewFilter={selectedViewFilter}
          chartSortByValue={chartSortByValue}
          orderingValue={chartDirection}
          updateChartSortValue={setOrderingStates}
          lifecycleDropdownValue={lifecycleDropdownValue}
        />
      </>
    );
  };

  return (
    <React.Fragment>
      <Stack hasGutter>
        <Card>
          {activeRelevantStatus === 'loading' && (
            <BatchLoadAlert
              title={preparingTitle}
              description={PREPARING_DESCRIPTION}
              completed={activeProgress?.completed ?? 0}
              total={preparingTotal}
              onRetry={restartLoad}
              showRetry={activeIsSystems ? rhelBatch.isSlow : appBatch.isSlow}
              isRetrying={isRetrying}
            />
          )}
          {readyAlertSurfaces.has(activeSurface) &&
            selectedViewFilter === 'all' &&
            activeRelevantStatus === 'ready' && (
              <Alert
                variant="success"
                isInline
                title={READY_ALERT_TITLE}
                actionClose={
                  <AlertActionCloseButton aria-label="Close" onClose={() => dismissReadyAlert(activeSurface)} />
                }
              />
            )}
          <LifecycleFilters
            nameFilter={nameFilter}
            setNameFilter={(name: string) => onNameFilterChange(name)}
            setIsLoading={(isLoading: boolean) => setIsLoading(isLoading)}
            setError={(error: ErrorObject) => setError(error)}
            lifecycleDropdownValue={lifecycleDropdownValue}
            setLifecycleDropdownValue={setLifecycleDropdownValue}
            onLifecycleDropdownSelect={onLifecycleDropdownSelect}
            selectedChartSortBy={chartSortByValue}
            updateChartSortValue={setOrderingStates}
            onExport={handleExport}
            isExportDisabled={exportDisabled}
            exportDisabledTooltipContent={exportDisabledTooltipContent}
            selectedViewFilter={selectedViewFilter}
            handleViewFilterChange={handleViewFilterChange}
            noDataAvailable={noDataAvailable}
            onFilterFieldChange={(field) => {
              setFilterField(field);
            }}
            onRhelVersionsChange={(versions) => {
              setRhelVersionFilter(versions);
              updateFilters({ versions });
            }}
            onStatusesChange={(statuses) => {
              setStatusFilter(statuses);
              updateFilters({ statuses });
            }}
            rhelVersionOptions={rhelVersionOptions}
            initialRhelVersions={rhelVersionFilter}
            initialStatuses={statusFilter}
            resetOnAppsSwitchKey={appsSwitchKey}
            disableInstalledOnly={disableInstalledOnly}
          />
          <React.Suspense fallback={<LifecycleContentSkeleton />}>{renderContent()}</React.Suspense>
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
