
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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
          <HashRouter>
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Private User Routes */}
                <Route 
                  path="/tool/:toolId" 
                  element={<PrivateRoute><ToolPage /></PrivateRoute>} 
                />
                <Route 
                  path="/profile" 
                  element={<PrivateRoute><ProfilePage /></PrivateRoute>} 
                />
                <Route 
                  path="/settings" 
                  element={<PrivateRoute><SettingsPage /></PrivateRoute>} 
                />
                <Route 
                  path="/todo" 
                  element={<PrivateRoute><TodoListPage /></PrivateRoute>} 
                />
                <Route 
                  path="/notes" 
                  element={<PrivateRoute><NoteTakingPage /></PrivateRoute>} 
                />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
                />
                <Route 
                  path="/admin/user/:userId" 
                  element={<AdminRoute><UserHistoryPage /></AdminRoute>}
                />
              </Routes>
            </Layout>
          </HashRouter>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;