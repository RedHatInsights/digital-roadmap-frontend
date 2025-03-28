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
import { getLifecycleAppstreams, getLifecycleSystems } from '../../api';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
import { useSearchParams } from 'react-router-dom';
import { buildURL, checkValidityOfQueryParam } from '../../utils/utils';
import {
  DEFAULT_CHART_SORTBY_VALUE,
  DEFAULT_DROPDOWN_VALUE,
  OTHER_DROPDOWN_VALUE,
  filterChartDataByName,
  filterChartDataByRelease,
  filterChartDataByReleaseDate,
  filterChartDataByRetirementDate,
  filterChartDataBySystems,
} from './filteringUtils';
const LifecycleChart = lazy(() => import('../../Components/LifecycleChart/LifecycleChart'));
const LifecycleFilters = lazy(() => import('../../Components/LifecycleFilters/LifecycleFilters'));
const LifecycleTable = lazy(() => import('../../Components/LifecycleTable/LifecycleTable'));
import { download, generateCsv, mkConfig } from 'export-to-csv';
import ErrorState from "@patternfly/react-component-groups/dist/dynamic/ErrorState";
import { formatDate, getLifecycleType, getNewName } from '../../utils/utils';

export interface Filter {
  name: string;
  chartSortBy: string;
  lifecycleDropdown: string;
}

const DEFAULT_FILTERS = {
  name: '',
  chartSortBy: DEFAULT_CHART_SORTBY_VALUE,
  lifecycleDropdown: DEFAULT_DROPDOWN_VALUE,
};

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {
  const [systemLifecycleChanges, setSystemLifecycleChanges] = useState<SystemLifecycleChanges[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject>();
  const [filteredChartData, setFilteredChartData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [appLifecycleChanges, setAppLifecycleChanges] = useState<Stream[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  // drop down menu
  const [lifecycleDropdownValue, setLifecycleDropdownValue] = React.useState<string>(DEFAULT_DROPDOWN_VALUE);
  const [chartSortByValue, setChartSortByValue] = React.useState<string>(DEFAULT_CHART_SORTBY_VALUE);
  const [filters, setFilters] = useState<Filter>(DEFAULT_FILTERS);

  const csvConfig = mkConfig({ useKeysAsHeaders: true });

  const updateChartSortValue = (value: string) => {
    setChartSortByValue(value);
    const newFilters = structuredClone(filters);
    newFilters['chartSortBy'] = value;
    setFilters(newFilters);
    setSearchParams(buildURL(newFilters));
    setFilteredChartData(filterChartData(filteredChartData, value, lifecycleDropdownValue));
  };

  const onLifecycleDropdownSelect = (value: string) => {
    if (value === DEFAULT_DROPDOWN_VALUE) {
      setFilteredTableData(appLifecycleChanges);
      setFilteredChartData(filterChartDataByRetirementDate(appLifecycleChanges, DEFAULT_DROPDOWN_VALUE));
    } else {
      setFilteredTableData(systemLifecycleChanges);
      setFilteredChartData(filterChartDataByRetirementDate(systemLifecycleChanges, OTHER_DROPDOWN_VALUE));
    }
    setNameFilter('');
    setChartSortByValue(DEFAULT_CHART_SORTBY_VALUE);
    const newFilters = structuredClone(filters);
    newFilters['lifecycleDropdown'] = value;
    setFilters(newFilters);
    setSearchParams(buildURL(newFilters));
  };

  const updateLifecycleData = (data: SystemLifecycleChanges[]) => {
    return data.map((datum) => {
      datum.name = getNewName(datum.name, datum.major, datum.minor, datum.lifecycle_type);
      return datum;
    });
  };

  const updateAppLifecycleData = (data: Stream[]) => {
    return data.filter((stream) => stream?.rolling === false && stream.os_major === 9);
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
    if (dropdownQueryParam && dropdownQueryParam === OTHER_DROPDOWN_VALUE) {
      checkNameQueryParam(updatedSystems, OTHER_DROPDOWN_VALUE);
      setLifecycleDropdownValue(OTHER_DROPDOWN_VALUE);
      return;
    }
    checkNameQueryParam(appStreams, DEFAULT_DROPDOWN_VALUE);
    setLifecycleDropdownValue(DEFAULT_DROPDOWN_VALUE);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const systemData = await getLifecycleSystems();
      const appData = await getLifecycleAppstreams();
      const upcomingChangesParagraphs = systemData.data || [];
      const appStreams = updateAppLifecycleData(appData.data) || [];
      setSystemLifecycleChanges(upcomingChangesParagraphs);
      setAppLifecycleChanges(appStreams);
      const updatedSystems = updateLifecycleData(upcomingChangesParagraphs);
      setSystemLifecycleChanges(updatedSystems);
      filterInitialData(appStreams, updatedSystems);
    } catch (error: any) {
      console.error('Error fetching lifecycle changes:', error);
      setError({message: error});
    } finally {
      setIsLoading(false);
    }
  };

  const nameQueryParam = searchParams.get('name');
  const dropdownQueryParam = searchParams.get('lifecycleDropdown');
  const sortByParam = searchParams.get('chartSortBy');

  useEffect(() => {
    fetchData();
  }, []);

  const resetDataFiltering = () => {
    if (lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE) {
      setFilteredTableData(appLifecycleChanges);
      const chartData = filterChartData(appLifecycleChanges, chartSortByValue, DEFAULT_DROPDOWN_VALUE);
      setFilteredChartData(chartData);
    } else {
      setFilteredTableData(systemLifecycleChanges);
      const chartData = filterChartData(systemLifecycleChanges, chartSortByValue, OTHER_DROPDOWN_VALUE);
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

    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      currentDataSource = (data as Stream[]).filter((datum) => {
        // also check for streams.stream value
        return `${datum.name.toLowerCase()} ${datum.stream}`.includes(name.toLowerCase());
      });
    } else {
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

    if (lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE) {
      currentDataSource = appLifecycleChanges.filter((datum) => {
        // also check for streams.stream value
        return `${datum.name.toLowerCase()} ${datum.stream.toLowerCase()}`.includes(name.toLowerCase());
      });
    } else {
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
    if (nameFilter !== '') {
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
    if (lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE) {
      (filteredTableData as Stream[]).forEach((item: Stream) =>
        data.push({
          Name: item.name,
          Release: item.os_major,
          'Release date': formatDate(item.start_date),
          'Retirement date': formatDate(item.end_date),
          Systems: item.count,
        })
      );
    } else {
      (filteredTableData as SystemLifecycleChanges[]).forEach((item: SystemLifecycleChanges) =>
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
    return <ErrorState errorTitle="Failed to load data" errorDescription={ String(error.message) }/>;
  }

  const emptyState = (
    <Bullseye>
      <EmptyState variant={EmptyStateVariant.sm}>
        <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} titleText="No results found" headingLevel="h2" />
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

    return (
      <>
        <LifecycleChart lifecycleData={filteredChartData} />
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
