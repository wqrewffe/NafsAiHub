
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" />;
  }
  
  if (currentUser.email !== ADMIN_EMAIL) {
      return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
