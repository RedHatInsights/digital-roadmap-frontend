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
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import { getLifecycleAppstreams, getLifecycleSystems } from '../../api';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
import { useSearchParams } from 'react-router-dom';
import { buildURL, checkValidityOfQueryParam } from '../../utils/utils';
import {
  DEFAULT_CHART_SORTBY_VALUE,
  DEFAULT_DROPDOWN_VALUE,
  OTHER_DROPDOWN_VALUES,
  filterChartDataByName,
  filterChartDataByRelease,
  filterChartDataByReleaseDate,
  filterChartDataByRetirementDate,
  filterChartDataBySystems,
} from './filteringUtils';
const LifecycleChart = lazy(
  () => import('../../Components/LifecycleChart/LifecycleChart')
);
const LifecycleChartSystem = lazy(
  () => import('../../Components/LifecycleChartSystem/LifecycleChartSystem')
);
const LifecycleFilters = lazy(
  () => import('../../Components/LifecycleFilters/LifecycleFilters')
);
const LifecycleTable = lazy(
  () => import('../../Components/LifecycleTable/LifecycleTable')
);
import { download, generateCsv, mkConfig } from 'export-to-csv';
import ErrorState from '@patternfly/react-component-groups/dist/dynamic/ErrorState';
import { formatDate, getLifecycleType, getNewName } from '../../utils/utils';
import { Filter } from '../../types/Filter';

