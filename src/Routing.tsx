import React, { Suspense, lazy, useMemo } from 'react';
import { Route as RouterRoute, Routes as RouterRoutes } from 'react-router-dom';
import { InvalidObject } from '@redhat-cloud-services/frontend-components/InvalidObject';
import { Bullseye, Spinner } from '@patternfly/react-core';

const UpcomingPage = lazy(
  () => import(/* webpackChunkName: "UpcomingPage" */ './Routes/UpcomingPage/UpcomingPage')
);
const LifecyclePage = lazy(
  () => import(/* webpackChunkName: "LifecyclePage" */ './Routes/LifecyclePage/LifecyclePage')
);
const OopsPage = lazy(() => import(/* webpackChunkName: "OopsPage" */ './Routes/OopsPage/OopsPage'));
const NoPermissionsPage = lazy(
  () => import(/* webpackChunkName: "NoPermissionsPage" */ './Routes/NoPermissionsPage/NoPermissionsPage')
);

const routes = [
  {
    path: 'no-permissions',
    element: NoPermissionsPage,
  },
  {
    path: 'oops',
    element: OopsPage,
  },
  {
    path: 'roadmap',
    element: UpcomingPage,
  },
  {
    path: 'lifecycle',
    element: LifecyclePage,
  },
  {
    path: '/',
    element: LifecyclePage,
  },
  /* Catch all unmatched routes */
  {
    path: 'invalid',
    element: InvalidObject,
  },
  {
    route: {
      path: '*',
    },
    element: InvalidObject,
  },
];

interface RouteType {
  path?: string;
  element: React.ComponentType;
  childRoutes?: RouteType[];
  elementProps?: Record<string, unknown>;
}

const renderRoutes = (routes: RouteType[] = []) =>
  routes.map(({ path, element: Element, childRoutes, elementProps }) => (
    <RouterRoute key={path} path={path} element={<Element {...elementProps} />}>
      {renderRoutes(childRoutes)}
    </RouterRoute>
  ));

const Routing = () => {
  const renderedRoutes = useMemo(() => renderRoutes(routes), [routes]);
  return (
    <Suspense
      fallback={
        <Bullseye>
          <Spinner />
        </Bullseye>
      }
    >
      <RouterRoutes>{renderedRoutes}</RouterRoutes>
    </Suspense>
  );
};

export default Routing;
