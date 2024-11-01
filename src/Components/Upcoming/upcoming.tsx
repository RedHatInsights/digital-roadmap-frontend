import './upcoming.scss';
import React, { lazy } from 'react';
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

import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';

const MyTableWithToolbar = lazy(() => import('../UpcomingTable/UpcomingTable'));

// TODO: Replace this with the actual data fetch
import { columnNames, data } from './mock_data';

const UpcomingTab: React.FC<React.PropsWithChildren> = () => {
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
            <Card ouiaId="BasicCard" isClickable>
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
                  {'  '}Most Important!
                </CardTitle>
              </CardHeader>
              <CardBody>Body</CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="BasicCard" isClickable>
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
                  <InfoCircleIcon color={'#2B9AF3'} />
                  {'  '}Good to Know
                </CardTitle>
              </CardHeader>
              <CardBody>Body</CardBody>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card ouiaId="BasicCard" isClickable>
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
                  {'  '}Further off, but still useful
                </CardTitle>
              </CardHeader>
              <CardBody>Body</CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>
      <StackItem>
        <MyTableWithToolbar data={data} columnNames={columnNames} />
      </StackItem>
    </Stack>
  );
};

export default UpcomingTab;
