import './lifecycle.scss';
import React, { lazy, Suspense, useEffect, useState } from 'react';
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
  MenuToggle,
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
const SelectOptionVariations = lazy(() => import('../FilterComponents/LifecycleDropdown'));
const LifecycleChart = lazy(() => import('../../Components/LifecycleChart/lifecycleChart'));
const LifecycleTable = lazy(() => import('../../Components/LifecycleTable/lifecycleTable'));
const LifecycleFilters = lazy(() => import('../../Components/LifecycleFilters/LifecycleFilters'));
const AppLifecycleTable = lazy(() => import('../../Components/AppLifecycleTable/appLifecycleTable'));

type LifecycleChanges = {
  name: string;
  release: string;
  major: number;
  minor: number;
  release_date: Date;
  retirement_date: Date;
  systems: number;
  lifecycle_type: string;
};

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

type dataAppLifeCycleChanges = {
  data: AppLifecycleChanges[];
};

const LifecycleColumnNames = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release Date',
  retirement_date: 'Retirement Date',
  systems: 'Systems',
};

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {
  const emptyLifecycleChanges: LifecycleChanges[] = [];
  const [relevantLifecycleChanges, setLifecycleChanges] = useState(emptyLifecycleChanges);
  const [filteredTableData, setFilteredTableData] = useState(emptyLifecycleChanges);
  const [isLoading, setIsLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [error, setError] = useState<ErrorObject>();
  const [filteredChartData, setFilteredChartData] = useState(lifecycleChartData);
  // drop down menu
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string>('RHEL 9 Application Streams');

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    // eslint-disable-next-line no-console
    console.log('selected', value);
    setSelected(value as string);
    setIsOpen(false);
  };

  const toggle = (toggleRef: React.Ref<HTMLDivElement | HTMLButtonElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={onToggleClick}
      isExpanded={isOpen}
      style={
        {
          width: '400px',
        } as React.CSSProperties
      }
    >
      {selected}
    </MenuToggle>
  );

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

  // const emptyAppLifecycleChanges: dataAppLifeCycleChanges[] = []
  // const [AppLifecycleChanges, setAppLifecycleChanges] = useState(emptyAppLifecycleChanges);
  const [AppLifecycleChanges, setAppLifecycleChanges] = useState<AppLifecycleChanges[]>([]);

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
      setFilteredTableData(tableData);
    } catch (error) {
      console.error('Error fetching lifecycle changes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterData = (name: string) => {
    if (nameFilter !== '') {
      const newChartData = lifecycleChartData.filter((datum) => datum[0].x.toLowerCase().includes(name.toLowerCase()));
      setFilteredChartData(newChartData);
      const newTableData = relevantLifecycleChanges.filter((datum) => {
        const product = `${datum.name.toLowerCase()} ${datum.major}.${datum.minor}`;
        return product.includes(name.toLowerCase());
      });
      setFilteredTableData(newTableData);
    } else {
      setFilteredChartData(lifecycleChartData);
      setFilteredTableData(relevantLifecycleChanges);
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
          <SelectOptionVariations />
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
          {filteredChartData.length === 0 || filteredTableData.length === 0 ? (
            emptyState
          ) : (
            <>
              <LifecycleChart lifecycleData={filteredChartData} />
              <LifecycleTable lifecycleData={filteredTableData} />
              <AppLifecycleTable data={AppLifecycleChanges} />
            </>
          )}
        </Card>
      </Stack>
    </React.Fragment>
  );
};

export default LifecycleTab;
