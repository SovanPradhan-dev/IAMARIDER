import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io as Client } from 'socket.io-client';
import { api } from '../lib/api';
import { api } from '../lib/api';
import { connectSocket, getSocket, disconnectSocket } from '../lib/socket';
import { useAuth } from '../hooks/useAuth';
import { useGeolocation } from '../hooks/useGeolocation';
import { toast } from '../components/common/Toast.jsx';
import LiveMap from '../components/map/LiveMap.jsx';
import RiderList from '../components/trip/RiderList.jsx';
import CheckpointList from '../components/trip/CheckpointList.jsx';
import ChatPanel from '../components/chat/ChatPanel.jsx';
import Button from '../components/common/Button.jsx';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function LiveTrip() {
  const { tripId } = useParams();
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [trip, setTrip] = useState(null);
  const [riders, setRiders] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [locationSharing, setLocationSharing] = useState(false);
  const [gpsPermission, setGpsPermission] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [myLocation, setMyLocation] = useState(null);

  const handleLocation = useCallback(
    (loc) => {
      setMyLocation(loc);
      const sock = getSocket();
      if (sock && locationSharing) {
        sock.emit('location:update', { tripId, ...loc }, (resp) => {
          if (resp?.error) setGpsError(resp.error);
        });
      }
    },
    [tripId, locationSharing]
  );

  const {
    position,
    error: posError,
    permission,
    requestPermission,
    start,
    stop,
  } = useGeolocation({ sendLocation: handleLocation, enabled: locationSharing, intervalMs: 4000 });

  useEffect(() => {
    if (posError) setGpsError(posError);
    if (permission !== undefined) setGpsPermission(permission);
    if (position) setMyLocation(position);
  }, [posError, permission, position]);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, cRes, eRes] = await Promise.all([
          api.get(`/trips/${tripId}`),
          api.get(`/trips/${tripId}/checkpoints`),
          api.get(`/trips/${tripId}/emergencies`),
          api.get(`/trips/${tripId}/locations`),
        ]);
        setTrip(tRes.data.trip);
        setCheckpoints(cRes.data.checkpoints || []);
        setEmergencies(eRes.data.emergencies || []);
        setRiders(tRes.data.locations || []);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load trip');
      }
    };
    load();
  }, [tripId]);

  useEffect(() => {
    if (!accessToken) return;
    const sock = connectSocket(accessToken);
    socketRef.current = sock;

    sock.on('connect', () => setConnectionStatus('connected'));
    sock.on('disconnect', () => setConnectionStatus('disconnected'));
    sock.on('connect_error', () => setConnectionStatus('disconnected'));

    sock.emit('trip:join', { tripId }, (resp) => {
      if (resp?.error) {
        toast.error(resp.error);
        navigate('/dashboard');
        return;
      }
      setRiders(resp.locations || []);
    });

    sock.on('location:changed', (data) => {
      setRiders((prev) =>
        prev.map((r) => (r.userId === data.userId ? { ...r, ...data } : r))
      );
      if (data.userId === user?._id) setMyLocation(data);
    });

    sock.on('trip:member:joined', (data) => {
      toast.success(`${data.userId} joined`);
    });

    sock.on('trip:ended', () => {
      toast.info('Trip has ended by the leader');
      setConnectionStatus('disconnected');
      setTimeout(() => navigate(`/trips/${tripId}`), 2000);
    });

    sock.on('trip:error', (err) => toast.error(err.message || 'Trip error'));

    return () => {
      sock.emit('trip:leave', { tripId });
      sock.off('connect');
      sock.off('disconnect');
      sock.off('location:changed');
      sock.off('trip:member:joined');
      sock.off('trip:ended');
      sock.off('trip:error');
    };
  }, [tripId, accessToken, user?._id, navigate]);

  const toggleSharing = async () => {
    if (!locationSharing) {
      const granted = await requestPermission();
      if (!granted) {
        setLocationSharing(false);
        return;
      }
    }
    setLocationSharing((prev) => !prev);
  };

  const isLeader = trip?.leaderId?._id === user?._id || trip?.leaderId === user?._id;
  const myRider = riders.find((r) => r.userId === user?._id);
  const freshness = myLocation
    ? (Date.now() - new Date(myLocation.recordedAt || myLocation.updatedAt).getTime()) < 90000
      ? 'online'
      : 'stale'
    : 'offline';

  const endTrip = async () => {
    if (!confirm('End this trip for everyone?')) return;
    try {
      await api.post(`/trips/${tripId}/end`);
      toast.success('Trip ended');
      navigate(`/trips/${tripId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to end trip');
    }
  };

  const reportEmergency = async (type) => {
    if (!confirm(`Activate ${type.toUpperCase()} alert? This notifies all trip members.`)) return;
    try {
      const payload = { eventType: type };
      if (myLocation) {
        payload.latitude = myLocation.latitude;
        payload.longitude = myLocation.longitude;
      }
      await api.post(`/trips/${tripId}/emergencies`, payload);
      toast.success(`${type} alert sent to trip members`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send alert');
    }
  };

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center h-64 text-slate-500">Loading trip...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to={`/trips/${tripId}`} className="text-sm text-forest-600 hover:underline mb-2 block">← Trip details</Link>
          <h1 className="text-2xl font-bold text-slate-900">{trip.name}</h1>
          <span className={`ml-3 inline-block text-xs font-semibold px-2 py-1 rounded-full ${
            trip.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
          }`}>
            {trip.status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
          <span className="text-xs text-slate-600">{connectionStatus}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Map - 7 cols */}
        <div className="lg:col-span-7">
          <div className="card h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Live map</h3>
              <div className="flex gap-2">
                <Button onClick={() => {}} size="sm" variant="outline">Recenter</Button>
                <Button
                  onClick={toggleSharing}
                  size="sm"
                  variant={locationSharing ? 'danger' : 'primary'}
                >
                  {locationSharing ? 'Stop sharing' : 'Share location'}
                </Button>
              </div>
            </div>
            <div className="flex-1 relative">
              <LiveMap
                riders={riders}
                checkpoints={checkpoints}
                route={{
                  coordinates: [
                    trip.startLocation?.coordinates || [88.3639, 22.5726],
                    trip.destination?.coordinates || [87.5115, 22.2503],
                  ],
                }}
                center={[trip.startLocation?.coordinates?.[1] ?? 22.5726, trip.startLocation?.coordinates?.[0] ?? 88.3639]}
                fitToRiders
              />
            </div>
            {gpsError && (
              <div className="p-3 rounded-md bg-red-50 text-xs text-red-700 border border-red-100">
                GPS: {gpsError}
              </div>
            )}
            {!locationSharing && (
              <div className="p-3 rounded-md bg-slate-50 text-xs text-slate-600 border border-slate-100">
                Location sharing is off. Enable it to appear on the map.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="card h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                Riders ({riders.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <RiderList riders={riders} currentUserId={user?._id} />
            </div>
          </div>

          <CheckpointList tripId={tripId} checkpoints={checkpoints} isLeader={isLeader} />

          <div className="card p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Emergency</h3>
            <p className="text-xs text-slate-500 mb-3">
              Alerts are sent only to members of this trip. RideTogether does not contact emergency services.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => reportEmergency('sos')} className="btn-danger py-2 text-xs font-semibold">
                SOS
              </button>
              <button onClick={() => reportEmergency('breakdown')} className="btn-outline py-2 text-xs font-semibold">
                Breakdown
              </button>
              <button onClick={() => reportEmergency('medical')} className="btn-outline py-2 text-xs font-semibold">
                Medical
              </button>
            </div>
            {emergencies.length > 0 && (
              <div className="mt-3 space-y-1">
                {emergencies.slice(0, 3).map((e) => (
                  <div key={e._id} className="text-xs p-2 rounded bg-red-50 text-red-800 border border-red-100">
                    {e.eventType.toUpperCase()} — {e.status}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLeader && trip.status === 'active' && (
            <div className="card p-4">
              <button
                onClick={endTrip}
                className="btn-danger w-full py-2 text-sm font-semibold"
              >
                End trip
              </button>
            </div>
          )}
        </div>
      </div>

      <ChatPanel tripId={tripId} />
    </div>
  );
}
