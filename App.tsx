
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { SettingsProvider } from './hooks/useSettings';
import { CongratulationsProvider } from './hooks/CongratulationsProvider';
import { ToolAccessProvider } from './hooks/useToolAccess';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ToolPage from './pages/ToolPage';
import CompetitionPage from './components/CompetitionPage';
import ProfilePage from './pages/ProfilePage';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { Toaster } from 'react-hot-toast';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
const TrainerApp = React.lazy(() => import('./TRAINER/trainerExport'));
const DevToolboxApp = React.lazy(() => import('./dev-toolbox/App'));
const ToolsShowcaseApp = React.lazy(() => import('./ai-tools-showcase/App'));
import VerifyEmailPage from './pages/VerifyEmailPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserHistoryPage from './pages/admin/UserHistoryPage';
import TodoListPage from './pages/TodoListPage';
import NoteTakingPage from './pages/NoteTakingPage';
import ReferralPage from './pages/ReferralPage';
import LeaderboardPage from './pages/LeaderboardPage';
import BadgesPage from './pages/BadgesPage';
import PoliciesPage from './pages/PoliciesPage';
import SupportPage from './pages/SupportPage';
import ContactPage from './pages/ContactPage';
import HelpChatPage from './pages/HelpChatPage';
import CongratulationsModal from './components/CongratulationsModal';

// Wrapper to extract :mode param and pass it to TrainerApp
const TrainerWrapper: React.FC = () => {
  const params = ReactRouterDOM.useParams();
  const raw = params.mode ?? null;

  // map kebab-case route slug to trainer AppMode camelCase string
  const slugToMode = (s: string | null) => {
    if (!s) return null;
    const map: Record<string, string> = {
      'select': 'select',
      'lights-out': 'lightsOut',
      'grid-reflex': 'gridReflex',
      'precision-point': 'precisionPoint',
      'sequence': 'sequence',
      'color-match': 'colorMatch',
      'peripheral-vision': 'peripheralVision',
      'dodge-and-click': 'dodgeAndClick',
      'auditory-reaction': 'auditoryReaction',
      'cognitive-shift': 'cognitiveShift',
      'target-tracking': 'targetTracking',
      'digit-span': 'digitSpan',
      'visual-search': 'visualSearch'
    };
    const lower = s.toLowerCase();
    return map[lower] ?? null;
  };

  const mode = slugToMode(raw as string | null);

  // TrainerApp is lazy-loaded, type assertions used to avoid TSX prop typing issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <TrainerApp initialMode={mode} />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <CongratulationsProvider>
            <ToolAccessProvider>
              <ReactRouterDOM.HashRouter>
                <ReactRouterDOM.Routes>
                  {/* Trainer route rendered outside Layout so it displays full-screen without navbar/footer */}
                  <ReactRouterDOM.Route
                    path="/trainer/:mode?"
                    element={
                      <React.Suspense fallback={<div className="p-8 text-center">Loading Trainer...</div>}>
                        <TrainerWrapper />
                      </React.Suspense>
                    }
                  />

                  {/* Dev-toolbox rendered outside Layout to allow it to be full-screen (no main header/footer) */}
                  <ReactRouterDOM.Route
                    path="/toolbox/*"
                    element={
                      <React.Suspense fallback={<div className="p-8 text-center">Loading Toolbox...</div>}>
                        {/* @ts-ignore */}
                        <DevToolboxApp />
                      </React.Suspense>
                    }
                  />

                  {/* AI Tools Showcase rendered outside Layout so it can manage its own hash routing and full-screen UI */}
                  <ReactRouterDOM.Route
                    path="/showcase/*"
                    element={
                      <React.Suspense fallback={<div className="p-8 text-center">Loading Tools Showcase...</div>}>
                        {/* @ts-ignore */}
                        <ToolsShowcaseApp />
                      </React.Suspense>
                    }
                  />

                  {/* All other routes render inside the main Layout */}
                  <ReactRouterDOM.Route
                    path="/*"
                    element={
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
                            element={<ToolPage />} 
                          />
                          <ReactRouterDOM.Route 
                            path="/competition/:id"
                            element={<PrivateRoute><CompetitionPage /></PrivateRoute>}
                          />
                          {/* Route for own profile */}
                          <ReactRouterDOM.Route 
                            path="/profile" 
                            element={<PrivateRoute><ProfilePage /></PrivateRoute>} 
                          />
                          {/* Route for viewing any user's profile */}
                          <ReactRouterDOM.Route 
                            path="/profile/:username" 
                            element={<ProfilePage />} 
                          />
                          <ReactRouterDOM.Route 
                            path="/settings" 
                            element={<PrivateRoute><SettingsPage /></PrivateRoute>} 
                          />
                          <ReactRouterDOM.Route 
                            path="/referral" 
                            element={<PrivateRoute><ReferralPage /></PrivateRoute>} 
                          />
                          <ReactRouterDOM.Route 
                            path="/todo" 
                            element={<PrivateRoute><TodoListPage /></PrivateRoute>} 
                          />
                          <ReactRouterDOM.Route 
                            path="/notes" 
                            element={<PrivateRoute><NoteTakingPage /></PrivateRoute>} 
                          />
                          <ReactRouterDOM.Route 
                            path="/leaderboard" 
                            element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} 
                          />
                          <ReactRouterDOM.Route 
                            path="/badges" 
                            element={<PrivateRoute><BadgesPage /></PrivateRoute>} 
                          />
                          <ReactRouterDOM.Route 
                            path="/policies" 
                            element={<PoliciesPage />} 
                          />
                          <ReactRouterDOM.Route 
                            path="/support" 
                            element={<SupportPage />} 
                          />
                          <ReactRouterDOM.Route 
                            path="/contact" 
                            element={<ContactPage />} 
                          />
                          <ReactRouterDOM.Route 
                            path="/helpchat" 
                            element={<HelpChatPage />} 
                          />
                          {/* /toolbox is served by the full-screen dev-toolbox route defined above */}
                          
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
                    }
                  />
                </ReactRouterDOM.Routes>
                {/* Global Toaster for react-hot-toast */}
                <Toaster position="top-right" />
                {/* CongratulationsModal is rendered by the CongratulationsProvider */}
              </ReactRouterDOM.HashRouter>
            </ToolAccessProvider>
          </CongratulationsProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
