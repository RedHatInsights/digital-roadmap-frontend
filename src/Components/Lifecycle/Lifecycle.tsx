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
import { AppLifecycleChanges } from '../../types/AppLifecycleChanges';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
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
import { formatDate } from '../../utils/utils';

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {
  const [systemLifecycleChanges, setSystemLifecycleChanges] = useState<SystemLifecycleChanges[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject>();
  const [filteredChartData, setFilteredChartData] = useState<SystemLifecycleChanges[] | Stream[]>([]);
  const [appLifecycleChanges, setAppLifecycleChanges] = useState<Stream[]>([]);
  // drop down menu
  const [lifecycleDropdownValue, setLifecycleDropdownValue] = React.useState<string>(DEFAULT_DROPDOWN_VALUE);
  const [chartSortByValue, setChartSortByValue] = React.useState<string>(DEFAULT_CHART_SORTBY_VALUE);

  const csvConfig = mkConfig({ useKeysAsHeaders: true });

  const updateChartSortValue = (value: string) => {
    setChartSortByValue(value);
    setFilteredChartData(filterChartData(filteredChartData, value));
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
  };

  const getLifecycleType = (lifecycleType: string) => {
    switch (lifecycleType) {
      case 'EUS':
        return ' EUS';
      case 'ELS':
        return ' ELS';
      case 'E4S':
        return ' for SAP';
      default:
        return '';
    }
  };

  const getNewName = (name: string, major: number, minor: number, lifecycleType: string) => {
    const lifecycleText = getLifecycleType(lifecycleType);
    return `${name} ${major}.${minor}${lifecycleText}`;
  };

  const updateLifecycleData = (data: SystemLifecycleChanges[]) => {
    return data.map((datum) => {
      datum.name = getNewName(datum.name, datum.major, datum.minor, datum.lifecycle_type);
      return datum;
    });
  };

  const updateAppLifecycleData = (data: AppLifecycleChanges[]): Stream[] => {
    return data
      .flatMap((repo) => repo.streams)
      .map((stream) => {
        const version = data.filter((appLifecycleChanges) =>
          appLifecycleChanges.streams.some((str) => str.context === stream.context)
        )[0].rhel_major_version;
        stream.rhel_major_version = version;
        return stream;
      });
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
      if (lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE) {
        setFilteredTableData(appStreams);
        setFilteredChartData(filterChartDataByRetirementDate(appStreams, DEFAULT_DROPDOWN_VALUE));
      } else {
        setFilteredTableData(updatedSystems);
        setFilteredChartData(filterChartDataByRetirementDate(updatedSystems, OTHER_DROPDOWN_VALUE));
      }
    } catch (error) {
      console.error('Error fetching lifecycle changes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetDataFiltering = () => {
    if (lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE) {
      setFilteredTableData(appLifecycleChanges);
      const chartData = filterChartData(appLifecycleChanges, chartSortByValue);
      setFilteredChartData(chartData);
    } else {
      setFilteredTableData(systemLifecycleChanges);
      const chartData = filterChartData(systemLifecycleChanges, chartSortByValue);
      setFilteredChartData(chartData);
    }
  };

  const filterChartData = (
    data: Stream[] | SystemLifecycleChanges[],
    sortBy: string
  ): Stream[] | SystemLifecycleChanges[] => {
    switch (sortBy) {
      case 'Name':
        return filterChartDataByName(data, lifecycleDropdownValue);
      case 'Release version':
        return filterChartDataByRelease(data, lifecycleDropdownValue);
      case 'Release date':
        return filterChartDataByReleaseDate(data, lifecycleDropdownValue);
      case 'Retirement date':
        return filterChartDataByRetirementDate(data, lifecycleDropdownValue);
      case 'Systems':
        return filterChartDataBySystems(data, lifecycleDropdownValue);
      default:
        return filteredChartData;
    }
  };

  const filterData = (name: string) => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];
    if (nameFilter !== '') {
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
      const chartData = filterChartData(currentDataSource, chartSortByValue);
      setFilteredChartData(chartData);
    } else {
      resetDataFiltering();
    }
  };

  const onNameFilterChange = (name: string) => {
    setNameFilter(name);
    filterData(name);
  };

  const resetFilters = () => {
    setNameFilter('');
    setFilteredTableData(systemLifecycleChanges);
    setFilteredChartData(systemLifecycleChanges);
  };

  const downloadCSV = () => {
    const data: { [key: string]: string | number }[] = [];
    if (lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE) {
      (filteredTableData as Stream[]).forEach((item: Stream) =>
        data.push({
          Name: item.name,
          Release: item.rhel_major_version,
          'Release date': formatDate(item.start_date),
          'Retirement date': formatDate(item.end_date),
          Systems: 'N/A',
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
    return <div>{error.message}</div>;
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
        <LifecycleTable
          data={filteredTableData}
          type={lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ? 'streams' : 'rhel'}
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
