import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard/default" replace />;
  }

  return <Outlet />;
}
