import './released.scss';
import React, { Suspense, lazy } from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  Spinner,
  Stack,
  StackItem,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';

import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';

import AppLink from '../../Components/AppLink';

const SampleComponent = lazy(
  () => import('../SampleComponent/sample-component')
);

const ReleasedTab: React.FC<React.PropsWithChildren> = () => {
  const dispatch = useDispatch();
  const handleAlert = () => {
    dispatch(
      addNotification({
        variant: 'success',
        title: 'Notification title',
        description: 'notification description',
      })
    );
  };
  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component="h2">Released</Text>
          <Text component="p">This is the released tab.</Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <Title headingLevel="h2" size="3xl">
          {' '}
          Alerts{' '}
        </Title>
        <Button variant="primary" onClick={handleAlert}>
          {' '}
          Dispatch alert{' '}
        </Button>
      </StackItem>
      <StackItem>
        <Suspense fallback={<Spinner />}>
          <SampleComponent />
        </Suspense>
      </StackItem>
      <StackItem>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="3xl">
              {' '}
              Links{' '}
            </Title>
          </StackItem>
          <StackItem>
            <AppLink to="oops"> How to handle 500s in app </AppLink>
          </StackItem>
          <StackItem>
            <AppLink to="no-permissions">How to handle 403s in app</AppLink>
          </StackItem>
          <StackItem>
            <AppLink to="invalid"> How to handle invalid requests </AppLink>
          </StackItem>
        </Stack>
      </StackItem>
    </Stack>
  );
};

export default ReleasedTab;
