import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// render dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render pages
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// pages
const Clients = Loadable(lazy(() => import('pages/clients')));
const Sites = Loadable(lazy(() => import('pages/sites')));
const WorkOrders = Loadable(lazy(() => import('pages/work-orders')));
const WorkOrderDetail = Loadable(lazy(() => import('pages/work-orders/detail')));
const Skills = Loadable(lazy(() => import('pages/skills')));
const Technicians = Loadable(lazy(() => import('pages/technicians')));
const TechnicianDay = Loadable(lazy(() => import('pages/technician-day')));
const Equipment = Loadable(lazy(() => import('pages/equipment')));
const Requests = Loadable(lazy(() => import('pages/requests')));
const DispatcherBoard = Loadable(lazy(() => import('pages/dispatcher-board')));

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
          path: 'clients',
          element: <Clients />
        },
        {
          path: 'sites',
          element: <Sites />
        },
        {
          path: 'work-orders',
          element: <WorkOrders />
        },
        {
          path: 'work-orders/:id',
          element: <WorkOrderDetail />
        },
        {
          path: 'skills',
          element: <Skills />
        },
        {
          path: 'technicians',
          element: <Technicians />
        },
        {
          path: 'equipment',
          element: <Equipment />
        },
        {
          path: 'technician-day',
          element: <TechnicianDay />
        },
        {
          path: 'requests',
          element: <Requests />
        },
        {
          element: <RoleRoute allowedRoles={['DISPATCHER', 'SUPERVISOR']} />,
          children: [
            {
              path: 'dispatcher-board',
              element: <DispatcherBoard />
            }
          ]
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
