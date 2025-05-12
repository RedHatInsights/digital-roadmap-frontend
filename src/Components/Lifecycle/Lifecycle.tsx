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
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Stack,
} from '@patternfly/react-core';
import { ErrorObject } from '../../types/ErrorObject';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
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
  
  const csvConfig = mkConfig({ useKeysAsHeaders: true });

  const updateChartSortValue = (value: string) => {
    setChartSortByValue(value);
    const newFilters = structuredClone(filters);
    newFilters['chartSortBy'] = value;
    setFilters(newFilters);
    setSearchParams(buildURL(newFilters));
    setFilteredChartData(filterChartData(filteredChartData, value, lifecycleDropdownValue));
  };

  // Update the dropdown handler to use the full dataset each time
  const onLifecycleDropdownSelect = (value: string) => {
    setLifecycleDropdownValue(value);
    const newFilters = structuredClone(filters);
    newFilters['lifecycleDropdown'] = value;
    setFilters(newFilters);
    setSearchParams(buildURL(newFilters));

    // Reset other filters when changing dropdown
    setNameFilter('');
    setChartSortByValue(DEFAULT_CHART_SORTBY_VALUE);

    // Update filtered data based on dropdown selection between RHEL 8 and 9 Application Streams
    if (value === DEFAULT_DROPDOWN_VALUE || value === RHEL_8_STREAMS_DROPDOWN_VALUE) {
      // Filter from the full dataset each time
      const filteredAppData = filterAppDataByDropdown(fullAppLifecycleChanges, value);
      setAppLifecycleChanges(filteredAppData); // Update the app lifecycle data state
      setFilteredTableData(filteredAppData);
      setFilteredChartData(filterChartDataByRetirementDate(filteredAppData, value));
      // Update filtered data based on dropdown selection of RHEL Systems
    } else if (value === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      setFilteredTableData(systemLifecycleChanges);
      setFilteredChartData(filterChartDataByRetirementDate(systemLifecycleChanges, value));
    }
  };

  // First data fetch - called only once
  const initializeData = async (viewFilter: string) => {
    setIsLoading(true);
    setNoDataAvailable(false);

    try {
      // Fetch all data sets once
      const relevantSystemResponse = await getRelevantLifecycleSystems();
      const relevantAppResponse = await getRelevantLifecycleAppstreams();
      const allSystemResponse = await getAllLifecycleSystems();
      const allAppResponse = await getAllLifecycleAppstreams();

      // Store all fetched data in state
      const relatedInstalledSystems = relevantSystemResponse.data || [];
      const relatedInstalledApps = relevantAppResponse.data || [];
      const allSystems = allSystemResponse.data || [];
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

      // Check if relevant data is empty
      const hasRelevantData = relatedInstalledSystems.length > 0 && relatedInstalledApps.length > 0;
      setNoDataAvailable(!hasRelevantData);

      // Use the explicitly passed viewFilter or default to selectedViewFilter
      let currentViewFilter = viewFilter || selectedViewFilter;

      // If no relevant data exists and we're not already in "all" view,
      // switch to "all" view automatically
      if (!hasRelevantData && currentViewFilter !== 'all') {
        currentViewFilter = 'all';
        setSelectedViewFilter('all');
        const newFilters = structuredClone(filters) as ExtendedFilter;
        newFilters.viewFilter = 'all';
        setFilters(newFilters);
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
      setFullAppLifecycleChanges([...appData]);

      // Filter based on current dropdown value
      const appStreams = filterAppDataByDropdown([...appData], dropdownQueryParam || DEFAULT_DROPDOWN_VALUE);
      setAppLifecycleChanges(appStreams);

      // Process the data without waiting for state updates
      if (systemData.length > 0 || appStreams.length > 0) {
        // Update and set the system lifecycle data
        const updatedSystems = updateLifecycleData(systemData);
        setSystemLifecycleChanges(updatedSystems);

        // Apply filters based on URL parameters
        // Directly using the data we already have instead of relying on state variables
        if (dropdownQueryParam && dropdownQueryParam === DEFAULT_DROPDOWN_VALUE) {
          checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
          setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
        } else if (dropdownQueryParam && dropdownQueryParam === RHEL_8_STREAMS_DROPDOWN_VALUE) {
          checkNameQueryParam(appStreams, RHEL_8_STREAMS_DROPDOWN_VALUE);
          setLifecycleDropdownValue(RHEL_8_STREAMS_DROPDOWN_VALUE);
        } else if (dropdownQueryParam && dropdownQueryParam === RHEL_SYSTEMS_DROPDOWN_VALUE) {
          checkNameQueryParam(updatedSystems, RHEL_SYSTEMS_DROPDOWN_VALUE);
          setLifecycleDropdownValue(RHEL_SYSTEMS_DROPDOWN_VALUE);
        } else {
          checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
          setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
        }
      } else {
        // If no data, at least initialize empty arrays
        setFilteredTableData([]);
        setFilteredChartData([]);
      }
    } catch (error: any) {
      console.error('Error fetching lifecycle changes:', error);
      setError({ message: error });
    } finally {
      setIsLoading(false);
    }
  };

  // Process the cached data without making API calls
  const processData = (viewFilter: string) => {
    // Use the appropriate cached data based on the current view filter
    const systemData = selectSystemDataSource(viewFilter);
    const appData = selectAppDataSource(viewFilter);

    // Store the full app data set
    setFullAppLifecycleChanges([...appData]);

    // Filter based on current dropdown value
    const appStreams = filterAppDataByDropdown([...appData], dropdownQueryParam || DEFAULT_DROPDOWN_VALUE);
    setAppLifecycleChanges(appStreams);

    // Exit early if no data in the current view
    if (systemData.length === 0 || appStreams.length === 0) {
      setFilteredTableData([]);
      setFilteredChartData([]);
      return;
    }

    // Update and set the system lifecycle data (without modifying original data)
    const updatedSystems = updateLifecycleData(systemData);
    setSystemLifecycleChanges(updatedSystems);

    // Apply filters based on URL parameters
    filterInitialData(appStreams, updatedSystems);
  };

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
    // Store the view filter we'll be using (for debugging and to ensure consistency)

    if (!dataInitialized) {
      // First load - initialize all data with the explicit viewFilter
      initializeData(viewFilter);
    } else {
      // Already have data - just process with current filter
      setIsLoading(true);

      // Check if relevant data is available
      const hasRelevantData = installedSystemData.length > 0 && installedAppData.length > 0;
      setNoDataAvailable(!hasRelevantData);

      // Auto-switch to "all" view if needed
      if (!hasRelevantData && viewFilter !== 'all') {
        viewFilter = 'all';
        setSelectedViewFilter('all');
        const newFilters = structuredClone(filters) as ExtendedFilter;
        newFilters.viewFilter = 'all';
        setFilters(newFilters);
        setSearchParams(buildURL(newFilters));
      }

      // Process cached data with the explicit viewFilter
      processData(viewFilter);
      setIsLoading(false);
    }
  };

  // Update the view filter handler to use cached data
  const handleViewFilterChange = (filter: string) => {
    console.log('View filter changed to:', filter);
    setSelectedViewFilter(filter);
    const newFilters = structuredClone(filters) as ExtendedFilter;
    newFilters.viewFilter = filter;
    setFilters(newFilters);
    setSearchParams(buildURL(newFilters));

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

  const checkNameQueryParam = (data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
    if (nameQueryParam !== null) {
      setNameFilter(nameQueryParam);
      doInitialFilter(nameQueryParam, data, dropdownValue);
    } else {
      let chartData;
      if (sortByParam && checkValidityOfQueryParam('sortByQueryParam', sortByParam)) {
        chartData = filterChartData(data, sortByParam, dropdownValue);
        setChartSortByValue(sortByParam);
        setFilteredChartData(chartData);
      } else {
        chartData = filterChartDataByRetirementDate(data, dropdownValue);
        setFilteredChartData(chartData);
      }

      setFilteredTableData(data);
    }
  };

  const filterInitialData = (appStreams: Stream[], updatedSystems: SystemLifecycleChanges[]) => {
    if (dropdownQueryParam && dropdownQueryParam === DEFAULT_DROPDOWN_VALUE) {
      checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
      setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
      return;
    }
    if (dropdownQueryParam && dropdownQueryParam === RHEL_8_STREAMS_DROPDOWN_VALUE) {
      checkNameQueryParam(appStreams, RHEL_8_STREAMS_DROPDOWN_VALUE);
      setLifecycleDropdownValue(RHEL_8_STREAMS_DROPDOWN_VALUE);
      return;
    }
    if (dropdownQueryParam && dropdownQueryParam === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      checkNameQueryParam(updatedSystems, RHEL_SYSTEMS_DROPDOWN_VALUE);
      setLifecycleDropdownValue(RHEL_SYSTEMS_DROPDOWN_VALUE);
      return;
    }
    checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
    setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
  };

  const nameQueryParam = searchParams.get('name');
  const dropdownQueryParam = searchParams.get('lifecycleDropdown');
  const sortByParam = searchParams.get('chartSortBy');
  const viewFilterParam = searchParams.get('viewFilter');

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
  }, []);

  // Update resetDataFiltering to use the properly filtered app data
  const resetDataFiltering = () => {
    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE
    ) {
      setFilteredTableData(appLifecycleChanges);
      const chartData = filterChartData(appLifecycleChanges, chartSortByValue, lifecycleDropdownValue);
      setFilteredChartData(chartData);
    } else if (lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      setFilteredTableData(systemLifecycleChanges);
      const chartData = filterChartData(systemLifecycleChanges, chartSortByValue, lifecycleDropdownValue);
      setFilteredChartData(chartData);
    }
  };

  const filterChartData = (
    data: Stream[] | SystemLifecycleChanges[],
    sortBy: string,
    dropdownValue: string
  ): Stream[] | SystemLifecycleChanges[] => {
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
        return filteredChartData;
    }
  };

  const doInitialFilter = (name: string, data: Stream[] | SystemLifecycleChanges[], dropdownValue: string) => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];

    if (dropdownValue === DEFAULT_DROPDOWN_VALUE || dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
      currentDataSource = (data as Stream[]).filter((datum) => {
        return `${datum.display_name.toLowerCase()}`.includes(name.toLowerCase());
      });
    } else if (dropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      currentDataSource = (data as SystemLifecycleChanges[]).filter((datum) => {
        const product = `${datum.name.toLowerCase()} ${datum.major}.${datum.minor}`;
        return product.includes(name.toLowerCase());
      });
    }
    setFilteredTableData(currentDataSource);
    let chartData;

    if (sortByParam && checkValidityOfQueryParam('sortByQueryParam', sortByParam)) {
      chartData = filterChartData(currentDataSource, sortByParam, dropdownValue);
      setChartSortByValue(sortByParam);
    } else {
      chartData = filterChartData(currentDataSource, chartSortByValue, dropdownValue);
    }
    setFilteredChartData(chartData);
    return currentDataSource;
  };

  const doFilter = (name: string) => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];

    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE
    ) {
      currentDataSource = appLifecycleChanges.filter((datum) => {
        return `${datum.display_name.toLowerCase()}`.includes(name.toLowerCase());
      });
    } else if (lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE) {
      currentDataSource = systemLifecycleChanges.filter((datum) => {
        const product = `${datum.name.toLowerCase()} ${datum.major}.${datum.minor}`;
        return product.includes(name.toLowerCase());
      });
    }

    setFilteredTableData(currentDataSource);
    const chartData = filterChartData(currentDataSource, chartSortByValue, lifecycleDropdownValue);
    setFilteredChartData(chartData);
    return currentDataSource;
  };

  const filterData = (name: string) => {
    if (name !== '') {
      doFilter(name);
    } else {
      resetDataFiltering();
    }
  };

  const onNameFilterChange = (name: string) => {
    setNameFilter(name);
    filterData(name);
    const newFilters = structuredClone(filters);
    newFilters['name'] = name;
    setFilters(newFilters);
    setSearchParams(buildURL(newFilters));
  };

  // Update resetFilters to use cached data
  const resetFilters = () => {
    setNameFilter('');
    setFilteredTableData(systemLifecycleChanges);
    setFilteredChartData(systemLifecycleChanges);
    setFilters(DEFAULT_FILTERS);
    setSelectedViewFilter('installed-only');

    // Use the cached data
    fetchData('installed-only');
  };

  // Helper function to filter app data based on dropdown value
  const filterAppDataByDropdown = (data: Stream[], dropdownValue: string): Stream[] => {
    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      return data.filter((stream) => stream?.rolling === false && stream.os_major === 9);
    } else if (dropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) {
      return data.filter((stream) => stream?.rolling === false && stream.os_major === 8);
    }
    return data;
  };

  const downloadCSV = () => {
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

  // placeholder for later
  if (error) {
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
}
export default LifecycleTab;
