import React, { Suspense, useEffect } from 'react';
import { Alert, Spinner } from '@patternfly/react-core';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import UpcomingTab from '../../Components/Upcoming/Upcoming';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

import './UpcomingPage.scss';

const UpcomingPage = () => {
  const { appAction } = useChrome();
  useEffect(() => {
    appAction('digital-roadmap');
  }, []);

  return (
    <React.Fragment>
      <PageHeader>
        <PageHeaderTitle title="Roadmap" />
      </PageHeader>
      <Alert
        id="roadmap-warning"
        variant="warning"
        title="Upcoming features and dates are subject to change."
        component="h2"
      />
      <section className="pf-l-page__main-section pf-c-page__main-section" id="roadmap">
        <Suspense fallback={<Spinner />}>
          <UpcomingTab />
        </Suspense>
      </section>
    </React.Fragment>
  );
};

export default UpcomingPage;
