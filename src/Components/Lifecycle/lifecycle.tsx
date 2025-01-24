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
  MenuToggle, 
  Select, 
  SelectList, 
  SelectOption,
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
import { getLifecycleAppstreams, getLifecycleSystems } from '../../api';

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

  // data fetch
  const emptyLifecycleChanges: LifecycleChanges[] = [];
  const [relevantLifecycleChanges, setLifecycleChanges] =
  useState(emptyLifecycleChanges);
  const [isLoading, setIsLoading] = useState(false);


  const fetchData = async () => {
    setIsLoading(true);
    try {
        const data = await getLifecycleSystems();
        const upcomingChangesParagraphs = data || [];
        setLifecycleChanges(upcomingChangesParagraphs);
      } catch (error) {
        console.error("Error fetching lifecycle changes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
    }, []);

  const items = (
    <React.Fragment>
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
    </React.Fragment>
  )

  return(
    <Stack hasGutter>
      <Card>
        <Toolbar id="toolbar-items-example">
          <ToolbarContent alignItems={'center'}>{items}</ToolbarContent>
        </Toolbar>
        <LifecycleChart/>
        <LifecycleTable lifecycleData={relevantLifecycleChanges}/>
      </Card>
    </Stack>
  )
}

export default LifecycleTab;