import './upcoming.scss';
import React, { lazy, useEffect } from 'react';
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Grid,
  GridItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { getUpcomingChanges } from '../../api';
import { UpcomingChanges } from '../../types/UpcomingChanges'; 

import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

const UpcomingTable = lazy(() => import('../UpcomingTable/UpcomingTable'));

export const UPCOMING_COLUMN_NAMES = {
  name: 'Name',
  type: 'Type',
  release: 'Release',
  date: 'Date',
};

const UpcomingTab: React.FC<React.PropsWithChildren> = () => {

  const emptyUpcomingChanges: UpcomingChanges[] = [];
  const [relevantUpcomingChanges, setUpcomingChanges] =
    React.useState(emptyUpcomingChanges);
  const [isLoading, setIsLoading] = React.useState(false);


  const fetchData = () => {
    setIsLoading(true);
    getUpcomingChanges()
      .then((data) => {
        const upcomingChangesParagraphs: UpcomingChanges[] = data || [];
        setUpcomingChanges(upcomingChangesParagraphs);
        setIsLoading(false);
      })
      .catch(() => {
        // Dispatch notif here
        setIsLoading(false);
      });
  };

  useEffect(() => {
    //update type
    const apiData : any  = fetchData()
    console.log(apiData)
    setUpcomingChanges(apiData)
    
  }, []);


  const id1 = 'clickable-card-input-1';
  const id2 = 'clickable-card-input-2';
  const id3 = 'clickable-card-input-3';
  return (
    <Stack hasGutter>
      <StackItem>
        <Alert
          id="changes-warning"
          variant="warning"
          isInline
          title="Upcoming features are subject to change."
        />
      </StackItem>
      <StackItem>
        <Grid hasGutter span={12}>
          <GridItem span={4}>
            <Card ouiaId="MostImportant" isClickable>
              <CardHeader
                selectableActions={{
                  // eslint-disable-next-line no-console
                  onClickAction: () => console.log(`${id1} clicked`),
                  selectableActionId: id1,
                  selectableActionAriaLabelledby: 'clickable-card-example-1',
                  name: 'clickable-card-example',
                }}
              >
                <CardTitle>
                  <ExclamationCircleIcon color={'#C9190B'} />
                  {'  '}  Upcoming deprecations
                </CardTitle>
              </CardHeader>
              <CardBody>upcoming deprecations that could affect your systems</CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="GoodToKnow" isClickable>
              <CardHeader
                selectableActions={{
                  // eslint-disable-next-line no-console
                  onClickAction: () => console.log(`${id2} clicked`),
                  selectableActionId: id2,
                  selectableActionAriaLabelledby: 'clickable-card-example-2',
                  name: 'clickable-card-example',
                }}
              >
                <CardTitle>
                  <ExclamationTriangleIcon color={'#FFA500'} />
                  {'  '}  Upcoming changes
                </CardTitle>
              </CardHeader>
              <CardBody>upcoming changes that could affect your systems</CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="FutherOff" isClickable>
              <CardHeader
                selectableActions={{
                  // eslint-disable-next-line no-console
                  onClickAction: () => console.log(`${id3} clicked`),
                  selectableActionId: id3,
                  selectableActionAriaLabelledby: 'clickable-card-example-3',
                  name: 'clickable-card-example',
                }}
              >
                <CardTitle>
                  <InfoCircleIcon color={'#2B9AF3'} />
                  {'  '}  Upcoming additions
                </CardTitle>
              </CardHeader>
              <CardBody>upcoming additions that could affect your systems</CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>
      <StackItem>
        <UpcomingTable data={relevantUpcomingChanges} columnNames={UPCOMING_COLUMN_NAMES} />
      </StackItem>
    </Stack>
  );
};

export default UpcomingTab;
