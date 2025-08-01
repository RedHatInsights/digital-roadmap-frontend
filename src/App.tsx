import React, { Fragment, useEffect } from 'react';
import { Reducer } from 'redux';

import Routing from './Routing';
import './App.scss';

import { getRegistry } from '@redhat-cloud-services/frontend-components-utilities/Registry';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

const App = () => {
  const { updateDocumentTitle } = useChrome();

  useEffect(() => {
    const registry = getRegistry();
    // You can use directly the name of your app
    updateDocumentTitle('Digital Roadmap');
  }, []);

  return (
    <Fragment>
      <NotificationsProvider />
      <Routing />
    </Fragment>
  );
};

export default App;
