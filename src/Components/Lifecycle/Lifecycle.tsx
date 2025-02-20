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
const LifecycleChart = lazy(() => import('../../Components/LifecycleChart/LifecycleChart'));
const LifecycleFilters = lazy(() => import('../../Components/LifecycleFilters/LifecycleFilters'));
const LifecycleTable = lazy(() => import('../../Components/LifecycleTable/LifecycleTable'));

const DEFAULT_DROPDOWN_VALUE = 'RHEL 9 Application Streams';

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
  const [chartSortByValue, setChartSortByValue] = React.useState<string>('Name');

  const updateChartSortValue = (value: string) => {
    setChartSortByValue(value);
    filterChartData(value);
  };

  const onLifecycleDropdownSelect = (value: string) => {
    if (value === DEFAULT_DROPDOWN_VALUE) {
      setFilteredTableData(appLifecycleChanges);
      setFilteredChartData(appLifecycleChanges);
    } else {
      setFilteredTableData(systemLifecycleChanges);
      setFilteredChartData(systemLifecycleChanges);
    }
    setNameFilter('');
    setChartSortByValue('Name');
  };

  const getLifecycleType = (lifecycleType: string) => {
    switch (lifecycleType) {
      case 'eus':
        return ' EUS';
      case 'e4s':
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
      const upcomingChangesParagraphs = systemData || [];
      const appStreams = updateAppLifecycleData(appData.data) || [];
      setSystemLifecycleChanges(upcomingChangesParagraphs);
      setAppLifecycleChanges(appStreams);
      const updatedSystems = updateLifecycleData(upcomingChangesParagraphs);
      setSystemLifecycleChanges(updatedSystems);
      if (lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE) {
        setFilteredTableData(appStreams);
        setFilteredChartData(appStreams);
      } else {
        setFilteredTableData(updatedSystems);
        setFilteredChartData(updatedSystems);
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
      setFilteredChartData(appLifecycleChanges);
    } else {
      setFilteredTableData(systemLifecycleChanges);
      setFilteredChartData(systemLifecycleChanges);
    }
  };

  const filterChartDataByName = () => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];
    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      currentDataSource = appLifecycleChanges.sort((a: Stream, b: Stream) => {
        console.log(a);
        console.log('pizza');
        const aName = `${a.name.toLowerCase()} ${a.stream.toLowerCase()}`;
        const bName = `${b.name.toLowerCase()} ${b.stream.toLowerCase()}`;
        if (aName > bName) return -1;
        if (aName < bName) return 1;
        return 0;
      });
    } else {
      currentDataSource = systemLifecycleChanges.sort((a, b) => {
        const aName = `${a.name.toLowerCase()} ${a.major}.${a.minor}`;
        const bName = `${b.name.toLowerCase()} ${b.major}.${b.minor}`;
        if (aName > bName) return -1;
        if (aName < bName) return 1;
        return 0;
      });
    }
    return currentDataSource;
  };

  const filterChartDataByReleaseDate = () => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];
    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      currentDataSource = appLifecycleChanges.sort((a: Stream, b: Stream) => {
        if (a.start_date > b.start_date) return -1;
        if (a.start_date < b.start_date) return 1;
        return 0;
      });
    } else {
      currentDataSource = systemLifecycleChanges.sort((a, b) => {
        if (a.release_date > b.release_date) return -1;
        if (a.release_date < b.release_date) return 1;
        return 0;
      });
    }
    return currentDataSource;
  };

  const filterChartDataByRetirementDate = () => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];
    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      currentDataSource = appLifecycleChanges.sort((a: Stream, b: Stream) => {
        if (a.end_date > b.end_date) return -1;
        if (a.end_date < b.end_date) return 1;
        return 0;
      });
    } else {
      currentDataSource = systemLifecycleChanges.sort((a, b) => {
        if (a.retirement_date > b.retirement_date) return -1;
        if (a.retirement_date < b.retirement_date) return 1;
        return 0;
      });
    }
    return currentDataSource;
  };

  const filterChartDataByRelease = () => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];
    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      currentDataSource = appLifecycleChanges.sort((a: Stream, b: Stream) => {
        if (a.rhel_major_version > b.rhel_major_version) return -1;
        if (a.rhel_major_version < b.rhel_major_version) return 1;
        return 0;
      });
    } else {
      currentDataSource = systemLifecycleChanges.sort((a, b) => {
        const aVer = `${a.major}.${a.minor}`;
        const bVer = `${b.major}.${b.minor}`;
        if (aVer > bVer) return -1;
        if (aVer < bVer) return 1;
        return 0;
      });
    }
    return currentDataSource;
  };

  const filterChartDataBySystems = () => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];
    if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
      currentDataSource = appLifecycleChanges.sort((a: Stream, b: Stream) => {
        if (a.systems > b.systems) return -1;
        if (a.systems < b.systems) return 1;
        return 0;
      });
    } else {
      currentDataSource = systemLifecycleChanges.sort((a, b) => {
        if (a.systems > b.systems) return -1;
        if (a.systems < b.systems) return 1;
        return 0;
      });
    }
    return currentDataSource;
  };

  const filterChartData = (sortBy: string) => {
    let currentDataSource: Stream[] | SystemLifecycleChanges[] = [];

    switch (sortBy) {
      case 'Name':
        currentDataSource = filterChartDataByName();
        break;
      case 'Release (version)':
        currentDataSource = filterChartDataByRelease();
        break;
      case 'Release date':
        currentDataSource = filterChartDataByReleaseDate();
        break;
      case 'Retirement date':
        currentDataSource = filterChartDataByRetirementDate();
        break;
      case 'Systems (number of)':
        currentDataSource = filterChartDataBySystems();
        break;
      default:
        return;
    }

    setFilteredChartData(currentDataSource);
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
      setFilteredChartData(currentDataSource);
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
          />
          {renderContent()}
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
