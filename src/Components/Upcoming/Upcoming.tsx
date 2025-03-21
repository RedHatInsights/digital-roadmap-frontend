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
import { pluralize } from '../../utils/utils';
import ErrorState from "@patternfly/react-component-groups/dist/dynamic/ErrorState";

const UpcomingTable = lazy(() => import('../UpcomingTable/UpcomingTable'));

export const UPCOMING_COLUMN_NAMES = {
  name: 'Name',
  type: 'Type',
  release: 'Release',
  date: 'Release date',
};

const UpcomingTab: React.FC<React.PropsWithChildren> = () => {
  const emptyUpcomingChanges: UpcomingChanges[] = [];
  const [relevantUpcomingChanges, setUpcomingChanges] = React.useState(emptyUpcomingChanges);
  const [isLoading, setIsLoading] = React.useState(false);
  const [numDeprecations, setNumDeprecations] = React.useState(0);
  const [numAdditions, setNumAdditions] = React.useState(0);
  const [numChanges, setNumChanges] = React.useState(0);
  const [deprecations, setDeprecations] = React.useState<UpcomingChanges[]>([]);
  const [changes, setChanges] = React.useState<UpcomingChanges[]>([]);
  const [additions, setAdditions] = React.useState<UpcomingChanges[]>([]);
  const [visibleData, setVisibleData] = React.useState<UpcomingChanges[]>(emptyUpcomingChanges);
  const [currentFilters, setCurrentFilters] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<ErrorObject>();

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const data = await getUpcomingChanges();
        const upcomingChangesParagraphs: UpcomingChanges[] = data || [];
        setUpcomingChanges(upcomingChangesParagraphs);
        const filteredDeprecations = upcomingChangesParagraphs.filter((item) => item.type === 'Deprecation');
        setDeprecations(filteredDeprecations);
        setNumDeprecations(filteredDeprecations.length);
        const filteredAdditions = upcomingChangesParagraphs.filter((item) => item.type === 'Addition');
        setAdditions(filteredAdditions);
        setNumAdditions(filteredAdditions.length);
        const filteredChanges = upcomingChangesParagraphs.filter((item) => item.type === 'Change');
        setChanges(filteredChanges);
        setNumChanges(filteredChanges.length);
        setVisibleData(upcomingChangesParagraphs);
        setIsLoading(false);
      }
      catch(error: any) {
        // Dispatch notif here
        console.error('Error fetching upcoming changes:', error);
        setError({message: error});
      } finally{
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
    setCurrentFilters(new Set());
    setVisibleData(relevantUpcomingChanges);
  };

  const handleCardClick = (variant: 'additions' | 'changes' | 'deprecations') => {
    switch (variant) {
      case 'additions':
        setVisibleData(additions);
        setCurrentFilters(new Set(['Addition']));
        break;
      case 'changes':
        setVisibleData(changes);
        setCurrentFilters(new Set(['Change']));
        break;
      default:
        setVisibleData(deprecations);
        setCurrentFilters(new Set(['Deprecation']));
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
    return <ErrorState errorTitle="Failed to load data" errorDescription={ String(error.message) }/>;
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
                <span className="drf-lifecycle__upcoming-count">{numDeprecations}</span> upcoming{' '}
                {pluralize(numDeprecations, 'deprecation')} that could affect your systems
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
                <span className="drf-lifecycle__upcoming-count">{numChanges}</span> upcoming{' '}
                {pluralize(numChanges, 'change')} that could affect your systems
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
                <span className="drf-lifecycle__upcoming-count">{numAdditions}</span> upcoming{' '}
                {pluralize(numAdditions, 'addition')} that could affect your systems
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>
      <StackItem>
        <UpcomingTable
          data={visibleData}
          columnNames={UPCOMING_COLUMN_NAMES}
          initialFilters={currentFilters}
          resetInitialFilters={resetFilters}
        />
      </StackItem>
    </Stack>
  );
};

export default UpcomingTab;
