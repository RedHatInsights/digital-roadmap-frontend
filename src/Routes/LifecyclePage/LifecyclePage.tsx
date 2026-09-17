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
      <p>
        Learn more about{' '}
        <a
          href={
            'https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html/' +
            'dynamically_creating_a_digital_roadmap_to_manage_rhel_systems/using-the-digital-roadmap-dashboard#life-cycle'
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Using Red Hat Lightspeed for RHEL planning Dashboard
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
      <Alert
        id="lifecycle-info"
        className="drf-lifecycle-page__info-alert"
        isExpandable
        isInline
        variant="info"
        title="Get notified about lifecycle changes"
        component="h2"
        toggleAriaLabel="Get notified about lifecycle changes"
      >
        <p>
          Subscribe to lifecycle notifications about RHEL and Application Stream retirement and support status
          changes that may affect your environment.
          <br />
          <br />
          <a
            href={`${window.location.origin}/settings/notifications/user-preferences?bundle=rhel&app=life-cycle`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Manage notification settings
          </a>
        </p>
      </Alert>
      <section className="pf-l-page__main-sectioFn pf-c-page__main-section" id="lifecycle">
        <Suspense fallback={<Spinner />}>
          <LifecycleTab />
        </Suspense>
      </section>
    </React.Fragment>
  );
};

export default LifecyclePage;
