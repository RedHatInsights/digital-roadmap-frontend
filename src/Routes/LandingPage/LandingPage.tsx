import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Spinner } from '@patternfly/react-core';
import {
  PageHeader,
  PageHeaderTitle,
} from '@redhat-cloud-services/frontend-components/PageHeader';

import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { Tab, TabTitleText, Tabs } from '@patternfly/react-core';

import './landing-page.scss';

const ReleasedTab = lazy(() => import('../../Components/Released/released'));
const UpcomingTab = lazy(() => import('../../Components/Upcoming/Upcoming'));
const LifecycleTab = lazy(() => import('../../Components/Lifecycle/Lifecycle'));

const SystemCard = lazy(
  () => import('../../Components/SystemInfoCard/SystemInfoCard')
);

/**
 * A smart component that handles all the api calls and data needed by the dumb components.
 * Smart components are usually classes.
 *
 * https://reactjs.org/docs/components-and-props.html
 * https://medium.com/@thejasonfile/dumb-components-and-smart-components-e7b33a698d43
 */
const LandingPage = () => {
  const navigate = useNavigate();
  const { appAction } = useChrome();

  const { pathname } = useLocation();

  const tabsPath = ['upcoming', 'released', 'lifecycle'];

  const tabPath = pathname.split('/').pop() || 'upcoming';
  const initialActiveTabKey =
    tabsPath.indexOf(tabPath) >= 0 ? tabsPath.indexOf(tabPath) : 0;
  const [activeTabKey, setActiveTabKey] = useState(initialActiveTabKey);

  useEffect(() => {
    appAction('digital-roadmap');
  }, []);

  useEffect(() => {
    setActiveTabKey(initialActiveTabKey);
  }, [pathname]);

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: number | string
  ) => {
    if (typeof tabIndex === 'string') tabIndex = Number(tabIndex);
    const tabPath = tabsPath[tabIndex];
    if (tabPath !== undefined) {
      navigate(tabPath);
    }
    setActiveTabKey(tabIndex);
  };

  return (
    <React.Fragment>
      <PageHeader>
        <PageHeaderTitle title="Digital Roadmap" />
        <p>
          Provides tailored forward-looking roadmap information and tailored
          information on how RHEL minor and major releases will affect the
          customers environment
        </p>
        <SystemCard />
      </PageHeader>
      <Tabs
        className="pf-c-tabs pf-c-page-header pf-c-table"
        activeKey={activeTabKey}
        onSelect={handleTabClick}
      >
        <Tab eventKey={0} title={<TabTitleText>Upcoming</TabTitleText>}>
          <section
            className="pf-l-page__main-section pf-c-page__main-section"
            id="upcoming"
          >
            <Suspense fallback={<Spinner />}>
              <UpcomingTab />
            </Suspense>
          </section>
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Released</TabTitleText>}>
          <section
            className="pf-l-page__main-section pf-c-page__main-section"
            id="released"
          >
            <Suspense fallback={<Spinner />}>
              <ReleasedTab />
            </Suspense>
          </section>
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Lifecycle</TabTitleText>}>
          <section
            className="pf-l-page__main-section pf-c-page__main-section"
            id="lifecycle"
          >
            <Suspense fallback={<Spinner />}>
              <LifecycleTab />
            </Suspense>
          </section>
        </Tab>
      </Tabs>
    </React.Fragment>
  );
};

export default LandingPage;
