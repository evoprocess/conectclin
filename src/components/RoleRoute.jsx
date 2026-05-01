import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" />;
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.cargo)) return <Navigate to="/home" replace />;
  return children;
}