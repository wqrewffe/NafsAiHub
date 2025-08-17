
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Add check for email verification
  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;