const DEFAULT_FILTERS = {
  name: '',
  chartSortBy: DEFAULT_CHART_SORTBY_VALUE,
  lifecycleDropdown: DEFAULT_DROPDOWN_VALUE,
};

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {
  const [systemLifecycleChanges, setSystemLifecycleChanges] = useState<
    SystemLifecycleChanges[]
  >([]);
  const [filteredTableData, setFilteredTableData] = useState<
    SystemLifecycleChanges[] | Stream[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject>();
  const [noDataAvailable, setNoDataAvailable] = useState<boolean>(false);
  const [filteredChartData, setFilteredChartData] = useState<
    SystemLifecycleChanges[] | Stream[]
  >([]);
  const [appLifecycleChanges, setAppLifecycleChanges] = useState<Stream[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  // drop down menu
  const [lifecycleDropdownValue, setLifecycleDropdownValue] =
    React.useState<string>(DEFAULT_DROPDOWN_VALUE);
  const [chartSortByValue, setChartSortByValue] = React.useState<string>(
    DEFAULT_CHART_SORTBY_VALUE
  );
  const [filters, setFilters] = useState<Filter>(DEFAULT_FILTERS);

  const csvConfig = mkConfig({ useKeysAsHeaders: true });

  const updateChartSortValue = (value: string) => {
    setChartSortByValue(value);
    const newFilters = structuredClone(filters);
    newFilters['chartSortBy'] = value;
    setFilters(newFilters);
    setSearchParams(buildURL(newFilters));
    setFilteredChartData(
      filterChartData(filteredChartData, value, lifecycleDropdownValue)
    );
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

    // Update filtered data based on dropdown selection
    if (
      value === DEFAULT_DROPDOWN_VALUE ||
      value === OTHER_DROPDOWN_VALUES[0]
    ) {
      // Filter from the full dataset each time
      const filteredAppData = filterAppDataByDropdown(
        fullAppLifecycleChanges,
        value
      );
      setAppLifecycleChanges(filteredAppData); // Update the app lifecycle data state
      setFilteredTableData(filteredAppData);
      setFilteredChartData(
        filterChartDataByRetirementDate(filteredAppData, value)
      );
    } else if (value === OTHER_DROPDOWN_VALUES[1]) {
      setFilteredTableData(systemLifecycleChanges);
      setFilteredChartData(
        filterChartDataByRetirementDate(systemLifecycleChanges, value)
      );
    }
  };

  const updateLifecycleData = (data: SystemLifecycleChanges[]) => {
    return data.map((datum) => {
      datum.name = getNewName(
        datum.name,
        datum.major,
        datum.minor,
        datum.lifecycle_type
      );
      return datum;
    });
  };

  const updateAppLifecycleData = (data: Stream[]) => {
    if (lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE) {
      return data.filter(
        (stream) => stream?.rolling === false && stream.os_major === 9
      );
    } else if (lifecycleDropdownValue === OTHER_DROPDOWN_VALUES[0]) {
      return data.filter(
        (stream) => stream?.rolling === false && stream.os_major === 8
      );
    }
    return data;
  };

  const checkNameQueryParam = (
    data: Stream[] | SystemLifecycleChanges[],
    dropdownValue: string
  ) => {
    if (nameQueryParam !== null) {
      setNameFilter(nameQueryParam);
      doInitialFilter(nameQueryParam, data, dropdownValue);
    } else {
      let chartData;
      if (
        sortByParam &&
        checkValidityOfQueryParam('sortByQueryParam', sortByParam)
      ) {
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

  const filterInitialData = (
    appStreams: Stream[],
    updatedSystems: SystemLifecycleChanges[]
  ) => {
    if (dropdownQueryParam && dropdownQueryParam === DEFAULT_DROPDOWN_VALUE) {
      checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
      setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
      return;
    }
    if (dropdownQueryParam && dropdownQueryParam === OTHER_DROPDOWN_VALUES[0]) {
      checkNameQueryParam(appStreams, OTHER_DROPDOWN_VALUES[0]);
      setLifecycleDropdownValue(OTHER_DROPDOWN_VALUES[0]);
      return;
    }
    if (dropdownQueryParam && dropdownQueryParam === OTHER_DROPDOWN_VALUES[1]) {
      checkNameQueryParam(updatedSystems, OTHER_DROPDOWN_VALUES[1]);
      setLifecycleDropdownValue(OTHER_DROPDOWN_VALUES[1]);
      return;
    }
    checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
    setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
  };
  // Add a state for the full app lifecycle data
  const [fullAppLifecycleChanges, setFullAppLifecycleChanges] = useState<
    Stream[]
  >([]);

  const fetchData = async () => {
    setIsLoading(true);
    setNoDataAvailable(false);
    try {
      const systemData = await getLifecycleSystems();
      const appData = await getLifecycleAppstreams();
      const upcomingChangesParagraphs = systemData.data || [];
      // Store the full data set
      const allAppStreams = appData.data || [];
      setFullAppLifecycleChanges(allAppStreams);

      // Filter based on current dropdown value
      const appStreams = filterAppDataByDropdown(
        allAppStreams,
        dropdownQueryParam || DEFAULT_DROPDOWN_VALUE
      );
      setAppLifecycleChanges(appStreams);
      // Check if both data sources are empty
      if (upcomingChangesParagraphs.length === 0 || appStreams.length === 0) {
        setNoDataAvailable(true);
        return;
      }
      setSystemLifecycleChanges(upcomingChangesParagraphs);

      const updatedSystems = updateLifecycleData(upcomingChangesParagraphs);
      setSystemLifecycleChanges(updatedSystems);
      filterInitialData(appStreams, updatedSystems);
    } catch (error: any) {
      console.error('Error fetching lifecycle changes:', error);
      setError({ message: error });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to filter app data based on dropdown value
  const filterAppDataByDropdown = (
    data: Stream[],
    dropdownValue: string
  ): Stream[] => {
    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      return data.filter(
        (stream) => stream?.rolling === false && stream.os_major === 9
      );
    } else if (dropdownValue === OTHER_DROPDOWN_VALUES[0]) {
      return data.filter(
        (stream) => stream?.rolling === false && stream.os_major === 8
      );
    }
    return data;
  };

  const nameQueryParam = searchParams.get('name');
  const dropdownQueryParam = searchParams.get('lifecycleDropdown');
  const sortByParam = searchParams.get('chartSortBy');

  useEffect(() => {
    fetchData();
  }, []);

  // Update resetDataFiltering to use the properly filtered app data
  const resetDataFiltering = () => {
    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === OTHER_DROPDOWN_VALUES[0]
    ) {
      setFilteredTableData(appLifecycleChanges);
      const chartData = filterChartData(
        appLifecycleChanges,
        chartSortByValue,
        lifecycleDropdownValue
      );
      setFilteredChartData(chartData);
    } else if (lifecycleDropdownValue === OTHER_DROPDOWN_VALUES[1]) {
      setFilteredTableData(systemLifecycleChanges);
      const chartData = filterChartData(
        systemLifecycleChanges,
        chartSortByValue,
        lifecycleDropdownValue
      );
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

  const doInitialFilter = (
    name: string,
    data: Stream[] | SystemLifecycleChanges[],
    dropdownValue: string
  ) => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];

    if (
      dropdownValue === DEFAULT_DROPDOWN_VALUE ||
      dropdownValue === OTHER_DROPDOWN_VALUES[0]
    ) {
      currentDataSource = (data as Stream[]).filter((datum) => {
        // also check for streams.stream value
        return `${datum.name.toLowerCase()} ${datum.stream}`.includes(
          name.toLowerCase()
        );
      });
    } else if (dropdownValue === OTHER_DROPDOWN_VALUES[1]) {
      currentDataSource = (data as SystemLifecycleChanges[]).filter((datum) => {
        const product = `${datum.name.toLowerCase()} ${datum.major}.${
          datum.minor
        }`;
        return product.includes(name.toLowerCase());
      });
    }
    setFilteredTableData(currentDataSource);
    let chartData;

    if (
      sortByParam &&
      checkValidityOfQueryParam('sortByQueryParam', sortByParam)
    ) {
      chartData = filterChartData(
        currentDataSource,
        sortByParam,
        dropdownValue
      );
      setChartSortByValue(sortByParam);
    } else {
      chartData = filterChartData(
        currentDataSource,
        chartSortByValue,
        dropdownValue
      );
    }
    setFilteredChartData(chartData);
    return currentDataSource;
  };

  const doFilter = (name: string) => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];

    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === OTHER_DROPDOWN_VALUES[0]
    ) {
      currentDataSource = appLifecycleChanges.filter((datum) => {
        // also check for streams.stream value
        return `${datum.name.toLowerCase()} ${datum.stream.toLowerCase()}`.includes(
          name.toLowerCase()
        );
      });
    } else if (lifecycleDropdownValue === OTHER_DROPDOWN_VALUES[1]) {
      currentDataSource = systemLifecycleChanges.filter((datum) => {
        const product = `${datum.name.toLowerCase()} ${datum.major}.${
          datum.minor
        }`;
        return product.includes(name.toLowerCase());
      });
    }

    setFilteredTableData(currentDataSource);
    const chartData = filterChartData(
      currentDataSource,
      chartSortByValue,
      lifecycleDropdownValue
    );
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

  const resetFilters = () => {
    setNameFilter('');
    setFilteredTableData(systemLifecycleChanges);
    setFilteredChartData(systemLifecycleChanges);
    setFilters(DEFAULT_FILTERS);
  };

  const downloadCSV = () => {
    const data: { [key: string]: string | number }[] = [];
    if (
      lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
      lifecycleDropdownValue === OTHER_DROPDOWN_VALUES[0]
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
    } else if (lifecycleDropdownValue === OTHER_DROPDOWN_VALUES[1]) {
      (filteredTableData as SystemLifecycleChanges[]).forEach(
        (item: SystemLifecycleChanges) =>
          data.push({
            Name: item.name,
            'Release date': formatDate(item.release_date),
            'Retirement date': formatDate(item.retirement_date),
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
    return (
      <ErrorState
        errorTitle="Failed to load data"
        errorDescription={String(error.message)}
      />
    );
  }

  // New error state for when no data is available
  if (noDataAvailable) {
    return (
      <Bullseye>
        <EmptyState variant={EmptyStateVariant.lg}>
          <EmptyStateHeader
            icon={<EmptyStateIcon icon={CubesIcon} />}
            titleText="No lifecycle data available"
            headingLevel="h2"
          />
          <EmptyStateBody>
            We could not find any Life Cycle data. Either no data exists in the
            system or there was a problem retrieving it.
          </EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={fetchData}>
                Try again
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    );
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
    if (
      nameFilter !== '' &&
      (filteredTableData.length === 0 || filteredChartData.length === 0)
    ) {
      return emptyState;
    }

    // TEMPORARY BUG FIX for https://github.com/patternfly/patternfly-react/issues/11724
    // RSPEED-908
    // When the bug is resolved, this can be removed and just the LifecycleChart component can be used.
    // NOTE: The LifecycleChartSystem is 1:1 copy of LifecycleChart, just needs to be separated.
    const ChartComponent =
      lifecycleDropdownValue === OTHER_DROPDOWN_VALUES[1]
        ? LifecycleChartSystem
        : LifecycleChart;

    return (
      <>
        <ChartComponent lifecycleData={filteredChartData} />
        <LifecycleTable data={filteredTableData} />
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
          />
          {renderContent()}
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
