
import React, { ReactNode } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <ReactRouterDOM.Navigate to="/login" />;
  }

  if (!currentUser.emailVerified) {
    return <ReactRouterDOM.Navigate to="/verify-email" />;
  }
  
  if (currentUser.email !== ADMIN_EMAIL) {
      return <ReactRouterDOM.Navigate to="/" />;
  }

  return <>{children}</>;
};

export default AdminRoute;
