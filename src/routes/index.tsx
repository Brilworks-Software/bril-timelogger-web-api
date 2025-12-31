import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Users from './components/Users';
import TimeTrackingSummary from './components/TimeTracking/TimeTrackingSummary';
import UserList from './components/TimeTracking/UserList';
import UserActivity from './components/TimeTracking/UserActivity';
import UserScreenshots from './components/TimeTracking/UserScreenshots';
import TimeTrackingSummaryDashboard from './components/TimeTracking/TimeTrackingSummaryDashboard';
import ReportsTab from './components/TimeTracking/Reports/ReportsTab';
import DashboardLayout from './partials/Header';
import Login from './pages/Login';

const queryClient = new QueryClient();

const AppRoutes: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<DashboardLayout />}>
          {/* Time Tracker's Summary */}
          <Route path="/time-tracking" element={<TimeTrackingSummary />}>
            <Route index element={<TimeTrackingSummaryDashboard />} />
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
    </QueryClientProvider>
  );
};

export default AppRoutes; 