import './upcoming.scss';
import React, { lazy, useEffect } from 'react';
import {
  Bullseye,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Grid,
  GridItem,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { getUpcomingChanges } from '../../api';
import { UpcomingChanges } from '../../types/UpcomingChanges';
import { ErrorObject } from '../../types/ErrorObject';

import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
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

const UpcomingTab: React.FC<React.PropsWithChildren> = () => {
  const emptyUpcomingChanges: UpcomingChanges[] = [];
  const [relevantUpcomingChanges, setUpcomingChanges] =
    React.useState(emptyUpcomingChanges);
  const [isLoading, setIsLoading] = React.useState(false);
  const [numDeprecations, setNumDeprecations] = React.useState(0);
  const [numAdditions, setNumAdditions] = React.useState(0);
  const [numChanges, setNumChanges] = React.useState(0);
  const [visibleData, setVisibleData] =
    React.useState<UpcomingChanges[]>(emptyUpcomingChanges);
  const [currentTypeFilters, setCurrentTypeFilters] = React.useState<
    Set<string>
  >(new Set());
  const [currentDateFilter, setCurrentDateFilter] = React.useState('');
  const [currentNameFilter, setCurrentNameFilters] = React.useState('');
  const [currentReleaseFilters, setCurrentReleaseFilters] = React.useState<
    string[]
  >([]);
  const [error, setError] = React.useState<ErrorObject>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersForURL, setFiltersForURL] =
    React.useState<Filter>(DEFAULT_FILTERS);

  const nameParam = searchParams.get('name');
  const typeParam = searchParams.get('type');
  const releaseParam = searchParams.get('release');
  const dateParam = searchParams.get('date');

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getUpcomingChanges();
      const upcomingChangesParagraphs: UpcomingChanges[] = data || [];
      setUpcomingChanges(upcomingChangesParagraphs);
      const filteredDeprecations = upcomingChangesParagraphs.filter(
        (item) => item.type === 'Deprecation'
      );
      setNumDeprecations(filteredDeprecations.length);
      const filteredAdditions = upcomingChangesParagraphs.filter(
        (item) => item.type === 'Addition'
      );
      setNumAdditions(filteredAdditions.length);
      const filteredChanges = upcomingChangesParagraphs.filter(
        (item) => item.type === 'Change'
      );
      setNumChanges(filteredChanges.length);
      setVisibleData(upcomingChangesParagraphs);
      const newFilters = structuredClone(filtersForURL);
      if (nameParam) {
        const name = decodeURIComponent(nameParam);
        setCurrentNameFilters(name);
        newFilters['name'] = name;
      }
      if (
        releaseParam &&
        isValidRelease(
          upcomingChangesParagraphs,
          decodeURIComponent(releaseParam)
        )
      ) {
        const release = decodeURIComponent(releaseParam).split(',');
        setCurrentReleaseFilters(release);
        newFilters['release'] = release;
      }
      if (
        typeParam &&
        isValidType(upcomingChangesParagraphs, decodeURIComponent(typeParam))
      ) {
        const type = new Set(decodeURIComponent(typeParam).split(','));
        setCurrentTypeFilters(type);
        newFilters['type'] = type;
      }
      if (
        dateParam &&
        isValidDate(upcomingChangesParagraphs, decodeURIComponent(dateParam))
      ) {
        const date = decodeURIComponent(dateParam);
        setCurrentDateFilter(date);
        newFilters['date'] = date;
      }
      setFiltersForURL(newFilters);
      setIsLoading(false);
    } catch (error: any) {
      // Dispatch notif here
      console.error('Error fetching upcoming changes:', error);
      setError({ message: error });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deprecationId = 'filter-by-type-deprecation';
  const changeId = 'filter-by-type-change';
  const additionId = 'filter-by-type-addition';

  const resetFilters = () => {
    setCurrentTypeFilters(new Set());
    setVisibleData(relevantUpcomingChanges);
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

  const handleCardClick = (
    variant: 'additions' | 'changes' | 'deprecations'
  ) => {
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
    return (
      <ErrorState
        errorTitle="Failed to load data"
        errorDescription={String(error.message)}
      />
    );
  }

  return (
    <Stack className="drf-lifecycle__upcoming" hasGutter>
      <StackItem>
        <Grid hasGutter span={12}>
          <GridItem span={4}>
            <Card ouiaId="upcoming-deprecations" isClickable>
              <CardHeader
                selectableActions={{
                  onClickAction: () => handleCardClick('deprecations'),
                  selectableActionId: deprecationId,
                  selectableActionAriaLabelledby: 'Upcoming deprecations',
                  name: 'filter-by-type',
                }}
              >
                <CardTitle className="drf-lifecycle__upcoming-card">
                  <ExclamationCircleIcon color={'#C9190B'} />
                  Upcoming deprecations
                </CardTitle>
              </CardHeader>
              <CardBody>
                <span className="drf-lifecycle__upcoming-count">
                  {numDeprecations}
                </span>{' '}
                upcoming {pluralize(numDeprecations, 'deprecation')} that could
                affect your systems
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="upcoming-changes" isClickable>
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
                  Upcoming changes
                </CardTitle>
              </CardHeader>
              <CardBody>
                <span className="drf-lifecycle__upcoming-count">
                  {numChanges}
                </span>{' '}
                upcoming {pluralize(numChanges, 'change')} that could affect
                your systems
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="upcoming-additions" isClickable>
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
                  Upcoming additions
                </CardTitle>
              </CardHeader>
              <CardBody>
                <span className="drf-lifecycle__upcoming-count">
                  {numAdditions}
                </span>{' '}
                upcoming {pluralize(numAdditions, 'addition')} that could affect
                your systems
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
        />
      </StackItem>
    </Stack>
  );
};

export default UpcomingTab;
