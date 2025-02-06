import './Lifecycle.scss';
import React, { Suspense, lazy, useEffect, useState } from 'react';
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
  Text,
  TextContent,
  TextVariants,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { ErrorObject } from '../../types/ErrorObject';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { getLifecycleAppstreams, getLifecycleSystems } from '../../api';
import { AppLifecycleChanges } from '../../types/AppLifecycleChanges';
import { LifecycleChanges } from '../../types/LifecycleChanges';
const SelectOptionVariations = lazy(() => import('../FilterComponents/LifecycleDropdown'));
const LifecycleChart = lazy(() => import('../../Components/LifecycleChart/LifecycleChart'));
const LifecycleFilters = lazy(() => import('../../Components/LifecycleFilters/LifecycleFilters'));
const LifecycleTable = lazy(() => import('../../Components/LifecycleTable/LifecycleTable'));

// Start = y0, end = y
const lifecycleChartData = [
  [{ x: 'RHEL 8.3', y0: new Date('2023-01'), y: new Date('2024-06'), packageType: 'Retired' }],
  [
    {
      x: 'RHEL 8.7',
      y0: new Date('2023-01'),
      y: new Date('2025-10'),
      packageType: 'Support ends within 6 months',
    },
  ],
  [{ x: 'RHEL 9.0', y0: new Date('2024-08'), y: new Date('2025-06'), packageType: 'Not installed' }],
  [{ x: 'RHEL 9.1', y0: new Date('2023-01'), y: new Date('2027-10'), packageType: 'Supported' }],
];

const DEFAULT_DROPDOWN_VALUE = 'RHEL 9 Application Streams';

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {
  const [relevantLifecycleChanges, setLifecycleChanges] = useState<LifecycleChanges[]>([]);
  const [filteredTableData, setFilteredTableData] = useState<LifecycleChanges[] | AppLifecycleChanges[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject>();
  const [filteredChartData, setFilteredChartData] = useState(lifecycleChartData);
  const [appLifecycleChanges, setAppLifecycleChanges] = useState<AppLifecycleChanges[]>([]);
  // drop down menu
  const [dropdownValue, setDropdownValue] = React.useState<string>(DEFAULT_DROPDOWN_VALUE);

  const onDropdownSelect = (value: string) => {
    if (value === DEFAULT_DROPDOWN_VALUE) {
      setFilteredTableData(appLifecycleChanges);
    } else {
      setFilteredTableData(relevantLifecycleChanges);
    }
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

  const updateLifecycleData = (data: any[]) => {
    return data.map((datum) => {
      datum.name = getNewName(datum.name, datum.major, datum.minor, datum.lifecycle_type);
      return datum;
    });
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getLifecycleSystems();
      const appData = await getLifecycleAppstreams();
      const upcomingChangesParagraphs = data || [];
      const appStreams = appData.data || [];
      setLifecycleChanges(upcomingChangesParagraphs);
      setAppLifecycleChanges(appStreams);
      const tableData = updateLifecycleData(upcomingChangesParagraphs);
      setLifecycleChanges(tableData);
      if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
        setFilteredTableData(appStreams);
      } else {
        setFilteredTableData(tableData);
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

  // TODO fixme filtering
  const filterData = (name: string) => {
    let currentDataSource: AppLifecycleChanges[] | LifecycleChanges[] = [];
    if (nameFilter !== '') {
      const newChartData = lifecycleChartData.filter((datum) => datum[0].x.toLowerCase().includes(name.toLowerCase()));
      setFilteredChartData(newChartData);

      if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
        currentDataSource = appLifecycleChanges.filter((datum) => {
          // also check for streams.stream value
          return datum.module_name.toLowerCase().includes(name.toLowerCase());
        });
      } else {
        currentDataSource = relevantLifecycleChanges.filter((datum) => {
          const product = `${datum.name.toLowerCase()} ${datum.major}.${datum.minor}`;
          return product.includes(name.toLowerCase());
        });
      }
      setFilteredTableData(currentDataSource);
    } else {
      if (dropdownValue === DEFAULT_DROPDOWN_VALUE) {
        setFilteredTableData(appLifecycleChanges);
      } else {
        setFilteredTableData(relevantLifecycleChanges);
      }
      setFilteredChartData(lifecycleChartData);
    }
  };

  const onNameFilterChange = (name: string) => {
    setNameFilter(name);
    filterData(name);
  };

  const resetFilters = () => {
    setNameFilter('');
    setFilteredChartData(lifecycleChartData);
    setFilteredTableData(relevantLifecycleChanges);
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

  const items = (
    <>
      <ToolbarItem style={{ alignSelf: 'center' }}>
        <TextContent>
          <Text component={TextVariants.h6}>Lifecycle</Text>
        </TextContent>
      </ToolbarItem>
      <ToolbarItem variant="bulk-select">
        <Suspense fallback={<Spinner />}>
          <SelectOptionVariations
            currentValue={dropdownValue}
            setCurrentValue={(value: string) => setDropdownValue(value)}
            onDropdownSelect={onDropdownSelect}
          />
        </Suspense>
      </ToolbarItem>
    </>
  );

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
          <Toolbar id="toolbar-items-example">
            <ToolbarContent alignItems={'center'}>{items}</ToolbarContent>
          </Toolbar>
          <LifecycleFilters
            nameFilter={nameFilter}
            setNameFilter={(name: string) => onNameFilterChange(name)}
            setIsLoading={(isLoading: boolean) => setIsLoading(isLoading)}
            setError={(error: ErrorObject) => setError(error)}
          />
          {renderContent()}
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
