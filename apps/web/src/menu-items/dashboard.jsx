// assets
import {
  DashboardOutlined,
  FileTextOutlined,
  FormOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  ExperimentOutlined,
  CarOutlined,
  UserOutlined,
  ScheduleOutlined
} from '@ant-design/icons';

// icons
const icons = {
  DashboardOutlined,
  FileTextOutlined,
  FormOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  ExperimentOutlined,
  CarOutlined,
  UserOutlined,
  ScheduleOutlined
};


const dashboard = {
  id: 'group-fieldline',
  title: 'Fieldline',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'dispatcher-board',
      title: 'Dispatcher Board',
      type: 'item',
      url: '/dispatcher-board',
      icon: icons.ScheduleOutlined,
      breadcrumbs: false
    },
    {
      id: 'work-orders',
      title: 'Work Orders',
      type: 'item',
      url: '/work-orders',
      icon: icons.FileTextOutlined,
      breadcrumbs: false
    },
    {
      id: 'requests',
      title: 'Requests',
      type: 'item',
      url: '/requests',
      icon: icons.FormOutlined,
      breadcrumbs: false
    },
    {
      id: 'clients',
      title: 'Clients',
      type: 'item',
      url: '/clients',
      icon: icons.TeamOutlined,
      breadcrumbs: false
    },
    {
      id: 'sites',
      title: 'Sites',
      type: 'item',
      url: '/sites',
      icon: icons.EnvironmentOutlined,
      breadcrumbs: false
    },
    {
      id: 'technicians',
      title: 'Technicians',
      type: 'item',
      url: '/technicians',
      icon: icons.UserOutlined,
      breadcrumbs: false
    },
    {
      id: 'technician-day',
      title: 'My Day',
      type: 'item',
      url: '/technician-day',
      icon: icons.ScheduleOutlined,
      breadcrumbs: false
    },
    {
      id: 'equipment',
      title: 'Equipment',
      type: 'item',
      url: '/equipment',
      icon: icons.CarOutlined,
      breadcrumbs: false
    },
    {
      id: 'skills',
      title: 'Skills',
      type: 'item',
      url: '/skills',
      icon: icons.ToolOutlined,
      breadcrumbs: false
    }
  ]
};

export default dashboard;