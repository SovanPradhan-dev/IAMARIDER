import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

export default function Dashboard() {
  const [upcoming, setUpcoming] = useState([]);
  const [active, setActive] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/users/me/trips');
        const trips = data.trips || [];
        const now = new Date();
        setActive(trips.filter((t) => t.status === 'active'));
        setUpcoming(trips.filter((t) => t.status === 'scheduled'));
        setCompleted(trips.filter((t) => t.status === 'completed' || t.status === 'cancelled'));
      } catch (_) {
        toast.error('Failed to load trips');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-slate-100 text-slate-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const tripCard = (trip) => (
    <Link
      key={trip._id}
      to={`/trips/${trip._id}`}
      className="card hover:shadow-md transition group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900">{trip.name}</h3>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(trip.status)}`}>
          {trip.status}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{trip.description || 'No description'}</p>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Code: {trip.tripCode}</span>
        <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );

  const section = (title, trips, color) => (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`}></span>
        {title}
      </h2>
      {trips.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No {title.toLowerCase()}</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{trips.map(tripCard)}</div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="flex items-center justify-center h-40 text-slate-500">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Manage your trips</p>
        </div>
        <div className="flex gap-3">
          <Link to="/trips/create" className="btn-primary">
            Create Trip
          </Link>
          <Link to="/trips/join" className="btn-outline">
            Join Trip
          </Link>
        </div>
      </div>

      {active.length > 0 && section('Active Trips', active, 'bg-green-600')}
      {upcoming.length > 0 && section('Upcoming Trips', upcoming, 'bg-blue-600')}
      {completed.length > 0 && section('Completed Trips', completed, 'bg-slate-600')}
      {active.length === 0 && upcoming.length === 0 && completed.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No trips yet</h2>
          <p className="mt-2 text-slate-600">Create your first trip or join one with a Trip ID.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to="/trips/create" className="btn-primary">Create Trip</Link>
            <Link to="/trips/join" className="btn-outline">Join Trip</Link>
          </div>
        </div>
      )}
    </div>
  );
}
