import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LoadingSpinner from './components/LoadingSpinner';

// The sign-in page is loaded eagerly because it is the first screen a visitor
// sees; everything else is split into its own chunk so the initial download
// stays small (the charts on the authenticated pages never load until needed).
import Login from './pages/Login';

const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExaminationDetails = lazy(() => import('./pages/ExaminationDetails'));
const StudentInformation = lazy(() => import('./pages/StudentInformation'));
const HttpMonitor = lazy(() => import('./pages/HttpMonitor'));
const RequestHistory = lazy(() => import('./pages/RequestHistory'));
const ApiTestCenter = lazy(() => import('./pages/ApiTestCenter'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * Route map.
 *  /login                -> public sign in (verified against the database)
 *  /register             -> public sign up (writes the account to the database)
 *  /*                    -> protected application shell (sidebar + navbar)
 *  *                     -> 404 page
 */
const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="route-loading">
              <LoadingSpinner label="Loading" />
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="examinations" element={<ExaminationDetails />} />
              <Route path="student-information" element={<StudentInformation />} />
              <Route path="http-monitor" element={<HttpMonitor />} />
              <Route path="request-history" element={<RequestHistory />} />
              <Route path="api-test-center" element={<ApiTestCenter />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
