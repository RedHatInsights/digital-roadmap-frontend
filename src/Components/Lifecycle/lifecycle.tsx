import './lifecycle.scss';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Grid,
  GridItem,
  Spinner,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Toolbar,
  ToolbarContent,
  ToolbarItem,

} from '@patternfly/react-core';
import { getLifecycleChanges } from '../../api';


const SelectOptionVariations = lazy(
  () => import('../FilterComponents/LifecycleDropdown')
);

const LifecycleChart = lazy(() => import('../../Components/LifecycleChart/lifecycleChart'));
const LifecycleTable = lazy(() => import('../../Components/LifecycleTable/lifecycleTable'));


type LifecycleChanges = {
  name: string;
  release: string;
  major: number;
  minor: number;
  release_date: Date;
  retirement_date: Date;
  systems: number;
};


const LifecycleColumnNames = {
name: 'Name',
release: 'Release',
release_date: 'Release Date',
retirement_date: 'Retirement Date',
systems: 'Systems'
};

const LifecycleTab: React.FC<React.PropsWithChildren> = () => {

  const emptyLifecycleChanges: LifecycleChanges[] = [];
  const [relevantLifecycleChanges, setLifecycleChanges] =
  useState(emptyLifecycleChanges);
  const [isLoading, setIsLoading] = useState(false);


  const fetchData = () => {
  setIsLoading(true);
  getLifecycleChanges()
      .then((data: never[]) => {
      const upcomingChangesParagraphs: LifecycleChanges[] = data || [];
      setLifecycleChanges(upcomingChangesParagraphs);
      setIsLoading(false);
      })
      .catch(() => {
      // Dispatch notif here
      setIsLoading(false);
      });
  };

  useEffect(() => {
  const apiData : any  = fetchData()
  setLifecycleChanges(apiData)

  }, []);

  return(
    <React.Fragment>
      <Stack hasGutter>
        <Card>
          <LifecycleChart/>
          <LifecycleTable lifecycleData={relevantLifecycleChanges}/>
        </Card>
      </Stack>
  </React.Fragment>
  )
}

export default LifecycleTab;