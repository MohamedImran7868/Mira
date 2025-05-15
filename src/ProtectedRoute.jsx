import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingModal from './components/Common/LoadingModal';

export default function ProtectedRoute({ children, adminOnly = false, studentOnly = false }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return <LoadingModal message='Loading' />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin-only routes
  if (adminOnly && user.user_metadata?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Check student-only routes
  if (studentOnly && user.user_metadata?.role !== "student") {
    return <Navigate to="/" replace />;
  }

   if (!user?.role) {
    return <Navigate to="/" replace />;
  }

  return children;
}