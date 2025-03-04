import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Alert, Spinner } from '@patternfly/react-core';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { Tab, TabTitleText, Tabs } from '@patternfly/react-core';

import './landing-page.scss';

const UpcomingTab = lazy(() => import('../../Components/Upcoming/Upcoming'));
const LifecycleTab = lazy(() => import('../../Components/Lifecycle/Lifecycle'));

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
  const initialActiveTabKey = tabsPath.indexOf(tabPath) >= 0 ? tabsPath.indexOf(tabPath) : 0;
  const [activeTabKey, setActiveTabKey] = useState(initialActiveTabKey);

  useEffect(() => {
    appAction('digital-roadmap');
  }, []);

  useEffect(() => {
    setActiveTabKey(initialActiveTabKey);
  }, [pathname]);

  const handleTabClick = (_event: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: number | string) => {
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
      </PageHeader>
      <Tabs className="pf-c-tabs pf-c-page-header pf-c-table" activeKey={activeTabKey} onSelect={handleTabClick}>
        <Tab eventKey={0} title={<TabTitleText>Roadmap</TabTitleText>}>
          <Alert
            id="roadmap-warning"
            variant="warning"
            title="Upcoming features are subject to change. All future dates mentioned are close approximations, non definitive, and subject to change."
            component="h2"
          />
          <section className="pf-l-page__main-section pf-c-page__main-section" id="roadmap">
            <Suspense fallback={<Spinner />}>
              <UpcomingTab />
            </Suspense>
          </section>
        </Tab>
        {/*<Tab eventKey={1} title={<TabTitleText>Released</TabTitleText>}>
          <section className="pf-l-page__main-section pf-c-page__main-section" id="released">
            <Suspense fallback={<Spinner />}>
              <ReleasedTab />
            </Suspense>
          </section>
        </Tab>*/}
        <Tab eventKey={2} title={<TabTitleText>Life cycle</TabTitleText>}>
          <Alert
            id="lifecycle-warning"
            variant="warning"
            title="All future dates mentioned are close approximations, non definitive, and subject to change."
            component="h2"
          />
          <section className="pf-l-page__main-section pf-c-page__main-section" id="lifecycle">
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
