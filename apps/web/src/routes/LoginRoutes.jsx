import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';

// pages
const LandingPage = Loadable(lazy(() => import('pages/landing')));
const LoginPage = Loadable(lazy(() => import('pages/auth/Login')));
const RegisterPage = Loadable(lazy(() => import('pages/auth/Register')));

const LoginRoutes = {
  path: '/',
  children: [
    {
      index: true,
      element: <LandingPage />
    },
    {
      path: 'login',
      element: <LoginPage />
    },
    {
      path: 'register',
      element: <RegisterPage />
    }
  ]
};

export default LoginRoutes;
