import React, { Suspense, useEffect } from 'react';
import { Alert, Button, Content, Popover, Spinner } from '@patternfly/react-core';
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
    <Content>
      <p>
        View tailored life cycle data for Red Hat Enterprise Linux and RHEL application streams. Add systems to{' '}
        <a href="https://console.redhat.com/insights/inventory" target="_blank" rel="noopener noreferrer">
          Inventory
        </a>{' '}
        to view only releases installed on those systems.
      </p>
      <p>
        Untailored life cycle data for all Red Hat products can be viewed on the{' '}
        <a href="https://access.redhat.com/product-life-cycles" target="_blank" rel="noopener noreferrer">
          Customer Portal
        </a>
        .
      </p>
    </Content>
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
