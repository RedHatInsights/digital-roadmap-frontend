import React, { Fragment, useEffect } from 'react';

import Routing from './Routing';
import './App.scss';

import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

const App = () => {
  const { updateDocumentTitle } = useChrome();

  useEffect(() => {
    // You can use directly the name of your app
    updateDocumentTitle('Digital Roadmap');
  }, []);

  return (
    <NotificationsProvider>
      <Fragment>
        <Routing />
      </Fragment>
    </NotificationsProvider>
  );
};

export default App;
