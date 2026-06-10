import React, { Suspense, useEffect } from 'react';
import { Alert, Button, Content, Popover, Spinner } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import UpcomingTab from '../../Components/Upcoming/Upcoming';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

import './UpcomingPage.scss';

const UpcomingPage = () => {
  const { appAction } = useChrome();
  useEffect(() => {
    appAction('digital-roadmap');
  }, []);

  const popoverContent = (
    <Content>
      <p>
        View the latest updates on upcoming Red Hat Enterprise Linux features, tailored to your systems. Add
        systems to{' '}
        <a href="https://console.redhat.com/insights/inventory" target="_blank" rel="noopener noreferrer">
          Inventory
        </a>{' '}
        to view only upcoming features relevant to your organization.
      </p>
      <p>
        Learn more about{' '}
        <a
          href={
            'https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html/' +
            'dynamically_creating_a_digital_roadmap_to_manage_rhel_systems/' +
            'using-the-digital-roadmap-dashboard#upcoming-features'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
          <PageHeaderTitle title="Roadmap" />
          <Popover headerContent="About roadmap" bodyContent={popoverContent} position="right">
            <Button icon={<OutlinedQuestionCircleIcon />} variant="plain" aria-label="Roadmap information" />
          </Popover>
        </div>
      </PageHeader>
      <Alert
        id="roadmap-warning"
        variant="warning"
        title="Upcoming features and dates are subject to change."
        component="h2"
        isInline
        isPlain
        style={{ paddingLeft: '28px' }}
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
