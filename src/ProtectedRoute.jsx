import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

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
    return <Navigate to="/" replace />;
  }

  if (studentOnly && userProfile?.role !== "student") {
    return <Navigate to="/" replace />;
  }

  return children;
}