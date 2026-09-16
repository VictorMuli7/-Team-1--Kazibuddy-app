import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function ProtectedRoute({ roles, children }) {
  const { session, loading } = useAuth();

  // Wait until the server session has been checked
  if (loading) {
    return <div>Loading...</div>;
  }

  // User is not logged in or does not have the required role
  if (!session || !roles.includes(session.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
