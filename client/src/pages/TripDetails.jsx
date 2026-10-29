import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

export default function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, mRes] = await Promise.all([
          api.get(`/trips/${tripId}`),
          api.get(`/trips/${tripId}/members`),
        ]);
        setTrip(tRes.data.trip);
        setMembers(mRes.data.members || []);
        // Determine leadership by role
        const me = mRes.data.members.find((m) => m.userId?._id === tRes.data?.trip?.createdBy);
        setIsLeader(me?.role === 'leader');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load trip');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center h-64 text-slate-500">Loading trip...</div>
      </div>
    );
  }
  if (!trip) return <div className="max-w-4xl mx-auto py-12 px-4">Trip not found.</div>;

  const statusColor = (s) => {
    switch (s) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-slate-100 text-slate-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/dashboard" className="text-sm text-forest-600 hover:underline mb-2 block">← Back to trips</Link>
          <h1 className="text-2xl font-bold text-slate-900">{trip.name}</h1>
          <p className="text-slate-600">{trip.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/trips/${tripId}/live`} className="btn-primary">Live map</Link>
          <Link to={`/trips/${tripId}/members`} className="btn-outline">Members</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Trip ID</p>
          <p className="font-mono font-semibold text-slate-900">{trip.tripCode}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
          <span className={`inline-block text-sm font-semibold px-2.5 py-1 rounded-full ${statusColor(trip.status)}`}>
            {trip.status}
          </span>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Members</p>
          <p className="font-semibold text-slate-900">{members.length}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Starting point</p>
          <p className="text-sm text-slate-900">{trip.startLocation?.coordinates?.[1]?.toFixed(4)}, {trip.startLocation?.coordinates?.[0]?.toFixed(4)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Destination</p>
          <p className="text-sm text-slate-900">{trip.destination?.coordinates?.[1]?.toFixed(4)}, {trip.destination?.coordinates?.[0]?.toFixed(4)}</p>
        </div>
      </div>

      {trip.status === 'scheduled' && isLeader && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Trip controls</h3>
            <button
              onClick={() => {
                if (!confirm('Start this trip?')) return;
                api.post(`/trips/${tripId}/start`).then(() => {
                  toast.success('Trip started');
                  setTimeout(() => window.location.reload(), 500);
                }).catch((e) => toast.error(e.response?.data?.error || 'Failed to start'));
              }}
              className="btn-primary"
            >
              Start trip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
