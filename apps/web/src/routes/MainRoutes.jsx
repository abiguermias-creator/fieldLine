import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from './ProtectedRoute';

// render dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render pages
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));

const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));


const MainRoutes = {
  path: '/',
  element: <ProtectedRoute />,
  children: [
    {
      element: <DashboardLayout />,
      children: [
        {
          index: true,
          element: <DashboardDefault />
        },
        {
          path: 'dashboard/default',
          element: <DashboardDefault />
        },
        {
          path: 'typography',
          element: <Typography />
        },
        {
          path: 'color',
          element: <Color />
        },
        {
          path: 'shadow',
          element: <Shadow />
        },
        {
          path: 'sample-page',
          element: <SamplePage />
        }
      ]
    }
  ]
};

export default MainRoutes;
