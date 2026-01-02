import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { theme } from './styles/theme';
import ErrorBoundary from './components/ErrorBoundary';
import Users from './components/Users';
import TimeTrackingSummary from './components/TimeTracking/TimeTrackingSummary';
import UserList from './components/TimeTracking/UserList';
import UserActivity from './components/TimeTracking/UserActivity';
import UserScreenshots from './components/TimeTracking/UserScreenshots';
import TimeTrackingSummaryDashboard from './components/TimeTracking/TimeTrackingSummaryDashboard';
import ReportsTab from './components/TimeTracking/Reports/ReportsTab';
import DashboardLayout from './partials/Header';
import Login from './pages/Login';
import TimeTrackingConditional from './components/TimeTracking/TimeTrackingConditional';
import { ToastProvider } from './contexts/ToastContext';
import { LoadingProvider } from './contexts/LoadingContext';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            <LoadingProvider>
              <ToastProvider>
                <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<DashboardLayout />}>
                      {/* Time Tracker's Summary */}
                      <Route path="/time-tracking" element={<TimeTrackingSummary />}>
                        <Route index element={<TimeTrackingConditional />} />
                        <Route path="summary" element={<TimeTrackingSummaryDashboard />} />
                        <Route path="screenshots" element={<UserScreenshots />} />
                        <Route path="users" element={<UserList />} />
                        <Route path="activity" element={<UserActivity />} />
                        <Route path="reports" element={<ReportsTab />} />
                      </Route>

                      {/* Users */}
                      <Route path="/users" element={<Users />} />

                      {/* Default redirect to dashboard */}
                      <Route path="/" element={<Navigate to="/time-tracking" replace />} />
                    </Route>
                  </Routes>
                </Router>
              </ToastProvider>
            </LoadingProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
};

export default App;
