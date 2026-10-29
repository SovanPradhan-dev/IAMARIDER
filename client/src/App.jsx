import { lazy, Suspense, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { authStore } from './store/authStore';
import Layout from './components/layout/Layout.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CreateTrip = lazy(() => import('./pages/CreateTrip.jsx'));
const JoinTrip = lazy(() => import('./pages/JoinTrip.jsx'));
const TripDetails = lazy(() => import('./pages/TripDetails.jsx'));
const LiveTrip = lazy(() => import('./pages/LiveTrip.jsx'));
const TripMembers = lazy(() => import('./pages/TripMembers.jsx'));
const TripChat = lazy(() => import('./pages/TripChat.jsx'));
const Checkpoints = lazy(() => import('./pages/Checkpoints.jsx'));
const Emergencies = lazy(() => import('./pages/Emergencies.jsx'));
const TripHistory = lazy(() => import('./pages/TripHistory.jsx'));
const ProfileSettings = lazy(() => import('./pages/ProfileSettings.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const PageLoading = () => (
  <div className="flex min-h-64 items-center justify-center text-slate-500" role="status">
    Loading page...
  </div>
);

const Public = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return element;
};

const Private = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return element;
};

export default function App() {
  const { refresh } = useAuth();
  const authInitializationStarted = useRef(false);

  useEffect(() => {
    if (authInitializationStarted.current) return;
    authInitializationStarted.current = true;
    refresh().catch(() => authStore.clear());
  }, [refresh]);

  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Public element={<Landing />} />} />
            <Route path="/login" element={<Public element={<Login />} />} />
            <Route path="/register" element={<Public element={<Register />} />} />
            <Route path="dashboard" element={<Private element={<Dashboard />} />} />
            <Route path="trips/create" element={<Private element={<CreateTrip />} />} />
            <Route path="trips/join" element={<Private element={<JoinTrip />} />} />
            <Route path="trips/:tripId" element={<Private element={<TripDetails />} />} />
            <Route path="trips/:tripId/live" element={<Private element={<LiveTrip />} />} />
            <Route path="trips/:tripId/members" element={<Private element={<TripMembers />} />} />
            <Route path="trips/:tripId/chat" element={<Private element={<TripChat />} />} />
            <Route path="trips/:tripId/checkpoints" element={<Private element={<Checkpoints />} />} />
            <Route path="trips/:tripId/emergencies" element={<Private element={<Emergencies />} />} />
            <Route path="trips/:tripId/history" element={<Private element={<TripHistory />} />} />
            <Route path="profile" element={<Private element={<ProfileSettings />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
