
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { SettingsProvider } from './hooks/useSettings';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ToolPage from './pages/ToolPage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserHistoryPage from './pages/admin/UserHistoryPage';
import TodoListPage from './pages/TodoListPage';
import NoteTakingPage from './pages/NoteTakingPage';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <ReactRouterDOM.HashRouter>
            <Layout>
              <ReactRouterDOM.Routes>
                {/* Public Routes */}
                <ReactRouterDOM.Route path="/" element={<HomePage />} />
                <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
                <ReactRouterDOM.Route path="/signup" element={<SignUpPage />} />
                <ReactRouterDOM.Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <ReactRouterDOM.Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Private User Routes */}
                <ReactRouterDOM.Route 
                  path="/tool/:toolId" 
                  element={<PrivateRoute><ToolPage /></PrivateRoute>} 
                />
                <ReactRouterDOM.Route 
                  path="/profile" 
                  element={<PrivateRoute><ProfilePage /></PrivateRoute>} 
                />
                <ReactRouterDOM.Route 
                  path="/settings" 
                  element={<PrivateRoute><SettingsPage /></PrivateRoute>} 
                />
                <ReactRouterDOM.Route 
                  path="/todo" 
                  element={<PrivateRoute><TodoListPage /></PrivateRoute>} 
                />
                <ReactRouterDOM.Route 
                  path="/notes" 
                  element={<PrivateRoute><NoteTakingPage /></PrivateRoute>} 
                />
                
                {/* Admin Routes */}
                <ReactRouterDOM.Route 
                  path="/admin" 
                  element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
                />
                <ReactRouterDOM.Route 
                  path="/admin/user/:userId" 
                  element={<AdminRoute><UserHistoryPage /></AdminRoute>}
                />
              </ReactRouterDOM.Routes>
            </Layout>
          </ReactRouterDOM.HashRouter>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
