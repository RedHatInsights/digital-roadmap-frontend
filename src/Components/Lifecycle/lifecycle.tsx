import React, { lazy, useEffect, useState } from 'react';
import '@patternfly/react-core/dist/styles/base.css';
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

const LifecycleChart = lazy(() => import('../../Components/LifecycleChart/lifecycleChart'));
const LifecycleTable = lazy(() => import('../../Components/LifecycleTable/lifecycleTable'));


const LifecycleTab: React.FC<React.PropsWithChildren> = () => {

  return(
    <Stack hasGutter>
      <Card>
        <LifecycleChart/>
        <LifecycleTable/>
      </Card>
    </Stack>

  )
}

export default LifecycleTab;