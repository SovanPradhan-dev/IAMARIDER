import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { authStore } from './store/authStore';
import { setAccessToken } from './lib/api';
import Layout from './components/layout/Layout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateTrip from './pages/CreateTrip.jsx';
import JoinTrip from './pages/JoinTrip.jsx';
import TripDetails from './pages/TripDetails.jsx';
import LiveTrip from './pages/LiveTrip.jsx';
import TripMembers from './pages/TripMembers.jsx';
import TripChat from './pages/TripChat.jsx';
import Checkpoints from './pages/Checkpoints.jsx';
import Emergencies from './pages/Emergencies.jsx';
import TripHistory from './pages/TripHistory.jsx';
import ProfileSettings from './pages/ProfileSettings.jsx';
import NotFound from './pages/NotFound.jsx';

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Restore in-memory auth state from a valid access token if present
    // (e.g. after a refresh). Access token lives in memory only.
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <Routes>
      <Route path="/" element={<Public element={<Landing />} />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Public element={<Login />} />} />
        <Route path="register" element={<Public element={<Register />} />} />
      </Route>

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
  );
}
