import './upcoming.scss';
import React, { lazy, useEffect, useState } from 'react';
import {
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
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateVariant,
  Grid,
  GridItem,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { getAllUpcomingChanges, getRelevantUpcomingChanges } from '../../api';
import { UpcomingChanges } from '../../types/UpcomingChanges';
import { ErrorObject } from '../../types/ErrorObject';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import { DEFAULT_FILTERS, buildURL, pluralize } from '../../utils/utils';
import ErrorState from '@patternfly/react-component-groups/dist/dynamic/ErrorState';
import { useSearchParams } from 'react-router-dom';
import { Filter } from '../../types/Filter';

const UpcomingTable = lazy(() => import('../UpcomingTable/UpcomingTable'));

export const UPCOMING_COLUMN_NAMES = {
  name: 'Name',
  type: 'Type',
  release: 'Release',
  date: 'Release date',
};

// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (string: string) => {
  if (!string) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const UpcomingTab: React.FC<React.PropsWithChildren> = () => {
  const emptyUpcomingChanges: UpcomingChanges[] = [];
  const [upcomingChanges, setUpcomingChanges] = React.useState(emptyUpcomingChanges);

  // Add new state variables to store both API responses
  const [allUpcomingChangesData, setAllUpcomingChangesData] = React.useState(emptyUpcomingChanges);
  const [relevantUpcomingChangesData, setRelevantUpcomingChangesData] = React.useState(emptyUpcomingChanges);
  const [dataFetchStatus, setDataFetchStatus] = React.useState({ all: false, relevant: false });

  const [isLoading, setIsLoading] = React.useState(false);
  const [numDeprecations, setNumDeprecations] = React.useState(0);
  const [numAdditions, setNumAdditions] = React.useState(0);
  const [numChanges, setNumChanges] = React.useState(0);
  const [visibleData, setVisibleData] = React.useState<UpcomingChanges[]>(emptyUpcomingChanges);
  const [currentTypeFilters, setCurrentTypeFilters] = React.useState<Set<string>>(new Set());
  const [currentDateFilter, setCurrentDateFilter] = React.useState('');
  const [currentNameFilter, setCurrentNameFilters] = React.useState('');
  const [currentReleaseFilters, setCurrentReleaseFilters] = React.useState<string[]>([]);
  const [error, setError] = React.useState<ErrorObject>();
  const [noDataAvailable, setNoDataAvailable] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersForURL, setFiltersForURL] = React.useState<Filter>(DEFAULT_FILTERS);

  // Add view filter state
  const [selectedViewFilter, setSelectedViewFilter] = useState<string>('relevant');

  const nameParam = searchParams.get('name');
  const typeParam = searchParams.get('type');
  const releaseParam = searchParams.get('release');
  const dateParam = searchParams.get('date');
  const viewFilterParam = searchParams.get('viewFilter');

  // Type comes in as Release1,Release2 or Release1 or any other permutation
  const isValidRelease = (data: UpcomingChanges[], release: string) => {
    const releaseAsArr = release.split(',');
    return releaseAsArr.every((release) =>
      Array.from(new Set(data.map((repo) => repo.release))).includes(release)
    );
  };

  const isValidDate = (data: UpcomingChanges[], date: string) => {
    return Array.from(new Set(data.map((repo) => repo.date))).includes(date);
  };

  // Type comes in as Type1,Type2,Type3 or Type1 or any other permutation
  const isValidType = (data: UpcomingChanges[], type: string) => {
    const typeAsArr = type.split(',');
    return typeAsArr.every((type) =>
      Array.from(new Set(data.map((repo) => repo.type)))
        .map((type) => type)
        .includes(type)
    );
  };

  // Process data and update counts
  const processData = (data: UpcomingChanges[]) => {
    // Calculate counts for different types
    const filteredDeprecations = data.filter((item) => item.type === 'Deprecation');
    setNumDeprecations(filteredDeprecations.length);

    const filteredAdditions = data.filter((item) => item.type === 'Addition' || item.type === 'Enhancement');
    setNumAdditions(filteredAdditions.length);

    const filteredChanges = data.filter((item) => item.type === 'Change');
    setNumChanges(filteredChanges.length);

    setVisibleData(data);
  };

  // Handle view filter changes
  const handleViewFilterChange = (filter: string) => {
    setSelectedViewFilter(filter);
    const newFilters = structuredClone(filtersForURL);
    newFilters['viewFilter'] = filter;
    setFiltersForURL(newFilters);
    setSearchParams(buildURL(newFilters));

    // Use cached data if available, otherwise fetch it
    if (filter === 'all') {
      if (dataFetchStatus.all) {
        // Use cached data
        setUpcomingChanges(allUpcomingChangesData);
        processData(allUpcomingChangesData);
      } else {
        // Fetch data
        fetchData(filter);
      }
    } else {
      if (dataFetchStatus.relevant) {
        // Use cached data
        setUpcomingChanges(relevantUpcomingChangesData);
        processData(relevantUpcomingChangesData);
      } else {
        // Fetch data
        fetchData(filter);
      }
    }
  };

  const fetchData = async (viewFilter?: string) => {
    setIsLoading(true);
    setNoDataAvailable(false);
    const currentViewFilter = viewFilter || selectedViewFilter;

    try {
      // Choose API based on view filter
      if (currentViewFilter === 'all') {
        const response = await getAllUpcomingChanges();
        let upcomingChangesParagraphs: UpcomingChanges[] = response && response.data ? response.data : [];

        // Check if ALL data source is empty - only then show no data state
        if (upcomingChangesParagraphs.length === 0) {
          setNoDataAvailable(true);
          setIsLoading(false);
          return;
        }

        // Process the data to capitalize type values
        upcomingChangesParagraphs = upcomingChangesParagraphs.map((item) => ({
          ...item,
          type: capitalizeFirstLetter(item.type),
        }));

        // Store the all data in state
        setAllUpcomingChangesData(upcomingChangesParagraphs);
        setDataFetchStatus((prev) => ({ ...prev, all: true }));
        setUpcomingChanges(upcomingChangesParagraphs);
        processData(upcomingChangesParagraphs);
      } else {
        // For relevant view, first check if we need to fetch "all" data to verify emptiness
        if (!dataFetchStatus.all) {
          // We need to check if "all" data is empty
          const allResponse = await getAllUpcomingChanges();
          const allData: UpcomingChanges[] = allResponse && allResponse.data ? allResponse.data : [];

          // Store the all data in state
          const processedAllData = allData.map((item) => ({
            ...item,
            type: capitalizeFirstLetter(item.type),
          }));

          setAllUpcomingChangesData(processedAllData);
          setDataFetchStatus((prev) => ({ ...prev, all: true }));

          // If all data is empty, show no data state regardless of current view
          if (allData.length === 0) {
            setNoDataAvailable(true);
            setIsLoading(false);
            return;
          }
        } else if (allUpcomingChangesData.length === 0) {
          // We already know "all" data is empty
          setNoDataAvailable(true);
          setIsLoading(false);
          return;
        }

        // Now fetch relevant data
        const response = await getRelevantUpcomingChanges();
        let upcomingChangesParagraphs: UpcomingChanges[] = response && response.data ? response.data : [];

        // Process the data to capitalize type values
        upcomingChangesParagraphs = upcomingChangesParagraphs.map((item) => ({
          ...item,
          type: capitalizeFirstLetter(item.type),
        }));

        // Store the relevant data in state
        setRelevantUpcomingChangesData(upcomingChangesParagraphs);
        setDataFetchStatus((prev) => ({ ...prev, relevant: true }));
        setUpcomingChanges(upcomingChangesParagraphs);
        processData(upcomingChangesParagraphs);
      }

      // Apply URL parameters
      const newFilters = structuredClone(filtersForURL);

      // Apply URL parameters if this is the initial load
      if (nameParam) {
        const name = decodeURIComponent(nameParam);
        setCurrentNameFilters(name);
        newFilters['name'] = name;
      }
      if (releaseParam && isValidRelease(upcomingChanges, decodeURIComponent(releaseParam))) {
        const release = decodeURIComponent(releaseParam).split(',');
        setCurrentReleaseFilters(release);
        newFilters['release'] = release;
      }
      if (typeParam && isValidType(upcomingChanges, decodeURIComponent(typeParam))) {
        const type = new Set(decodeURIComponent(typeParam).split(','));
        setCurrentTypeFilters(type);
        newFilters['type'] = type;
      }
      if (dateParam && isValidDate(upcomingChanges, decodeURIComponent(dateParam))) {
        const date = decodeURIComponent(dateParam);
        setCurrentDateFilter(date);
        newFilters['date'] = date;
      }

      // Include view filter in URL
      newFilters['viewFilter'] = currentViewFilter;
      setFiltersForURL(newFilters);
      setIsLoading(false);
    } catch (error: any) {
      // Dispatch notif here
      console.error('Error fetching changes:', error);
      setError({ message: error });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Get view filter from URL params or use default
    let initialViewFilter = 'relevant';
    if (viewFilterParam && (viewFilterParam === 'relevant' || viewFilterParam === 'all')) {
      initialViewFilter = viewFilterParam;
      setSelectedViewFilter(viewFilterParam);
    }

    fetchData(initialViewFilter);
  }, []);

  const deprecationId = 'filter-by-type-deprecation';
  const changeId = 'filter-by-type-change';
  const additionId = 'filter-by-type-addition';

  const resetFilters = () => {
    setCurrentTypeFilters(new Set());
    setCurrentDateFilter('');
    setCurrentNameFilters('');
    setCurrentReleaseFilters([]);
    setSelectedViewFilter('relevant');

    // Use cached relevant data if available
    if (dataFetchStatus.relevant) {
      setUpcomingChanges(relevantUpcomingChangesData);
      setVisibleData(relevantUpcomingChangesData);
    } else {
      setVisibleData(upcomingChanges);
      fetchData('relevant');
    }

    setFiltersForURL(DEFAULT_FILTERS);
    setSearchParams(buildURL(DEFAULT_FILTERS));
  };

  const setTypeParam = (type: Set<string>) => {
    const newFilters = structuredClone(filtersForURL);
    newFilters['type'] = type;
    setFiltersForURL(newFilters);
    setSearchParams(buildURL(newFilters));
  };

  const updateChildFilters = (filters: Filter) => {
    setFiltersForURL(filters);
    setSearchParams(buildURL(filters));
  };

  const handleCardClick = (variant: 'additions' | 'changes' | 'deprecations') => {
    switch (variant) {
      case 'additions':
        setCurrentTypeFilters(new Set(['Addition']));
        setTypeParam(new Set(['Addition']));
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

  if (isLoading) {
    return (
      <div>
        <Bullseye>
          <Spinner />
        </Bullseye>
      </div>
    );
  }

  if (error) {
    return <ErrorState errorTitle="Failed to load data" errorDescription={String(error.message)} />;
  }

  // New error state for when no data is available
  if (noDataAvailable) {
    return (
      <Bullseye>
        <EmptyState variant={EmptyStateVariant.lg}>
          <EmptyStateHeader
            icon={<EmptyStateIcon icon={CubesIcon} />}
            titleText="No roadmap data available"
            headingLevel="h2"
          />
          <EmptyStateBody>
            We could not find any Roadmap data. Please add systems to inventory to view Roadmap information.
          </EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={() => fetchData()}>
                Try again
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    );
  }

  return (
    <Stack className="drf-lifecycle__upcoming" hasGutter>
      <StackItem>
        <Grid hasGutter span={12}>
          <GridItem span={4}>
            <Card ouiaId="upcoming-deprecations" isClickable style={{ height: '135px' }}>
              <CardHeader
                selectableActions={{
                  onClickAction: () => handleCardClick('deprecations'),
                  selectableActionId: deprecationId,
                  selectableActionAriaLabelledby: 'Deprecations',
                  name: 'filter-by-type',
                }}
              >
                <CardTitle className="drf-lifecycle__upcoming-card">
                  <ExclamationCircleIcon color={'#C9190B'} />
                  Deprecations
                </CardTitle>
              </CardHeader>
              <CardBody>
                <span className="drf-lifecycle__upcoming-count">{numDeprecations}</span>{' '}
                {pluralize(numDeprecations, 'deprecation')} that could affect your systems
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="upcoming-changes" isClickable style={{ height: '135px' }}>
              <CardHeader
                selectableActions={{
                  onClickAction: () => handleCardClick('changes'),
                  selectableActionId: changeId,
                  selectableActionAriaLabelledby: 'filter-by-type-2',
                  name: 'filter-by-type',
                }}
              >
                <CardTitle className="drf-lifecycle__upcoming-card">
                  <ExclamationTriangleIcon color={'#FFA500'} />
                  Changes
                </CardTitle>
              </CardHeader>
              <CardBody>
                <span className="drf-lifecycle__upcoming-count">{numChanges}</span>{' '}
                {pluralize(numChanges, 'change')} that could affect your systems
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="upcoming-additions" isClickable style={{ height: '135px' }}>
              <CardHeader
                selectableActions={{
                  onClickAction: () => handleCardClick('additions'),
                  selectableActionId: additionId,
                  selectableActionAriaLabelledby: 'filter-by-type-3',
                  name: 'filter-by-type',
                }}
              >
                <CardTitle className="drf-lifecycle__upcoming-card">
                  <InfoCircleIcon color={'#2B9AF3'} />
                  Additions and enhancements
                </CardTitle>
              </CardHeader>
              <CardBody>
                <span className="drf-lifecycle__upcoming-count">{numAdditions}</span>{' '}
                {pluralize(numAdditions, 'addition')} and {pluralize(numAdditions, 'enhancement')} that could
                affect your systems
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>
      <StackItem>
        <UpcomingTable
          data={visibleData}
          columnNames={UPCOMING_COLUMN_NAMES}
          initialTypeFilters={currentTypeFilters}
          resetInitialFilters={resetFilters}
          initialDateFilter={currentDateFilter}
          initialNameFilter={currentNameFilter}
          initialReleaseFilters={currentReleaseFilters}
          filtersForURL={filtersForURL}
          setFiltersForURL={updateChildFilters}
          selectedViewFilter={selectedViewFilter}
          handleViewFilterChange={handleViewFilterChange}
        />
      </StackItem>
    </Stack>
  );
};

export default UpcomingTab;
