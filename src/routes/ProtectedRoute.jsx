import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false, studentOnly = false }) {
  const { user, userProfile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (adminOnly && userProfile?.role !== "admin") {
    return <Navigate to="/401-unauthorized" replace />;
  }

  if (studentOnly && userProfile?.role !== "student") {
    return <Navigate to="/401-unauthorized" replace />;
  }

  return children;
}