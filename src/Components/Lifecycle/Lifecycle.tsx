import './Lifecycle.scss';
import React, { lazy, useEffect, useState } from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import {
  Bullseye,
  Button,
  Card,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
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
import { download, generateCsv, mkConfig } from 'export-to-csv';
import ErrorState from '@patternfly/react-component-groups/dist/dynamic/ErrorState';
import { formatDate, getNewName } from '../../utils/utils';
import { ExtendedFilter } from '../../types/Filter';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

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
  const [isLoading, setIsLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject>();
  const [noDataAvailable, setNoDataAvailable] = useState<boolean>(false);
  const [filteredChartData, setFilteredChartData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [appLifecycleChanges, setAppLifecycleChanges] = useState<Stream[]>([]);
  // Add a state for the full app lifecycle data
  const [fullAppLifecycleChanges, setFullAppLifecycleChanges] = useState<Stream[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  // drop down menu
  const [lifecycleDropdownValue, setLifecycleDropdownValue] = React.useState<string>(DEFAULT_DROPDOWN_VALUE);
  const [chartSortByValue, setChartSortByValue] = React.useState<string>(DEFAULT_CHART_SORTBY_VALUE);
  const [chartDirection, setChartDirection] = React.useState<string>('asc');
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

  const [filterField, setFilterField] = useState<'Name' | 'Version'>('Name');
  const [rhelVersionOptions, setRhelVersionOptions] = useState<string[]>([]);
  const [rhelVersionFilter, setRhelVersionFilter] = useState<string[]>([]);

  const [isSwitchingView, setIsSwitchingView] = useState(false);
  const [appsSwitchKey, setAppsSwitchKey] = useState(0);

  const [disableInstalledOnly, setDisableInstalledOnly] = useState<boolean>(false);

  const csvConfig = mkConfig({ useKeysAsHeaders: true });

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

  // Helper function to determine if data is available for current dropdown and view
  const checkDataAvailability = (
    dropdownValue: string,
    viewFilter: string,
    allSystems?: SystemLifecycleChanges[],
    relatedSystems?: SystemLifecycleChanges[],
    allApps?: Stream[],
    relatedApps?: Stream[],
    installedSystems?: SystemLifecycleChanges[],
    installedApps?: Stream[]
  ) => {
    // Use passed data if available, otherwise fall back to state
    const systemDataAll = allSystems ?? allSystemData;
    const systemDataRelated = relatedSystems ?? relatedSystemData;
    const systemDataInstalled = installedSystems ?? installedSystemData;

    const appDataAll = allApps ?? allAppData;
    const appDataRelated = relatedApps ?? relatedAppData;
    const appDataInstalled = installedApps ?? installedAppData;

    if (dropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      // For systems dropdown, only check system data
      if (viewFilter === 'all') {
        return systemDataAll.length > 0;
      }
      const sysData = viewFilter === 'installed-and-related' ? systemDataRelated : systemDataInstalled;
      return getSystemsCountForDropdown(sysData) > 0;
    }

    if (viewFilter === 'all') {
      return filterAppDataByDropdown(appDataAll, dropdownValue).length > 0;
    }

    const appData = viewFilter === 'installed-and-related' ? appDataRelated : appDataInstalled;
    return getAppCountForDropdown(appData, dropdownValue) > 0;
  };

  // Helper function to determine if we should show noDataAvailable for current dropdown
  const shouldShowNoDataAvailable = (
    dropdownValue: string,
    relatedSystems?: SystemLifecycleChanges[],
    relatedApps?: Stream[]
  ) => {
    const sysRelated = relatedSystems ?? relatedSystemData;
    const appRelated = relatedApps ?? relatedAppData;

    if (dropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      // For systems dropdown, check if we have any installed/related systems
      return getSystemsCountForDropdown(sysRelated) === 0;
    } else {
      // For app stream dropdowns, check if we have any installed/related apps for this specific dropdown
      return getAppCountForDropdown(appRelated, dropdownValue) === 0;
    }
  };

  // Unified filter application to ensure consistent filtering
  const applyAllActiveFilters = (
    data: Stream[] | SystemLifecycleChanges[],
    dropdownValue: string,
    nameFilterValue: string,
    field: 'Name' | 'Version' = filterField,
    versions: string[] = rhelVersionFilter
  ) => {
    let filteredData = data;

    if (
      [DEFAULT_DROPDOWN_VALUE, RHEL_8_STREAMS_DROPDOWN_VALUE, RHEL_10_STREAMS_DROPDOWN_VALUE].includes(
        dropdownValue
      )
    ) {
      if (nameFilterValue) {
        filteredData = (data as Stream[]).filter((datum) =>
          `${datum.display_name.toLowerCase()}`.includes(nameFilterValue.toLowerCase())
        );
      }
    } else if (dropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      let result = data as SystemLifecycleChanges[];

      if (Array.isArray(versions) && versions.length > 0) {
        result = result.filter((datum) => versions.includes(`RHEL ${datum.major}`));
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

  const onLifecycleDropdownSelect = (value: string) => {
    setIsSwitchingView(true);

    const wasAppStream = isAppStream(lifecycleDropdownValue);
    const willBeAppStream = isAppStream(value);
    const isCrossDomainSwitch = wasAppStream !== willBeAppStream;
    const nextNameFilter = isCrossDomainSwitch ? '' : nameFilter;

    if (isCrossDomainSwitch) {
      setNameFilter('');
      setRhelVersionFilter([]);
      setFilterField('Name');
      updateFilters({ name: '', versions: [] });

      setAppsSwitchKey((k) => k + 1);
    }

    setLifecycleDropdownValue(value);
    updateFilters({ lifecycleDropdown: value });

    const disableInstalledOnlyValue = computeDisableInstalledOnly(value);
    setDisableInstalledOnly(disableInstalledOnlyValue);

    // Set noDataAvailable based on the specific dropdown type
    setNoDataAvailable(shouldShowNoDataAvailable(value));

    // Auto-switch to 'all' view if no data in current view
    let effectiveViewFilter = selectedViewFilter;

    if (disableInstalledOnlyValue && effectiveViewFilter === 'installed-only') {
      effectiveViewFilter = 'installed-and-related';
      setSelectedViewFilter(effectiveViewFilter);
      updateFilters({ viewFilter: effectiveViewFilter });
    }

    if (!checkDataAvailability(value, effectiveViewFilter) && effectiveViewFilter !== 'all') {
      const hasInstalledAndRelated = checkDataAvailability(value, 'installed-and-related');
      if (effectiveViewFilter === 'installed-only' && hasInstalledAndRelated) {
        effectiveViewFilter = 'installed-and-related';
      } else {
        effectiveViewFilter = 'all';
      }
      setSelectedViewFilter(effectiveViewFilter);
      updateFilters({ viewFilter: effectiveViewFilter });
    }

    // Apply all current filters to the new data
    processData(effectiveViewFilter, value, nextNameFilter);

    // Schedule resetting the "isSwitchingView" flag after the current microtask to avoid rendering conflicts.
    queueMicrotask?.(() => setIsSwitchingView(false));
  };

  const computeDisableInstalledOnly = (
    dropdownValue: string,
    installedSystems?: SystemLifecycleChanges[],
    relatedSystems?: SystemLifecycleChanges[],
    installedApps?: Stream[],
    relatedApps?: Stream[]
  ) => {
    const sysInstalled = installedSystems ?? installedSystemData;
    const sysRelated = relatedSystems ?? relatedSystemData;
    const appInstalled = installedApps ?? installedAppData;
    const appRelated = relatedApps ?? relatedAppData;

    if (dropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      return getSystemsCountForDropdown(sysInstalled) === 0 && getSystemsCountForDropdown(sysRelated) > 0;
    }

    const installedCount = getAppCountForDropdown(appInstalled, dropdownValue);
    const relatedCount = getAppCountForDropdown(appRelated, dropdownValue);

    return installedCount === 0 && relatedCount > 0;
  };

  // First data fetch - called only once
  const initializeData = async (viewFilter: string) => {
    setIsLoading(true);
    setNoDataAvailable(false);

    try {
      // Fetch data in parallel
      const results = await Promise.allSettled([
        getRelevantLifecycleSystems(),
        getRelevantLifecycleAppstreams(),
        getAllLifecycleSystems(),
        getAllLifecycleAppstreams(),
      ]);

      // If any of them has an error, propagate the exception to be handled and error is displayed
      // The order of items in array needs to match with order in the Promise.allSettled()
      const [relevantSystemResponse, relevantAppResponse, allSystemResponse, allAppResponse] = results.map(
        (result) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          // if not fullfiled, there is a exception
          throw result.reason;
        }
      );

      // Store all fetched data in state
      const relatedInstalledSystems = relevantSystemResponse.data || [];
      const relatedInstalledApps = relevantAppResponse.data || [];
      // filter out system data with null minor field
      const allSystems = (allSystemResponse.data || []).filter(
        (datum: SystemLifecycleChanges) => datum.minor !== null
      );
      const allApps = allAppResponse.data || [];

      // Filter out from the instlled & related list of Stream and SystemLifecycleChanges only the installed ones
      // API is set to provide instlled & related and by this filter we can lower the number of API requests
      const installedSystems = [
        ...relatedInstalledSystems.filter((datum: SystemLifecycleChanges) => datum.related === false),
      ];
      const installedApps = [...relatedInstalledApps.filter((datum: Stream) => datum.related === false)];

      // Store the data in state
      setRelatedSystemData(relatedInstalledSystems);
      setRelatedAppData(relatedInstalledApps);
      setAllSystemData(allSystems);
      setAllAppData(allApps);
      setInstalledAppData(installedApps);
      setInstalledSystemData(installedSystems);

      // Mark data as initialized
      setDataInitialized(true);

      // Use the explicitly passed viewFilter or default to selectedViewFilter
      let currentViewFilter = viewFilter || selectedViewFilter;
      const currentDropdown = dropdownQueryParam || DEFAULT_DROPDOWN_VALUE;

      // Check if there's data available for the current dropdown and view filter
      const hasDataForCurrentView = checkDataAvailability(
        currentDropdown,
        currentViewFilter,
        allSystems,
        relatedInstalledSystems,
        allApps,
        relatedInstalledApps,
        installedSystems,
        installedApps
      );

      // Auto-switch strategy:
      // installed-only -> installed-and-related (if available) -> all
      if (!hasDataForCurrentView && currentViewFilter !== 'all') {
        if (currentViewFilter === 'installed-only') {
          const hasDataForInstalledAndRelated = checkDataAvailability(
            currentDropdown,
            'installed-and-related',
            allSystems,
            relatedInstalledSystems,
            allApps,
            relatedInstalledApps,
            installedSystems,
            installedApps
          );

          if (hasDataForInstalledAndRelated) {
            currentViewFilter = 'installed-and-related';
            setSelectedViewFilter('installed-and-related');
            updateFilters({ viewFilter: 'installed-and-related' });
          } else {
            currentViewFilter = 'all';
            setSelectedViewFilter('all');
            updateFilters({ viewFilter: 'all' });
          }
        } else {
          currentViewFilter = 'all';
          setSelectedViewFilter('all');
          updateFilters({ viewFilter: 'all' });
        }
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
      setFullAppLifecycleChanges([...appData]);

      // Filter based on current dropdown value
      const appStreams = filterAppDataByDropdown([...appData], currentDropdown);
      setAppLifecycleChanges(appStreams);

      // Process the data without waiting for state updates
      if (systemData.length > 0 || appStreams.length > 0) {
        // Update and set the system lifecycle data
        const updatedSystems = updateLifecycleData(systemData);
        setSystemLifecycleChanges(updatedSystems);

        // Apply filters based on URL parameters
        // Directly using the data we already have instead of relying on state variables
        filterInitialData(appStreams, updatedSystems);
      } else {
        // If no data, at least initialize empty arrays
        setFilteredTableData([]);
        setFilteredChartData([]);
      }

      // calculate RHEL version options
      const dynOptions = computeRhelVersionOptions(allSystems);
      setRhelVersionOptions(dynOptions);
      if (versionsParam) {
        const wanted = decodeURIComponent(versionsParam)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const valid = wanted.filter((v) => dynOptions.includes(v));
        setRhelVersionFilter(valid);

        updateFilters({ versions: valid });

        const finalDropdownValue = dropdownQueryParam || DEFAULT_DROPDOWN_VALUE;
        if (finalDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
          const dataForSystems = updateLifecycleData(systemData);
          setSystemLifecycleChanges(dataForSystems);
          applyAllActiveFilters(
            dataForSystems,
            RHEL_SYSTEMS_DROPDOWN_VALUE,
            nameQueryParam ?? '',
            'Version',
            valid
          );
        }
      } else {
        setRhelVersionFilter([]);
      }

      // Set noDataAvailable based on the actual dropdown that will be used
      // Pass the actual fetched data instead of relying on state
      const finalDropdownValue = dropdownQueryParam || DEFAULT_DROPDOWN_VALUE;
      const noDataValue = shouldShowNoDataAvailable(
        finalDropdownValue,
        relatedInstalledSystems,
        relatedInstalledApps
      );

      const disableInstalledOnlyValue = computeDisableInstalledOnly(
        finalDropdownValue,
        installedSystems,
        relatedInstalledSystems,
        installedApps,
        relatedInstalledApps
      );
      setDisableInstalledOnly(disableInstalledOnlyValue);

      // If user is on installed-only but it would be empty while installed-and-related has data,
      // automatically switch to installed-and-related.
      if (disableInstalledOnlyValue && currentViewFilter === 'installed-only') {
        currentViewFilter = 'installed-and-related';
        setSelectedViewFilter('installed-and-related');
        updateFilters({ viewFilter: 'installed-and-related' });
      }

      console.log('Initial load noDataAvailable check:', {
        finalDropdownValue,
        relatedSystemsCount: relatedInstalledSystems.length,
        relatedAppsCount: relatedInstalledApps.length,
        noDataValue,
      });

      setNoDataAvailable(noDataValue);
    } catch (error: any) {
      console.error('Error fetching lifecycle changes:', error);
      setError({ message: error.message, status_code: error.status_code });
    } finally {
      setIsLoading(false);
    }
  };

  // Updated processData function with dropdown-specific no data handling
  const processData = (viewFilter: string, dropdownValue: string, nameFilterValue: string) => {
    const isSystemsDropdown = dropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE;

    // Check data availability for current dropdown and view
    const hasDataForCurrentView = checkDataAvailability(dropdownValue, viewFilter);
    setNoDataAvailable(shouldShowNoDataAvailable(dropdownValue));

    // Exit early if no data in the current view for current dropdown
    if (!hasDataForCurrentView) {
      setFilteredTableData([]);
      setFilteredChartData([]);
      return;
    }

    if (isSystemsDropdown) {
      const systemData = selectSystemDataSource(viewFilter);
      const updatedSystems = updateLifecycleData(systemData);
      setSystemLifecycleChanges(updatedSystems);
      applyAllActiveFilters(updatedSystems, dropdownValue, nameFilterValue);
      return;
    }

    const appData = selectAppDataSource(viewFilter);
    setFullAppLifecycleChanges([...appData]);
    const appStreams = filterAppDataByDropdown([...appData], dropdownValue);
    setAppLifecycleChanges(appStreams);
    applyAllActiveFilters(appStreams, dropdownValue, nameFilterValue);
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

  const selectSystemDataSource = (filter: string) => {
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
  };

  const selectAppDataSource = (filter: string) => {
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
  };

  // Updated fetchData that uses cached data
  const fetchData = (viewFilter = selectedViewFilter) => {
    if (!dataInitialized) {
      // First load - initialize all data with the explicit viewFilter
      initializeData(viewFilter);
    } else {
      let effectiveViewFilter = viewFilter;
      // Already have data - just process with current filter
      setIsLoading(true);

      // Check if relevant data is available for current dropdown
      const hasRelevantData = checkDataAvailability(lifecycleDropdownValue, viewFilter);

      // Set noDataAvailable based on the specific dropdown type
      setNoDataAvailable(shouldShowNoDataAvailable(lifecycleDropdownValue));

      const disableInstalledOnlyValue = computeDisableInstalledOnly(lifecycleDropdownValue);
      setDisableInstalledOnly(disableInstalledOnlyValue);

      if (disableInstalledOnlyValue && viewFilter === 'installed-only') {
        setSelectedViewFilter('installed-and-related');
        updateFilters({ viewFilter: 'installed-and-related' });
        // Re-run with effective view
        processData('installed-and-related', lifecycleDropdownValue, nameFilter);
        setIsLoading(false);
        return;
      }

      if (!hasRelevantData && viewFilter !== 'all') {
        // Prefer "installed-and-related" over "all" when "installed-only" is empty but related has data.
        if (viewFilter === 'installed-only') {
          const hasInstalledAndRelatedData = checkDataAvailability(
            lifecycleDropdownValue,
            'installed-and-related'
          );

          if (hasInstalledAndRelatedData) {
            effectiveViewFilter = 'installed-and-related';
            setSelectedViewFilter('installed-and-related');
            updateFilters({ viewFilter: 'installed-and-related' });
          } else {
            effectiveViewFilter = 'all';
            setSelectedViewFilter('all');
            updateFilters({ viewFilter: 'all' });
          }
        } else {
          effectiveViewFilter = 'all';
          setSelectedViewFilter('all');
          updateFilters({ viewFilter: 'all' });
        }
      }

      // Process cached data with the explicit viewFilter
      processData(effectiveViewFilter, lifecycleDropdownValue, nameFilter);
      setIsLoading(false);
    }
  };

  // Update the view filter handler to use cached data
  const handleViewFilterChange = (filter: string) => {
    console.log('View filter changed to:', filter);
    // Prevent selecting "installed-only" when it's intentionally disabled
    if (filter === 'installed-only' && disableInstalledOnly) {
      setSelectedViewFilter('installed-and-related');
      updateFilters({ viewFilter: 'installed-and-related' });
      fetchData('installed-and-related');
      return;
    }

    setSelectedViewFilter(filter);
    updateFilters({ viewFilter: filter });

    // Process data with the new filter - no API call
    fetchData(filter);
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

  // Updated to use unified filtering
  const checkNameQueryParam = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
    if (nameQueryParam !== null) {
      setNameFilter(nameQueryParam);
      // Use our unified filter function
      applyAllActiveFilters(data, dropdownValue, nameQueryParam);
    } else {
      let chartData;
      if (sortByParam && checkValidityOfQueryParam('sortByQueryParam', sortByParam)) {
        const effectiveOrder = orderParam ?? getDefaultOrder(sortByParam);
        setChartSortByValue(sortByParam);
        setChartDirection(effectiveOrder);
        chartData = filterChartData(data, sortByParam, dropdownValue, effectiveOrder);
        setFilteredChartData(chartData);
      } else {
        const defaultSort = DEFAULT_CHART_SORTBY_VALUE;
        const effectiveOrder = getDefaultOrder(defaultSort);
        setChartSortByValue(defaultSort);
        setChartDirection(effectiveOrder);
        chartData = filterChartData(data, defaultSort, dropdownValue, effectiveOrder);
        setFilteredChartData(chartData);
      }

      setFilteredTableData(data);
    }
  };

  // Use checkNameQueryParam for URL parameter handling
  const filterInitialData = (appStreams: Stream[], updatedSystems: SystemLifecycleChanges[]) => {
    // Set the correct dropdown value first
    if (dropdownQueryParam && dropdownQueryParam === DEFAULT_DROPDOWN_VALUE) {
      setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
      checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
    } else if (dropdownQueryParam && dropdownQueryParam === RHEL_8_STREAMS_DROPDOWN_VALUE) {
      setLifecycleDropdownValue(RHEL_8_STREAMS_DROPDOWN_VALUE);
      checkNameQueryParam(appStreams, RHEL_8_STREAMS_DROPDOWN_VALUE);
    } else if (dropdownQueryParam && dropdownQueryParam === RHEL_10_STREAMS_DROPDOWN_VALUE) {
      setLifecycleDropdownValue(RHEL_10_STREAMS_DROPDOWN_VALUE);
      checkNameQueryParam(appStreams, RHEL_10_STREAMS_DROPDOWN_VALUE);
    } else if (dropdownQueryParam && dropdownQueryParam === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      setLifecycleDropdownValue(RHEL_SYSTEMS_DROPDOWN_VALUE);
      checkNameQueryParam(updatedSystems, RHEL_SYSTEMS_DROPDOWN_VALUE);
    } else {
      setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
      checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
    }
  };

  const nameQueryParam = searchParams.get('name');
  const dropdownQueryParam = searchParams.get('lifecycleDropdown');
  const sortByParam = searchParams.get('chartSortBy');
  const orderParam = searchParams.get('chartOrder');
  const viewFilterParam = searchParams.get('viewFilter');
  const versionsParam = searchParams.get('versions');

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

    initialFilters.viewFilter = initialViewFilter;

    setLifecycleDropdownValue(initialFilters.lifecycleDropdown ?? DEFAULT_DROPDOWN_VALUE);
    setChartSortByValue(initialFilters.chartSortBy ?? DEFAULT_CHART_SORTBY_VALUE);
    setChartDirection(initialFilters.chartOrder as 'asc' | 'desc');

    updateFilters(() => initialFilters);

    // Initialize data with the correct view filter
    fetchData(initialViewFilter);
  }, []);

  useEffect(() => {
    const dataSource =
      lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE ? systemLifecycleChanges : appLifecycleChanges;

    applyAllActiveFilters(dataSource, lifecycleDropdownValue, nameFilter, filterField, rhelVersionFilter);
  }, [
    nameFilter,
    rhelVersionFilter,
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

      applyAllActiveFilters(dataSource, lifecycleDropdownValue, name);
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
      applyAllActiveFilters(dataSource, lifecycleDropdownValue, '', filterField, rhelVersionFilter);
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
    setSearchParams(buildURL(DEFAULT_FILTERS));

    // Use the cached data
    fetchData('installed-only');
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

  const downloadCSV = () => {
    const data: { [key: string]: string | number }[] = [];
    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE ||
      lifecycleDropdownValue === RHEL_10_STREAMS_DROPDOWN_VALUE
    ) {
      (filteredTableData as Stream[]).forEach((item: Stream) =>
        data.push({
          Name: item.display_name,
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
  };

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

  // Cannot use the ErrorState with customFooter since there are errors with it.
  // This is basically the same as ErrorState only with custom action at the bottom.
  const timeoutState = (
    <Bullseye>
      <EmptyState
        headingLevel="h2"
        icon={ExclamationCircleIcon}
        titleText="Timeout reached when calculating response"
        variant={EmptyStateVariant.sm}
      >
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
    return <ErrorState titleText="Failed to load data" bodyText={String(error.message)} />;
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

  const renderContent = () => {
    const LoadingComponent = (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );

    if (nameFilter !== '' && (filteredTableData.length === 0 || filteredChartData.length === 0)) {
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
      return isLoading ? (
        LoadingComponent
      ) : (
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
          key={`${isSystemsView ? 'systems' : 'apps'}:${selectedViewFilter}:${chartSortByValue}`}
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
            downloadCSV={downloadCSV}
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
            rhelVersionOptions={rhelVersionOptions}
            initialRhelVersions={rhelVersionFilter}
            resetOnAppsSwitchKey={appsSwitchKey}
            disableInstalledOnly={disableInstalledOnly}
          />
          {renderContent()}
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
