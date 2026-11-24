import './upcoming.scss';
import React, { lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Grid,
  GridItem,
  Skeleton,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import {
  HOST_UUID_LOOKUP_TIMEOUT_MS,
  getAccessibleHostUuids,
  getAllUpcomingChanges,
  getUpcomingChanges,
} from '../../api';
import { UpcomingChanges } from '../../types/UpcomingChanges';
import { ErrorObject } from '../../types/ErrorObject';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { isAbortError, isTransientFailure, waitBeforeRetry } from '../../utils/batchRetry';
import { DEFAULT_FILTERS, KNOWN_TYPES, buildURL, pluralize } from '../../utils/utils';
import { useSearchParams } from 'react-router-dom';
import { Filter } from '../../types/Filter';
import {
  UpcomingChangeDetails,
  UpcomingChangeIdentity,
  UpcomingChangeRow,
  itemKey,
} from '../../utils/relevantUpcomingLoader';
import { useBatchLoad } from '../../hooks/useBatchLoad';
import BatchLoadAlert from '../BatchLoadAlert/BatchLoadAlert';

const UpcomingTable = lazy(() => import('../UpcomingTable/UpcomingTable'));

export const UPCOMING_COLUMN_NAMES = {
  name: 'Name',
  type: 'Type',
  release: 'Release',
  addedToRoadmap: 'Added to roadmap',
  date: 'Release date',
};

const capitalizeFirstLetter = (string: string) => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const isRelevant = (item: UpcomingChanges) => (item.details?.potentiallyAffectedSystemsCount ?? 0) > 0;

const filtersFromSearchParams = (params: URLSearchParams): Filter => {
  const filters: Filter = { ...DEFAULT_FILTERS };
  const name = params.get('name');
  const type = params.get('type');
  const release = params.get('release');
  const date = params.get('date');
  const addedToRoadmap = params.get('addedToRoadmap');
  const viewFilter = params.get('viewFilter');

  if (name) filters.name = name;
  if (type) filters.type = new Set(type.split(','));
  if (release) filters.release = release.split(',');
  if (date) filters.date = date;
  if (addedToRoadmap) filters.addedToRoadmap = addedToRoadmap;
  if (viewFilter) filters.viewFilter = viewFilter;

  return filters;
};

type UpcomingCatalogRow = UpcomingChangeIdentity & {
  package?: string;
  details?: Partial<UpcomingChangeDetails>;
};

const PREPARING_DESCRIPTION =
  'Large environments can take a few minutes to calculate. Keep this tab open to watch progress.';
const READY_ALERT_TITLE = 'Relevant roadmap data is ready.';
const WORKSPACE_FILTERING_ERROR = 'Error: Workspace filtering is not yet implemented';
const MAX_HOST_UUID_LOOKUP_ATTEMPTS = 3;
type InitialFilterKey = 'name' | 'type' | 'release' | 'date' | 'addedToRoadmap';
const INITIAL_FILTER_KEYS: InitialFilterKey[] = ['name', 'type', 'release', 'date', 'addedToRoadmap'];

const areFilterValuesEqual = (left: unknown, right: unknown) => {
  if (left instanceof Set && right instanceof Set) {
    return left.size === right.size && [...left].every((value) => right.has(value));
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }
  return left === right;
};

const getAccessibleHostUuidsWithRetry = async (signal: AbortSignal) => {
  for (let attempt = 1; attempt <= MAX_HOST_UUID_LOOKUP_ATTEMPTS; attempt += 1) {
    try {
      return await getAccessibleHostUuids(signal, HOST_UUID_LOOKUP_TIMEOUT_MS);
    } catch (error) {
      if (signal.aborted || !isTransientFailure(error) || attempt === MAX_HOST_UUID_LOOKUP_ATTEMPTS) {
        throw error;
      }
      await waitBeforeRetry(signal);
    }
  }
  throw new Error('Host UUID lookup exhausted its retry attempts.');
};

const toErrorObject = (error: unknown): ErrorObject => {
  const value = (error ?? {}) as { message?: unknown; status_code?: number };
  const fallback = typeof error === 'string' ? error : 'Failed to load data';
  return {
    message: String(value.message ?? fallback),
    status_code: value.status_code,
  };
};

const isWorkspaceFilteringError = (error?: unknown) => toErrorObject(error).message === WORKSPACE_FILTERING_ERROR;

const formatUpcomingRows = (rows: UpcomingCatalogRow[]): UpcomingChanges[] => {
  const now = new Date();
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  return rows.map((item) => ({
    ...item,
    type: capitalizeFirstLetter(item.type),
    ...(item.details && {
      details: {
        ...item.details,
        deployedDate: item.details.deployedDate ?? todayStr,
      },
    }),
  })) as UpcomingChanges[];
};

const mergeCatalogWithCorrelation = (
  catalog: UpcomingCatalogRow[],
  correlated: UpcomingChangeRow[],
  hasEmptyInventory = false
): UpcomingChanges[] => {
  const correlatedByKey = new Map(correlated.map((row) => [itemKey(row), row]));
  const merged = catalog.map((row) => {
    const match = correlatedByKey.get(itemKey(row));
    const details = match?.details;
    const mergedDetails = match
      ? {
          ...row.details,
          potentiallyAffectedSystemsCount: details?.potentiallyAffectedSystemsCount,
          potentiallyAffectedSystemsDetail: details?.potentiallyAffectedSystemsDetail,
          potentiallyAffectedSystems: details?.potentiallyAffectedSystems,
        }
      : hasEmptyInventory && row.details
      ? {
          ...row.details,
          // An empty accessible inventory is a known zero, not an unknown count.
          potentiallyAffectedSystemsCount: 0,
          potentiallyAffectedSystemsDetail: [],
          potentiallyAffectedSystems: [],
        }
      : row.details
      ? {
          ...row.details,
          // A missing correlation row is an unknown value, not a zero count.
          potentiallyAffectedSystemsCount: undefined,
          potentiallyAffectedSystemsDetail: undefined,
          potentiallyAffectedSystems: undefined,
        }
      : undefined;

    return {
      ...row,
      ...(mergedDetails ? { details: mergedDetails } : {}),
    };
  });

  return formatUpcomingRows(merged);
};

const isValidRelease = (data: UpcomingChanges[], release: string) => {
  const releaseAsArr = release.split(',');
  const availableReleases = new Set(data.map((repo) => repo.release));
  return releaseAsArr.every((item) => availableReleases.has(item));
};

const isValidDate = (data: UpcomingChanges[], date: string) =>
  Array.from(new Set(data.map((repo) => repo.date))).includes(date);

const isValidAddedToRoadmap = (_data: UpcomingChanges[], addedToRoadmap: string) =>
  ['lastMonthToDate', 'last90Days', 'lastYear', 'moreThan1YearAgo'].includes(addedToRoadmap);

const isValidType = (data: UpcomingChanges[], type: string) => {
  const validTypes = new Set<string>([...KNOWN_TYPES, ...data.map((item) => item.type)]);
  return type.split(',').every((item) => validTypes.has(item));
};

const UpcomingTab: React.FC<React.PropsWithChildren> = () => {
  const catalogAbortRef = useRef<AbortController | null>(null);
  const correlationAbortRef = useRef<AbortController | null>(null);
  const correlation = useBatchLoad<UpcomingChangeRow[]>('loading');
  const {
    complete: completeCorrelation,
    fail: failCorrelation,
    reset: resetCorrelation,
    start: startCorrelationTask,
  } = correlation;
  const catalogRowsRef = useRef<UpcomingCatalogRow[] | null>(null);
  const correlationRowsRef = useRef<UpcomingChangeRow[] | null>(null);
  const correlationInventoryEmptyRef = useRef(false);
  const initialUrlFiltersAppliedRef = useRef(false);

  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [catalogError, setCatalogError] = useState<ErrorObject>();
  const [showReadyAlert, setShowReadyAlert] = useState(false);
  const [readyAlertDismissed, setReadyAlertDismissed] = useState(false);
  const [numDeprecations, setNumDeprecations] = useState(0);
  const [numAdditions, setNumAdditions] = useState(0);
  const [numChanges, setNumChanges] = useState(0);
  const [visibleData, setVisibleData] = useState<UpcomingChanges[]>([]);
  const [currentTypeFilters, setCurrentTypeFilters] = useState<Set<string>>(new Set());
  const [currentDateFilter, setCurrentDateFilter] = useState('');
  const [currentNameFilter, setCurrentNameFilters] = useState('');
  const [currentReleaseFilters, setCurrentReleaseFilters] = useState<string[]>([]);
  const [currentAddedToRoadmapFilter, setCurrentAddedToRoadmapFilter] = useState('');
  const [noDataAvailable, setNoDataAvailable] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchParamsRef = useRef(searchParams);
  const setSearchParamsRef = useRef(setSearchParams);
  setSearchParamsRef.current = setSearchParams;
  const userEditedFiltersRef = useRef<Set<InitialFilterKey>>(new Set());
  const [filtersForURL, setFiltersForURL] = useState<Filter>(() =>
    filtersFromSearchParams(initialSearchParamsRef.current)
  );
  const filtersForURLRef = useRef(filtersForURL);
  filtersForURLRef.current = filtersForURL;
  const [selectedViewFilter, setSelectedViewFilter] = useState(
    searchParams.get('viewFilter') === 'all' ? 'all' : 'relevant'
  );
  const selectedViewFilterRef = useRef(selectedViewFilter);
  selectedViewFilterRef.current = selectedViewFilter;

  const nameParam = initialSearchParamsRef.current.get('name');
  const typeParam = initialSearchParamsRef.current.get('type');
  const releaseParam = initialSearchParamsRef.current.get('release');
  const dateParam = initialSearchParamsRef.current.get('date');
  const addedToRoadmapParam = initialSearchParamsRef.current.get('addedToRoadmap');

  const processData = useCallback((data: UpcomingChanges[]) => {
    setNumDeprecations(data.filter((item) => item.type === 'Deprecation').length);
    setNumAdditions(data.filter((item) => item.type === 'Addition' || item.type === 'Enhancement').length);
    setNumChanges(data.filter((item) => item.type === 'Change').length);
    setVisibleData(data);
  }, []);

  const applyInitialUrlFilters = useCallback(
    (data: UpcomingChanges[], view: string) => {
      if (initialUrlFiltersAppliedRef.current) {
        return;
      }
      initialUrlFiltersAppliedRef.current = true;

      const newFilters: Filter = { ...filtersForURLRef.current, viewFilter: view };
      if (nameParam && !userEditedFiltersRef.current.has('name')) {
        const name = decodeURIComponent(nameParam);
        setCurrentNameFilters(name);
        newFilters.name = name;
      }
      if (!userEditedFiltersRef.current.has('release')) {
        if (releaseParam && isValidRelease(data, decodeURIComponent(releaseParam))) {
          const release = decodeURIComponent(releaseParam).split(',');
          setCurrentReleaseFilters(release);
          newFilters.release = release;
        } else {
          delete newFilters.release;
        }
      }
      if (!userEditedFiltersRef.current.has('type')) {
        if (typeParam && isValidType(data, decodeURIComponent(typeParam))) {
          const type = new Set(decodeURIComponent(typeParam).split(','));
          setCurrentTypeFilters(type);
          newFilters.type = type;
        } else {
          delete newFilters.type;
        }
      }
      if (!userEditedFiltersRef.current.has('date')) {
        if (dateParam && isValidDate(data, decodeURIComponent(dateParam))) {
          const date = decodeURIComponent(dateParam);
          setCurrentDateFilter(date);
          newFilters.date = date;
        } else {
          delete newFilters.date;
        }
      }
      if (!userEditedFiltersRef.current.has('addedToRoadmap')) {
        if (addedToRoadmapParam && isValidAddedToRoadmap(data, decodeURIComponent(addedToRoadmapParam))) {
          const addedToRoadmap = decodeURIComponent(addedToRoadmapParam);
          setCurrentAddedToRoadmapFilter(addedToRoadmap);
          newFilters.addedToRoadmap = addedToRoadmap;
        } else {
          delete newFilters.addedToRoadmap;
        }
      }
      setFiltersForURL(newFilters);
      filtersForURLRef.current = newFilters;
      setSearchParamsRef.current(buildURL(newFilters));
    },
    [addedToRoadmapParam, dateParam, nameParam, releaseParam, typeParam]
  );

  const applyView = useCallback(
    (view: string) => {
      if (view === 'all') {
        const catalog = catalogRowsRef.current;
        const rows = catalog
          ? correlationRowsRef.current
            ? mergeCatalogWithCorrelation(
                catalog,
                correlationRowsRef.current,
                correlationInventoryEmptyRef.current
              )
            : formatUpcomingRows(catalog)
          : [];
        processData(rows);
        setNoDataAvailable(
          correlationRowsRef.current !== null &&
            !formatUpcomingRows(correlationRowsRef.current as UpcomingCatalogRow[]).some(isRelevant)
        );
        return rows;
      }

      const correlationRows = correlationRowsRef.current;
      const rows = correlationRows
        ? formatUpcomingRows(correlationRows as UpcomingCatalogRow[]).filter(isRelevant)
        : [];
      processData(rows);
      setNoDataAvailable(correlationRows !== null && rows.length === 0);
      return rows;
    },
    [processData]
  );

  const changeView = useCallback(
    (view: string, updateUrl: boolean) => {
      selectedViewFilterRef.current = view;
      setSelectedViewFilter(view);
      if (updateUrl) {
        const newFilters = { ...filtersForURLRef.current, viewFilter: view };
        setFiltersForURL(newFilters);
        filtersForURLRef.current = newFilters;
        setSearchParamsRef.current(buildURL(newFilters));
      }
      const rows = applyView(view);
      if (view === 'all' && catalogRowsRef.current) {
        if (!initialUrlFiltersAppliedRef.current) {
          applyInitialUrlFilters(rows, view);
        }
      } else if (view === 'relevant' && correlationRowsRef.current !== null) {
        if (!initialUrlFiltersAppliedRef.current) {
          applyInitialUrlFilters(rows, view);
        }
      }
    },
    [applyInitialUrlFilters, applyView]
  );

  const loadCatalog = useCallback(
    async (signal: AbortSignal) => {
      setCatalogStatus('loading');
      setCatalogError(undefined);
      try {
        const response = await getUpcomingChanges(signal);
        if (signal.aborted) {
          return;
        }
        if (!Array.isArray(response?.data)) {
          throw new Error('The upcoming changes catalog response was invalid.');
        }

        const rows = response.data as UpcomingCatalogRow[];
        catalogRowsRef.current = rows;
        setCatalogStatus('ready');
        const allRows = correlationRowsRef.current
          ? mergeCatalogWithCorrelation(rows, correlationRowsRef.current, correlationInventoryEmptyRef.current)
          : formatUpcomingRows(rows);
        applyView(selectedViewFilterRef.current);

        if (selectedViewFilterRef.current === 'all' && !initialUrlFiltersAppliedRef.current) {
          applyInitialUrlFilters(allRows, 'all');
        }
        if (
          selectedViewFilterRef.current === 'relevant' &&
          correlationRowsRef.current !== null &&
          formatUpcomingRows(correlationRowsRef.current as UpcomingCatalogRow[]).filter(isRelevant).length === 0 &&
          rows.length > 0
        ) {
          changeView('all', true);
        }
      } catch (error) {
        if (signal.aborted || isAbortError(error)) {
          return;
        }
        setCatalogError(toErrorObject(error));
        setCatalogStatus('error');
      }
    },
    [applyInitialUrlFilters, applyView, changeView]
  );

  const loadCorrelation = useCallback(
    async (signal: AbortSignal) => {
      setShowReadyAlert(false);
      try {
        const uuidResponse = await getAccessibleHostUuidsWithRetry(signal);
        if (signal.aborted) {
          return;
        }
        const hostIds = uuidResponse?.data;
        if (
          !Array.isArray(hostIds) ||
          hostIds.some((hostId) => typeof hostId !== 'string' || hostId.trim().length === 0)
        ) {
          throw new Error('Host inventory returned an invalid system identifier list.');
        }

        let rows: UpcomingChangeRow[];
        correlationInventoryEmptyRef.current = hostIds.length === 0;
        if (hostIds.length === 0) {
          rows = [];
          completeCorrelation(rows);
        } else {
          const result = await startCorrelationTask(
            (onProgress, batchSignal) =>
              getAllUpcomingChanges(hostIds, onProgress, batchSignal).then((response) => {
                if (!Array.isArray(response?.data)) {
                  throw new Error('Upcoming changes correlation response was invalid.');
                }
                return response.data as UpcomingChangeRow[];
              }),
            signal,
            hostIds.length
          );
          rows = result;
        }

        if (signal.aborted) {
          return;
        }
        correlationRowsRef.current = rows;
        const relevantRows = formatUpcomingRows(rows as UpcomingCatalogRow[]).filter(isRelevant);
        setNoDataAvailable(relevantRows.length === 0);
        const viewAtCompletion = selectedViewFilterRef.current;
        const activeRows = applyView(viewAtCompletion);
        if (viewAtCompletion === 'all') {
          setShowReadyAlert(true);
          setReadyAlertDismissed(false);
        } else if (relevantRows.length === 0 && catalogRowsRef.current && catalogRowsRef.current.length > 0) {
          changeView('all', true);
        } else if (!initialUrlFiltersAppliedRef.current && relevantRows.length > 0) {
          applyInitialUrlFilters(activeRows, viewAtCompletion);
        }
      } catch (error) {
        if (signal.aborted || isAbortError(error)) {
          return;
        }
        correlationRowsRef.current = null;
        failCorrelation(error);
      }
    },
    [applyInitialUrlFilters, applyView, changeView, completeCorrelation, failCorrelation, startCorrelationTask]
  );

  const startCatalog = useCallback(() => {
    catalogAbortRef.current?.abort();
    const controller = new AbortController();
    catalogAbortRef.current = controller;
    void loadCatalog(controller.signal);
  }, [loadCatalog]);

  const startCorrelation = useCallback(() => {
    correlationAbortRef.current?.abort();
    const controller = new AbortController();
    correlationAbortRef.current = controller;
    correlationRowsRef.current = null;
    correlationInventoryEmptyRef.current = false;
    resetCorrelation();
    setNoDataAvailable(false);
    void loadCorrelation(controller.signal);
  }, [loadCorrelation, resetCorrelation]);

  useEffect(() => {
    const catalogController = new AbortController();
    const correlationController = new AbortController();
    catalogAbortRef.current = catalogController;
    correlationAbortRef.current = correlationController;

    // Start both independent requests in the same effect. Correlation batches wait
    // for host IDs, while the static All catalog can render as soon as it arrives.
    void loadCatalog(catalogController.signal);
    void loadCorrelation(correlationController.signal);

    return () => {
      catalogAbortRef.current?.abort();
      correlationAbortRef.current?.abort();
    };
  }, [loadCatalog, loadCorrelation]);

  const retryCatalog = useCallback(() => {
    startCatalog();
  }, [startCatalog]);

  const retryCorrelation = useCallback(() => {
    startCorrelation();
  }, [startCorrelation]);

  const handleViewFilterChange = (filter: string) => {
    if (filter === 'relevant' && noDataAvailable) {
      return;
    }
    changeView(filter, true);
  };

  const resetFilters = () => {
    INITIAL_FILTER_KEYS.forEach((key) => userEditedFiltersRef.current.add(key));
    setCurrentTypeFilters(new Set());
    setCurrentDateFilter('');
    setCurrentNameFilters('');
    setCurrentReleaseFilters([]);
    setCurrentAddedToRoadmapFilter('');
    const nextView = noDataAvailable ? 'all' : 'relevant';
    changeView(nextView, false);
    const newFilters: Filter = { ...DEFAULT_FILTERS, viewFilter: nextView };
    setFiltersForURL(newFilters);
    filtersForURLRef.current = newFilters;
    setSearchParams(buildURL(newFilters));
  };

  const setTypeParam = (type: Set<string>) => {
    userEditedFiltersRef.current.add('type');
    const newFilters = { ...filtersForURLRef.current, type };
    setFiltersForURL(newFilters);
    filtersForURLRef.current = newFilters;
    setSearchParams(buildURL(newFilters));
  };

  const updateChildFilters = (filters: Filter) => {
    INITIAL_FILTER_KEYS.forEach((key) => {
      if (!areFilterValuesEqual(filtersForURLRef.current[key], filters[key])) {
        userEditedFiltersRef.current.add(key);
      }
    });
    setCurrentTypeFilters(filters.type ? new Set(filters.type) : new Set());
    setCurrentNameFilters(filters.name ?? '');
    setCurrentReleaseFilters(filters.release ?? []);
    setCurrentDateFilter(filters.date ?? '');
    setCurrentAddedToRoadmapFilter(filters.addedToRoadmap ?? '');
    setFiltersForURL(filters);
    filtersForURLRef.current = filters;
    setSearchParams(buildURL(filters));
  };

  const handleCardClick = (variant: 'additions' | 'changes' | 'deprecations') => {
    switch (variant) {
      case 'additions':
        setCurrentTypeFilters(new Set(['Addition', 'Enhancement']));
        setTypeParam(new Set(['Addition', 'Enhancement']));
        break;
      case 'changes':
        setCurrentTypeFilters(new Set(['Change']));
        setTypeParam(new Set(['Change']));
        break;
      default:
        setCurrentTypeFilters(new Set(['Deprecation']));
        setTypeParam(new Set(['Deprecation']));
        break;
    }
  };

  const redirectToDashboard = () => {
    const dashUrl = window.location.origin + '/insights/dashboard';
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

  const activeViewIsAll = selectedViewFilter === 'all';
  const contentStatus = activeViewIsAll
    ? catalogStatus
    : correlation.status === 'idle'
    ? 'loading'
    : correlation.status;
  const activeError = activeViewIsAll
    ? catalogError
    : correlation.status === 'error'
    ? toErrorObject(correlation.error)
    : undefined;
  const correlationError = correlation.status === 'error';
  const exportIsDisabled = activeViewIsAll
    ? catalogStatus !== 'ready' || correlation.status !== 'ready'
    : correlation.status !== 'ready';
  const exportDisabledTooltipContent =
    contentStatus === 'error' || (activeViewIsAll && correlationError) ? 'Data failed to load' : 'Still loading';
  const cardCountsReady = activeViewIsAll ? catalogStatus === 'ready' : correlation.status === 'ready';
  const cardsContent = (value: number) =>
    cardCountsReady ? (
      <span className="drf-lifecycle__upcoming-count">{value}</span>
    ) : (
      <Skeleton
        width="56px"
        style={{ display: 'inline-block', height: '1em', verticalAlign: 'middle' }}
        data-testid="upcoming-summary-count-skeleton"
      />
    );

  if (!activeViewIsAll && correlation.status === 'error' && isWorkspaceFilteringError(correlation.error)) {
    return lockedState;
  }

  const progress = correlation.progress;
  const preparingTitle =
    progress && progress.total > 0
      ? "We're preparing roadmap data for " + progress.total.toLocaleString('en-US') + ' systems'
      : "We're preparing roadmap data";

  return (
    <Stack className="drf-lifecycle__upcoming" hasGutter>
      {correlation.status === 'loading' && (
        <StackItem data-testid="upcoming-correlation-progress">
          <BatchLoadAlert
            title={preparingTitle}
            description={PREPARING_DESCRIPTION}
            completed={progress?.completed ?? 0}
            total={progress?.total ?? 0}
            progressAriaLabel="Roadmap data loading progress"
          />
        </StackItem>
      )}
      <StackItem>
        <Grid hasGutter span={12}>
          <GridItem span={4}>
            <Card ouiaId="upcoming-deprecations" isClickable style={{ height: '110px' }}>
              <CardHeader
                selectableActions={{
                  onClickAction: () => handleCardClick('deprecations'),
                  selectableActionAriaLabelledby: 'Deprecations',
                }}
              >
                <CardTitle className="drf-lifecycle__upcoming-card">
                  <ExclamationCircleIcon color={'var(--pf-t--global--color--status--danger--100)'} />
                  Deprecations
                </CardTitle>
              </CardHeader>
              <CardBody>
                {cardsContent(numDeprecations)} {pluralize(numDeprecations, 'deprecation')} that could affect your
                systems
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="upcoming-changes" isClickable style={{ height: '110px' }}>
              <CardHeader
                selectableActions={{
                  onClickAction: () => handleCardClick('changes'),
                  selectableActionAriaLabelledby: 'filter-by-type-2',
                }}
              >
                <CardTitle className="drf-lifecycle__upcoming-card">
                  <ExclamationTriangleIcon color={'var(--pf-t--global--color--status--warning--200)'} />
                  Changes
                </CardTitle>
              </CardHeader>
              <CardBody>
                {cardsContent(numChanges)} {pluralize(numChanges, 'change')} that could affect your systems
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="upcoming-additions" isClickable style={{ height: '110px' }}>
              <CardHeader
                selectableActions={{
                  onClickAction: () => handleCardClick('additions'),
                  selectableActionAriaLabelledby: 'filter-by-type-3',
                }}
              >
                <CardTitle className="drf-lifecycle__upcoming-card">
                  <InfoCircleIcon color={'var(--pf-t--global--icon--color--severity--none--default)'} />
                  Additions and enhancements
                </CardTitle>
              </CardHeader>
              <CardBody>
                {cardsContent(numAdditions)} {pluralize(numAdditions, 'addition')} and{' '}
                {pluralize(numAdditions, 'enhancement')} that could affect your systems
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>
      {showReadyAlert && activeViewIsAll && !readyAlertDismissed && (
        <StackItem>
          <Alert
            variant="success"
            isInline
            title={READY_ALERT_TITLE}
            actionClose={
              <AlertActionCloseButton
                aria-label="Close"
                onClose={() => {
                  setReadyAlertDismissed(true);
                  setShowReadyAlert(false);
                }}
              />
            }
          />
        </StackItem>
      )}
      {activeViewIsAll && correlationError && (
        <StackItem data-testid="upcoming-correlation-error">
          <Alert
            variant="danger"
            isInline
            title="Affected system counts failed to load."
            actionLinks={
              <AlertActionLink onClick={retryCorrelation} data-testid="retry-correlation">
                Retry affected system counts
              </AlertActionLink>
            }
          >
            {toErrorObject(correlation.error).message}
          </Alert>
        </StackItem>
      )}
      <StackItem>
        <UpcomingTable
          data={visibleData}
          columnNames={UPCOMING_COLUMN_NAMES}
          initialTypeFilters={currentTypeFilters}
          resetInitialFilters={resetFilters}
          initialDateFilter={currentDateFilter}
          initialNameFilter={currentNameFilter}
          initialReleaseFilters={currentReleaseFilters}
          initialAddedToRoadmapFilter={currentAddedToRoadmapFilter}
          filtersForURL={filtersForURL}
          setFiltersForURL={updateChildFilters}
          selectedViewFilter={selectedViewFilter}
          handleViewFilterChange={handleViewFilterChange}
          noDataAvailable={noDataAvailable}
          contentStatus={contentStatus}
          contentError={activeError?.message}
          onRetryContent={activeViewIsAll ? retryCatalog : retryCorrelation}
          contentRetryLabel={activeViewIsAll ? 'Try again' : 'Retry all'}
          countsPending={activeViewIsAll && catalogStatus === 'ready' && correlation.status === 'loading'}
          countsFailed={activeViewIsAll && catalogStatus === 'ready' && correlation.status === 'error'}
          isExportDisabled={exportIsDisabled}
          exportDisabledTooltipContent={exportDisabledTooltipContent}
        />
      </StackItem>
    </Stack>
  );
};

export default UpcomingTab;
