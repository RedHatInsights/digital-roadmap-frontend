import React, { Suspense, useEffect } from 'react';
import { Alert, Spinner } from '@patternfly/react-core';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import LifecycleTab from '../../Components/Lifecycle/Lifecycle';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

import './LifecyclePage.scss';

const LifecyclePage = () => {
  const { appAction } = useChrome();
  useEffect(() => {
    appAction('digital-roadmap');
  }, []);

  return (
    <React.Fragment>
      <PageHeader>
        <PageHeaderTitle title="Life Cycle" />
      </PageHeader>
      <Alert
        id="lifecycle-warning"
        variant="warning"
        title="Dates are approximations and subject to change."
        component="h2"
      />
      <section className="pf-l-page__main-section pf-c-page__main-section" id="lifecycle">
        <Suspense fallback={<Spinner />}>
          <LifecycleTab />
        </Suspense>
      </section>
    </React.Fragment>
  );
};

export default LifecyclePage;
