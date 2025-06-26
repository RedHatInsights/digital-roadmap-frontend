import './Lifecycle.scss';
import React, { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import {
  Bullseye,
  Button,
  Card,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Stack,
} from '@patternfly/react-core';
import { ErrorObject } from '../../types/ErrorObject';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import {
  getAllLifecycleAppstreams,
  getAllLifecycleSystems,
  getRelevantLifecycleAppstreams,
  getRelevantLifecycleSystems,
} from '../../api';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
import { useSearchParams } from 'react-router-dom';
import { buildURL, checkValidityOfQueryParam } from '../../utils/utils';
import {
  DEFAULT_CHART_SORTBY_VALUE,
  DEFAULT_DROPDOWN_VALUE,
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
import { download, generateCsv, mkConfig } from 'export-to-csv';
import ErrorState from '@patternfly/react-component-groups/dist/dynamic/ErrorState';
import { formatDate, getNewName } from '../../utils/utils';
import { ExtendedFilter } from '../../types/Filter';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import debounce from 'lodash/debounce';

// Define DEFAULT_FILTERS with the ExtendedFilter type
const DEFAULT_FILTERS: ExtendedFilter = {
  name: '',
  chartSortBy: DEFAULT_CHART_SORTBY_VALUE,
  lifecycleDropdown: DEFAULT_DROPDOWN_VALUE,
  viewFilter: 'installed-only',
};

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {
  const [systemLifecycleChanges, setSystemLifecycleChanges] = useState<SystemLifecycleChanges[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject | undefined>();
  const [noDataAvailable, setNoDataAvailable] = useState<boolean>(false);
  const [filteredChartData, setFilteredChartData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [appLifecycleChanges, setAppLifecycleChanges] = useState<Stream[]>([]);
  // Add a state for the full app lifecycle data
  const [fullAppLifecycleChanges, setFullAppLifecycleChanges] = useState<Stream[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  // drop down menu
  const [lifecycleDropdownValue, setLifecycleDropdownValue] = React.useState<string>(DEFAULT_DROPDOWN_VALUE);
  const [chartSortByValue, setChartSortByValue] = React.useState<string>(DEFAULT_CHART_SORTBY_VALUE);
  const [filters, setFilters] = useState<ExtendedFilter>(DEFAULT_FILTERS);
  // Add state for view filter (all, installed-only, installed-and-related)
  const [selectedViewFilter, setSelectedViewFilter] = useState<string>('installed-only');

  // Add state variables to store cached API responses
  const [allSystemData, setAllSystemData] = useState<SystemLifecycleChanges[]>([]);
  const [allAppData, setAllAppData] = useState<Stream[]>([]);
  const [installedSystemData, setInstalledSystemData] = useState<SystemLifecycleChanges[]>([]);
  const [installedAppData, setInstalledAppData] = useState<Stream[]>([]);
  const [relatedSystemData, setRelatedSystemData] = useState<SystemLifecycleChanges[]>([]);
  const [relatedAppData, setRelatedAppData] = useState<Stream[]>([]);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);

  // Race condition prevention refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const requestVersionRef = useRef(0);
  const loadingCountRef = useRef(0);

  const csvConfig = mkConfig({ useKeysAsHeaders: true });

  const nameQueryParam = searchParams.get('name');
  const dropdownQueryParam = searchParams.get('lifecycleDropdown');
  const sortByParam = searchParams.get('chartSortBy');
  const viewFilterParam = searchParams.get('viewFilter');

  // Lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Safe state setter helper with proper typing
  function safeSetState<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: React.SetStateAction<T>): void {
    if (isMountedRef.current) {
      setter(value);
    }
  }

  // Loading state management helpers
  const startLoading = useCallback(() => {
    loadingCountRef.current++;
    if (loadingCountRef.current === 1) {
      safeSetState(setIsLoading, true as boolean);
    }
  }, []);

  const stopLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
    if (loadingCountRef.current === 0) {
      safeSetState(setIsLoading, false as boolean);
    }
  }, []);

  // Unified filter application to ensure consistent filtering
  const applyAllActiveFilters = useCallback(
    (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string, nameFilterValue: string) => {
      if (!isMountedRef.current) return;

      let filteredData = data;

      if (nameFilterValue) {
        if (dropdownValue === DEFAULT_DROPDOWN_VALUE || dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
          filteredData = (data as Stream[]).filter((datum) => {
            return `${datum.display_name.toLowerCase()}`.includes(nameFilterValue.toLowerCase());
          });
        } else if (dropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
          filteredData = (data as SystemLifecycleChanges[]).filter((datum) => {
            const product = `${datum.name.toLowerCase()} ${datum.major}.${datum.minor}`;
            return product.includes(nameFilterValue.toLowerCase());
          });
        }
      }

      safeSetState(setFilteredTableData, filteredData);

      const chartData = filterChartData(filteredData, chartSortByValue, dropdownValue);
      safeSetState(setFilteredChartData, chartData);

      return filteredData;
    },
    [chartSortByValue, safeSetState]
  );

  const updateChartSortValue = useCallback(
    (value: string) => {
      setChartSortByValue(value);
      const newFilters = structuredClone(filters);
      newFilters['chartSortBy'] = value;
      setFilters(newFilters);
      setSearchParams(buildURL(newFilters));
      setFilteredChartData(filterChartData(filteredChartData, value, lifecycleDropdownValue));
    },
    [filters, filteredChartData, lifecycleDropdownValue, setSearchParams]
  );

  const filterChartData = useCallback(
    (
      data: Stream[] | SystemLifecycleChanges[],
      sortBy: string,
      dropdownValue: string
    ): Stream[] | SystemLifecycleChanges[] => {
      if (!data || data.length === 0) {
        return [];
      }

      switch (sortBy) {
        case 'Name':
          return filterChartDataByName(data, dropdownValue);
        case 'Release version':
          return filterChartDataByRelease(data, dropdownValue);
        case 'Release date':
          return filterChartDataByReleaseDate(data, dropdownValue);
        case 'Retirement date':
          return filterChartDataByRetirementDate(data, dropdownValue);
        case 'Systems':
          return filterChartDataBySystems(data, dropdownValue);
        default:
          return filterChartDataByRetirementDate(data, dropdownValue);
      }
    },
    []
  );

  // Helper function to filter app data based on dropdown value
  const filterAppDataByDropdown = useCallback((data: Stream[], dropdownValue: string): Stream[] => {
    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      return data.filter((stream) => stream?.rolling === false && stream.os_major === 9);
    } else if (dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
      return data.filter((stream) => stream?.rolling === false && stream.os_major === 8);
    }
    return data;
  }, []);

  const updateLifecycleData = useCallback((data: SystemLifecycleChanges[]) => {
    // Create a new array with new objects to avoid modifying the original data
    return data.map((datum) => {
      // Create a new object instead of modifying the original
      return {
        ...datum,
        name: getNewName(datum.name, datum.major, datum.minor, datum.lifecycle_type),
      };
    });
  }, []);

  const onLifecycleDropdownSelect = useCallback(
    (value: string) => {
      if (!isMountedRef.current) return;

      setLifecycleDropdownValue(value);
      const newFilters = structuredClone(filters);
      newFilters['lifecycleDropdown'] = value;
      setFilters(newFilters);
      setSearchParams(buildURL(newFilters));

      // Filter from the full dataset each time
      let dataToProcess: Stream[] | SystemLifecycleChanges[] = [];
      let hasInstalledData = false;

      if (value === DEFAULT_DROPDOWN_VALUE || value === RHEL_8_STREAMS_DROPDOWN_VALUE) {
        dataToProcess = filterAppDataByDropdown(fullAppLifecycleChanges, value);
        safeSetState(setAppLifecycleChanges, dataToProcess);

        // Check if we have installed app data for the selected dropdown
        const installedAppStreams = filterAppDataByDropdown(installedAppData, value);
        hasInstalledData = installedAppStreams.length > 0;
      } else if (value === RHEL_SYSTEMS_DROPDOWN_VALUE) {
        dataToProcess = systemLifecycleChanges;

        // Check if we have installed system data
        hasInstalledData = installedSystemData.length > 0;
      } else {
        // Fallback for any unexpected dropdown value - use app streams as default
        dataToProcess = filterAppDataByDropdown(fullAppLifecycleChanges, DEFAULT_DROPDOWN_VALUE);

        // Check installed app data for default dropdown
        const installedAppStreams = filterAppDataByDropdown(installedAppData, DEFAULT_DROPDOWN_VALUE);
        hasInstalledData = installedAppStreams.length > 0;
      }

      // Always set noDataAvailable based on whether there's installed data
      safeSetState(setNoDataAvailable, !hasInstalledData as boolean);

      // If no installed data and we're currently in 'installed-only' or 'installed-and-related' view,
      // automatically switch to 'all' view
      if (
        !hasInstalledData &&
        (selectedViewFilter === 'installed-only' || selectedViewFilter === 'installed-and-related')
      ) {
        // Switch to "all" view
        safeSetState(setSelectedViewFilter, 'all' as string);
        const updatedFilters = structuredClone(newFilters);
        updatedFilters.viewFilter = 'all';
        setFilters(updatedFilters);
        setSearchParams(buildURL(updatedFilters));

        // Update dataToProcess to use "all" data
        if (value === RHEL_SYSTEMS_DROPDOWN_VALUE) {
          dataToProcess = allSystemData;
          // Update systemLifecycleChanges to use all data
          const updatedSystems = updateLifecycleData(allSystemData);
          safeSetState(setSystemLifecycleChanges, updatedSystems);
          dataToProcess = updatedSystems;
        } else {
          dataToProcess = filterAppDataByDropdown(allAppData, value);
          safeSetState(setFullAppLifecycleChanges, allAppData);
          safeSetState(setAppLifecycleChanges, dataToProcess);
        }
      }

      // If no installed data and we're currently in 'all' view,
      // ensure we're using the "all" data source
      if (!hasInstalledData && selectedViewFilter === 'all') {
        // Update dataToProcess to use "all" data
        if (value === RHEL_SYSTEMS_DROPDOWN_VALUE) {
          dataToProcess = allSystemData;
          // Update systemLifecycleChanges to use all data
          const updatedSystems = updateLifecycleData(allSystemData);
          safeSetState(setSystemLifecycleChanges, updatedSystems);
          dataToProcess = updatedSystems;
        } else {
          dataToProcess = filterAppDataByDropdown(allAppData, value);
          safeSetState(setFullAppLifecycleChanges, allAppData);
          safeSetState(setAppLifecycleChanges, dataToProcess);
        }
      }

      // Apply all current filters to the new data, including name filter
      applyAllActiveFilters(dataToProcess, value, nameFilter);
    },
    [
      filters,
      fullAppLifecycleChanges,
      systemLifecycleChanges,
      installedAppData,
      installedSystemData,
      selectedViewFilter,
      allSystemData,
      allAppData,
      nameFilter,
      setSearchParams,
      safeSetState,
      filterAppDataByDropdown,
      updateLifecycleData,
      applyAllActiveFilters,
    ]
  );

  // First data fetch - called only once
  const initializeData = useCallback(
    async (viewFilter: string) => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // Increment request version
      const currentVersion = ++requestVersionRef.current;

      startLoading();
      safeSetState(setNoDataAvailable, false as boolean);

      try {
        // Fetch data in parallel
        // Note: If your API functions don't support AbortSignal, you'll need to modify them
        // For now, we'll call them without the signal and handle cancellation differently
        const results = await Promise.allSettled([
          getRelevantLifecycleSystems(),
          getRelevantLifecycleAppstreams(),
          getAllLifecycleSystems(),
          getAllLifecycleAppstreams(),
        ]);

        // Check if request was aborted or a newer request was made
        if (signal.aborted || currentVersion !== requestVersionRef.current) {
          return;
        }

        // If any of them has an error, propagate the exception to be handled and error is displayed
        const [relevantSystemResponse, relevantAppResponse, allSystemResponse, allAppResponse] = results.map(
          (result) => {
            if (result.status === 'fulfilled') {
              return result.value;
            }
            // if not fullfiled, there is a exception
            throw result.reason;
          }
        );

        // Check again before processing data
        if (!isMountedRef.current || currentVersion !== requestVersionRef.current) {
          return;
        }

        // Store all fetched data in state
        const relatedInstalledSystems = relevantSystemResponse.data || [];
        const relatedInstalledApps = relevantAppResponse.data || [];
        // filter out system data with null minor field
        const allSystems = (allSystemResponse.data || []).filter(
          (datum: SystemLifecycleChanges) => datum.minor !== null
        );
        const allApps = allAppResponse.data || [];

        // Filter out from the instlled & related list of Stream and SystemLifecycleChanges only the installed ones
        const installedSystems = [
          ...relatedInstalledSystems.filter((datum: SystemLifecycleChanges) => datum.related === false),
        ];
        const installedApps = [...relatedInstalledApps.filter((datum: Stream) => datum.related === false)];

        // Store the data in state
        safeSetState(setRelatedSystemData, relatedInstalledSystems);
        safeSetState(setRelatedAppData, relatedInstalledApps);
        safeSetState(setAllSystemData, allSystems);
        safeSetState(setAllAppData, allApps);
        safeSetState(setInstalledAppData, installedApps);
        safeSetState(setInstalledSystemData, installedSystems);

        // Mark data as initialized
        safeSetState(setDataInitialized, true as boolean);

        // Use the explicitly passed viewFilter or default to selectedViewFilter
        let currentViewFilter = viewFilter || selectedViewFilter;
        const currentDropdown = dropdownQueryParam || DEFAULT_DROPDOWN_VALUE;

        // Check if there's installed data for the current dropdown selection
        let hasInstalledDataForDropdown = false;
        if (currentDropdown === RHEL_SYSTEMS_DROPDOWN_VALUE) {
          hasInstalledDataForDropdown = installedSystems.length > 0;
        } else {
          // For app streams (DEFAULT_DROPDOWN_VALUE or RHEL_8_STREAMS_DROPDOWN_VALUE)
          const installedAppStreams = filterAppDataByDropdown(installedApps, currentDropdown);
          hasInstalledDataForDropdown = installedAppStreams.length > 0;
        }

        // Set noDataAvailable based on installed data for current dropdown
        safeSetState(setNoDataAvailable, !hasInstalledDataForDropdown as boolean);

        // If no installed data for current dropdown and we're in installed-only or installed-and-related view,
        // automatically switch to "all" view
        if (
          !hasInstalledDataForDropdown &&
          (currentViewFilter === 'installed-only' || currentViewFilter === 'installed-and-related')
        ) {
          currentViewFilter = 'all';
          safeSetState(setSelectedViewFilter, 'all' as string);
          const newFilters = structuredClone(filters) as ExtendedFilter;
          newFilters.viewFilter = 'all';
          safeSetState(setFilters, newFilters);
          setSearchParams(buildURL(newFilters));
        }

        // Directly use the fetched data to process without relying on state updates
        const systemData = (() => {
          switch (currentViewFilter) {
            case 'all':
              return allSystems;
            case 'installed-only':
              return installedSystems;
            case 'installed-and-related':
              return relatedInstalledSystems;
            default:
              return installedSystems;
          }
        })();
        const appData = (() => {
          switch (currentViewFilter) {
            case 'all':
              return allApps;
            case 'installed-only':
              return installedApps;
            case 'installed-and-related':
              return relatedInstalledApps;
            default:
              return installedApps;
          }
        })();

        // Store the full app data set
        safeSetState(setFullAppLifecycleChanges, [...appData]);

        // Filter based on current dropdown value
        const appStreams = filterAppDataByDropdown([...appData], currentDropdown);
        safeSetState(setAppLifecycleChanges, appStreams);

        // Process the data without waiting for state updates
        if (systemData.length > 0 || appStreams.length > 0) {
          // Update and set the system lifecycle data
          const updatedSystems = updateLifecycleData(systemData);
          safeSetState(setSystemLifecycleChanges, updatedSystems);

          // Apply filters based on URL parameters
          filterInitialData(appStreams, updatedSystems);
        } else {
          // If no data, at least initialize empty arrays
          safeSetState(setFilteredTableData, [] as Stream[] | SystemLifecycleChanges[]);
          safeSetState(setFilteredChartData, [] as Stream[] | SystemLifecycleChanges[]);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Request was cancelled');
          return;
        }
        // Only handle error if this is the latest request and component is mounted
        if (currentVersion === requestVersionRef.current && isMountedRef.current) {
          console.error('Error fetching lifecycle changes:', error);
          safeSetState(setError, { message: error.message, status_code: error.status_code } as
            | ErrorObject
            | undefined);
        }
      } finally {
        // Only update loading state if this is the latest request
        if (currentVersion === requestVersionRef.current && isMountedRef.current) {
          stopLoading();
        }
      }
    },
    [
      selectedViewFilter,
      dropdownQueryParam,
      filters,
      setSearchParams,
      startLoading,
      stopLoading,
      safeSetState,
      filterAppDataByDropdown,
      updateLifecycleData,
    ]
  );

  const selectSystemDataSource = useCallback(
    (filter: string) => {
      switch (filter) {
        case 'all':
          return allSystemData;
        case 'installed-only':
          return installedSystemData;
        case 'installed-and-related':
          return relatedSystemData;
        default:
          return installedSystemData;
      }
    },
    [allSystemData, installedSystemData, relatedSystemData]
  );

  const selectAppDataSource = useCallback(
    (filter: string) => {
      switch (filter) {
        case 'all':
          return allAppData;
        case 'installed-only':
          return installedAppData;
        case 'installed-and-related':
          return relatedAppData;
        default:
          return installedAppData;
      }
    },
    [allAppData, installedAppData, relatedAppData]
  );

  // Updated processData function with dropdown-specific no data handling
  const processData = useCallback(
    (viewFilter: string) => {
      if (!isMountedRef.current) return;

      // Use the appropriate cached data based on the current view filter
      const systemData = selectSystemDataSource(viewFilter);
      const appData = selectAppDataSource(viewFilter);

      // Store the full app data set
      safeSetState(setFullAppLifecycleChanges, [...appData]);

      // Filter based on current dropdown value
      const appStreams = filterAppDataByDropdown([...appData], lifecycleDropdownValue);
      safeSetState(setAppLifecycleChanges, appStreams);

      // Check if current dropdown selection has data for the current view
      let hasDataForCurrentDropdown = false;
      if (lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
        hasDataForCurrentDropdown = systemData.length > 0;
      } else {
        hasDataForCurrentDropdown = appStreams.length > 0;
      }

      // Set no data available based on current dropdown selection
      safeSetState(setNoDataAvailable, !hasDataForCurrentDropdown as boolean);

      // Exit early if no data in the current view for current dropdown
      if (!hasDataForCurrentDropdown) {
        safeSetState(setFilteredTableData, [] as Stream[] | SystemLifecycleChanges[]);
        safeSetState(setFilteredChartData, [] as Stream[] | SystemLifecycleChanges[]);
        return;
      }

      // Update and set the system lifecycle data (without modifying original data)
      const updatedSystems = updateLifecycleData(systemData);
      safeSetState(setSystemLifecycleChanges, updatedSystems);

      // Apply ALL filters including the current name filter
      let dataToFilter: Stream[] | SystemLifecycleChanges[] = [];
      if (lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
        dataToFilter = updatedSystems;
      } else {
        dataToFilter = appStreams;
      }

      applyAllActiveFilters(dataToFilter, lifecycleDropdownValue, nameFilter);
    },
    [
      lifecycleDropdownValue,
      nameFilter,
      selectSystemDataSource,
      selectAppDataSource,
      safeSetState,
      filterAppDataByDropdown,
      updateLifecycleData,
      applyAllActiveFilters,
    ]
  );

  // Updated fetchData that uses cached data
  const fetchData = useCallback(
    (viewFilter = selectedViewFilter) => {
      if (!dataInitialized) {
        // First load - initialize all data with the explicit viewFilter
        initializeData(viewFilter);
      } else {
        // Already have data - just process with current filter
        startLoading();

        // Check if relevant data is available for current dropdown
        let hasRelevantData = false;
        if (lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
          const systemData = selectSystemDataSource(viewFilter);
          hasRelevantData = systemData.length > 0;
        } else {
          const appData = selectAppDataSource(viewFilter);
          const filteredAppData = filterAppDataByDropdown(appData, lifecycleDropdownValue);
          hasRelevantData = filteredAppData.length > 0;
        }

        safeSetState(setNoDataAvailable, !hasRelevantData as boolean);

        // Auto-switch to "all" view if needed
        let effectiveViewFilter = viewFilter;
        if (!hasRelevantData && viewFilter !== 'all') {
          effectiveViewFilter = 'all';
          safeSetState(setSelectedViewFilter, 'all' as string);
          const newFilters = structuredClone(filters) as ExtendedFilter;
          newFilters.viewFilter = 'all';
          safeSetState(setFilters, newFilters);
          setSearchParams(buildURL(newFilters));
        }

        // Process cached data with the explicit viewFilter
        processData(effectiveViewFilter);
        stopLoading();
      }
    },
    [
      dataInitialized,
      selectedViewFilter,
      lifecycleDropdownValue,
      filters,
      initializeData,
      processData,
      selectSystemDataSource,
      selectAppDataSource,
      filterAppDataByDropdown,
      safeSetState,
      setSearchParams,
      startLoading,
      stopLoading,
    ]
  );

  // Update the view filter handler to use cached data
  const handleViewFilterChange = useCallback(
    (filter: string) => {
      console.log('View filter changed to:', filter);
      safeSetState(setSelectedViewFilter, filter);
      const newFilters = structuredClone(filters) as ExtendedFilter;
      newFilters.viewFilter = filter;
      safeSetState(setFilters, newFilters);
      setSearchParams(buildURL(newFilters));

      // Process data with the new filter - no API call
      fetchData(filter);
    },
    [filters, setSearchParams, fetchData, safeSetState]
  );

  // Updated to use unified filtering
  const checkNameQueryParam = useCallback(
    (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
      if (nameQueryParam !== null) {
        safeSetState(setNameFilter, nameQueryParam);
        // Use our unified filter function
        applyAllActiveFilters(data, dropdownValue, nameQueryParam);
      } else {
        let chartData;
        if (sortByParam && checkValidityOfQueryParam('sortByQueryParam', sortByParam)) {
          chartData = filterChartData(data, sortByParam, dropdownValue);
          safeSetState(setChartSortByValue, sortByParam);
          safeSetState(setFilteredChartData, chartData);
        } else {
          chartData = filterChartDataByRetirementDate(data, dropdownValue);
          safeSetState(setFilteredChartData, chartData);
        }

        safeSetState(setFilteredTableData, data);
      }
    },
    [nameQueryParam, sortByParam, safeSetState, applyAllActiveFilters, filterChartData]
  );

  // Use checkNameQueryParam for URL parameter handling
  const filterInitialData = useCallback(
    (appStreams: Stream[], updatedSystems: SystemLifecycleChanges[]) => {
      // Set the correct dropdown value first
      if (dropdownQueryParam && dropdownQueryParam === DEFAULT_DROPDOWN_VALUE) {
        safeSetState(setLifecycleDropdownValue, DEFAULT_DROPDOWN_VALUE as string);
        checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
      } else if (dropdownQueryParam && dropdownQueryParam === RHEL_8_STREAMS_DROPDOWN_VALUE) {
        safeSetState(setLifecycleDropdownValue, RHEL_8_STREAMS_DROPDOWN_VALUE as string);
        checkNameQueryParam(appStreams, RHEL_8_STREAMS_DROPDOWN_VALUE);
      } else if (dropdownQueryParam && dropdownQueryParam === RHEL_SYSTEMS_DROPDOWN_VALUE) {
        safeSetState(setLifecycleDropdownValue, RHEL_SYSTEMS_DROPDOWN_VALUE as string);
        checkNameQueryParam(updatedSystems, RHEL_SYSTEMS_DROPDOWN_VALUE);
      } else {
        safeSetState(setLifecycleDropdownValue, DEFAULT_DROPDOWN_VALUE as string);
        checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
      }
    },
    [dropdownQueryParam, safeSetState, checkNameQueryParam]
  );

  // Update resetDataFiltering to use the properly filtered app data
  const resetDataFiltering = useCallback(() => {
    if (!isMountedRef.current) return;

    let currentData: Stream[] | SystemLifecycleChanges[] = [];
    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE
    ) {
      currentData = appLifecycleChanges;
    } else if (lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      currentData = systemLifecycleChanges;
    } else {
      // Fallback to app lifecycle changes if no valid dropdown value
      currentData = appLifecycleChanges;
    }

    safeSetState(setFilteredTableData, currentData);
    const chartData = filterChartData(currentData, chartSortByValue, lifecycleDropdownValue);
    safeSetState(setFilteredChartData, chartData);
  }, [
    lifecycleDropdownValue,
    appLifecycleChanges,
    systemLifecycleChanges,
    chartSortByValue,
    safeSetState,
    filterChartData,
  ]);

  // Use the unified filter function with debouncing
  const doFilter = useCallback(
    (name: string) => {
      if (!isMountedRef.current) return;

      if (name !== '') {
        const dataSource =
          lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE ? systemLifecycleChanges : appLifecycleChanges;

        applyAllActiveFilters(dataSource, lifecycleDropdownValue, name);
      } else {
        resetDataFiltering();
      }
    },
    [
      lifecycleDropdownValue,
      systemLifecycleChanges,
      appLifecycleChanges,
      applyAllActiveFilters,
      resetDataFiltering,
    ]
  );

  // Debounced filter function
  const debouncedDoFilter = useMemo(
    () =>
      debounce((name: string) => {
        doFilter(name);
      }, 300),
    [doFilter]
  );

  // Cleanup debounced function
  useEffect(() => {
    return () => {
      debouncedDoFilter.cancel();
    };
  }, [debouncedDoFilter]);

  const filterData = useCallback(
    (name: string) => {
      if (name !== '') {
        debouncedDoFilter(name);
      } else {
        resetDataFiltering();
      }
    },
    [debouncedDoFilter, resetDataFiltering]
  );

  const onNameFilterChange = useCallback(
    (name: string) => {
      safeSetState(setNameFilter, name);
      filterData(name);
      const newFilters = structuredClone(filters);
      newFilters['name'] = name;
      safeSetState(setFilters, newFilters);
      setSearchParams(buildURL(newFilters));
    },
    [filters, setSearchParams, filterData, safeSetState]
  );

  // Update resetFilters to use cached data
  const resetFilters = useCallback(() => {
    safeSetState(setNameFilter, '' as string);
    safeSetState(setLifecycleDropdownValue, DEFAULT_DROPDOWN_VALUE as string);
    safeSetState(setChartSortByValue, DEFAULT_CHART_SORTBY_VALUE as string);
    safeSetState(setFilters, DEFAULT_FILTERS);
    safeSetState(setSelectedViewFilter, 'installed-only' as string);

    // Use the cached data
    fetchData('installed-only');
  }, [safeSetState, fetchData]);

  const downloadCSV = useCallback(() => {
    const data: { [key: string]: string | number }[] = [];
    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE
    ) {
      (filteredTableData as Stream[]).forEach((item: Stream) =>
        data.push({
          Name: item.name,
          Release: item.os_major,
          'Release date': formatDate(item.start_date),
          'Retirement date': formatDate(item.end_date),
          Systems: item.count,
        })
      );
    } else if (lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      (filteredTableData as SystemLifecycleChanges[]).forEach((item: SystemLifecycleChanges) =>
        data.push({
          Name: item.name,
          'Start date': formatDate(item.start_date),
          'End date': formatDate(item.end_date),
          Systems: item.count,
        })
      );
    }
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  }, [lifecycleDropdownValue, filteredTableData, csvConfig]);

  // Initial load effect
  useEffect(() => {
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
    if (dropdownQueryParam) initialFilters.lifecycleDropdown = dropdownQueryParam;
    if (sortByParam) initialFilters.chartSortBy = sortByParam;
    initialFilters.viewFilter = initialViewFilter;
    setFilters(initialFilters);

    // Initialize data with the correct view filter
    fetchData(initialViewFilter);
  }, []); // Only run on mount

  if (isLoading) {
    return (
      <div>
        <Bullseye>
          <Spinner />
        </Bullseye>
      </div>
    );
  }

  const redirectToDashboard = () => {
    // get the base url and append the dashboard path
    const dashUrl = `${window.location.origin}/insights/dashboard`;
    // redirect to the dash board
    window.location.href = dashUrl;
  };

  const lockedState = (
    <Bullseye>
      <EmptyState variant={EmptyStateVariant.sm}>
        <EmptyStateHeader
          icon={<EmptyStateIcon icon={LockIcon} />}
          titleText="Planning is not yet enabled for your organization"
          headingLevel="h2"
        />
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

  // Cannot use the ErrorState with customFooter since there are errors with it.
  // This is basically the same as ErrorState only with custom action at the bottom.
  const timeoutState = (
    <Bullseye>
      <EmptyState variant={EmptyStateVariant.sm}>
        <EmptyStateHeader
          // the color could be imported from @patternfly/react-tokens/dist/esm/global_danger_color_100,
          // but the import doesn't work
          icon={<EmptyStateIcon icon={ExclamationCircleIcon} color="var(--pf-v5-global--danger-color--100)" />}
          titleText="Timeout reached when calculating response"
          headingLevel="h2"
        />
        <EmptyStateBody>This is a known issue that we are working to resolve.</EmptyStateBody>
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

  if (error) {
    if (String(error.message) === 'Error: Workspace filtering is not yet implemented') {
      // corner case with workspace filtering, we need different error message
      return lockedState;
    } else if (error.status_code) {
      if (error.status_code === 504) {
        // Corner case, making user experience a little bit better.
        // can be removed when https://issues.redhat.com/browse/RSPEED-1515 is fixed
        return timeoutState;
      }
    }
    return <ErrorState errorTitle="Failed to load data" errorDescription={String(error.message)} />;
  }

  const emptyState = (
    <Bullseye>
      <EmptyState variant={EmptyStateVariant.sm}>
        <EmptyStateHeader
          icon={<EmptyStateIcon icon={SearchIcon} />}
          titleText="No results found"
          headingLevel="h2"
        />
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

  const renderContent = () => {
    if (nameFilter !== '' && (filteredTableData.length === 0 || filteredChartData.length === 0)) {
      return emptyState;
    }

    // TEMPORARY BUG FIX for https://github.com/patternfly/patternfly-react/issues/11724
    // RSPEED-908
    // When the bug is resolved, this can be removed and just the LifecycleChart component can be used.
    // NOTE: The LifecycleChartSystem is 1:1 copy of LifecycleChart, just needs to be separated.
    const ChartComponent =
      lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE ? LifecycleChartSystem : LifecycleChart;

    return (
      <>
        <ChartComponent lifecycleData={filteredChartData} viewFilter={selectedViewFilter} />
        <LifecycleTable data={filteredTableData} viewFilter={selectedViewFilter} />
      </>
    );
  };

  return (
    <React.Fragment>
      <Stack hasGutter>
        <Card>
          <LifecycleFilters
            nameFilter={nameFilter}
            setNameFilter={(name: string) => onNameFilterChange(name)}
            setIsLoading={(isLoading: boolean) => setIsLoading(isLoading)}
            setError={(error: ErrorObject) => setError(error)}
            lifecycleDropdownValue={lifecycleDropdownValue}
            setLifecycleDropdownValue={setLifecycleDropdownValue}
            onLifecycleDropdownSelect={onLifecycleDropdownSelect}
            selectedChartSortBy={chartSortByValue}
            setSelectedChartSortBy={updateChartSortValue}
            downloadCSV={downloadCSV}
            selectedViewFilter={selectedViewFilter}
            handleViewFilterChange={handleViewFilterChange}
            noDataAvailable={noDataAvailable}
          />
          {renderContent()}
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
