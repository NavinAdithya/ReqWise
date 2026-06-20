import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import QAWorkspacePage from './pages/QAWorkspacePage';
import ReviewPage from './pages/ReviewPage';
import ClientReviewPage from './pages/ClientReviewPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EmployeesPage from './pages/EmployeesPage';
import HistoryPage from './pages/HistoryPage';

export const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Unified Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN ONLY ROUTES */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <ProjectsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <ReviewPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <AnalyticsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout>
                <EmployeesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* QA ONLY ROUTES */}
        <Route
          path="/analysis"
          element={
            <ProtectedRoute allowedRoles={['QA']}>
              <DashboardLayout>
                <QAWorkspacePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* CLIENT ONLY ROUTES */}
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute allowedRoles={['CLIENT']}>
              <DashboardLayout>
                <ClientReviewPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* SHARED QA / CLIENT HISTORICAL ARCHIVE ROUTES */}
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={['QA', 'CLIENT']}>
              <DashboardLayout>
                <HistoryPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
