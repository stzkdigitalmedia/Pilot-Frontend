import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  // Debug logging
  // console.log('ProtectedRoute - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user);
  
  if (loading) {
    return (
      <div className="min-h-screen gaming-bg flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4 mx-auto" style={{width: '40px', height: '40px'}}></div>
          <p className="text-xl gaming-title">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;