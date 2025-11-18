import React, { Suspense, useEffect } from 'react';
import { Alert, Button, Popover, Spinner } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import LifecycleTab from '../../Components/Lifecycle/Lifecycle';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

import './LifecyclePage.scss';

const LifecyclePage = () => {
  const { appAction } = useChrome();
  useEffect(() => {
    appAction('digital-roadmap');
  }, []);

  const popoverContent = (
    <div>
      View tailored life cycle data for Red Hat Enterprise Linux and RHEL application streams. Add systems to{' '}
      <a href="https://console.redhat.com/insights/inventory" target="_blank" rel="noopener noreferrer">
        Inventory
      </a>{' '}
      to view only releases installed on those systems.
    </div>
  );

  return (
    <React.Fragment>
      <PageHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', paddingLeft: '8px' }}>
          <PageHeaderTitle title="Life Cycle" />
          <Popover headerContent="About life cycle" bodyContent={popoverContent} position="right">
            <Button icon={<OutlinedQuestionCircleIcon />} variant="plain" aria-label="Life cycle information" />
          </Popover>
        </div>
      </PageHeader>
      <Alert
        id="lifecycle-warning"
        variant="warning"
        title="Dates are approximations and subject to change."
        component="h2"
        isInline
        isPlain
        style={{ paddingLeft: '28px' }}
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
