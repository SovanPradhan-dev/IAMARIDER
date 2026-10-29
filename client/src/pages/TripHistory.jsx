import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TripHistory() {
  const { tripId } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/trips/${tripId}/history/summary`)
      .then((res) => setSummary(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [tripId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center h-64 text-slate-500">Loading history...</div>
      </div>
    );
  }

  const { trip, members, messageCount, checkpoints, emergencies } = summary || {};
  const duration = trip.startedAt && trip.endedAt
    ? ((new Date(trip.endedAt) - new Date(trip.startedAt)) / 1000 / 60).toFixed(0)
    : '—';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <a href={`/trips/${tripId}`} className="text-sm text-forest-600 hover:underline mb-2 block">← Back to trip</a>
        <h1 className="text-2xl font-bold text-slate-900">Trip history</h1>
        <p className="text-slate-600">{trip?.name}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Duration</p>
          <p className="font-semibold text-slate-900">{duration} min</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Messages</p>
          <p className="font-semibold text-slate-900">{messageCount}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500 uppercase font-semibold">Checkpoints</p>
          <p className="font-semibold text-slate-900">{checkpoints?.length || 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Trip details</h3>
          <p className="text-sm text-slate-600 mb-1"><strong>Start:</strong> {trip?.startedAt ? new Date(trip.startedAt).toLocaleString() : '—'}</p>
          <p className="text-sm text-slate-600 mb-1"><strong>End:</strong> {trip?.endedAt ? new Date(trip.endedAt).toLocaleString() : '—'}</p>
          <p className="text-sm text-slate-600 mb-1"><strong>Status:</strong> {trip?.status}</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Route overview</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Start', lat: trip.startLocation?.coordinates?.[1] || 0 }, { name: 'Destination', lat: trip.destination?.coordinates?.[1] || 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="lat" fill="#1d7a57" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">Latitude comparison (start vs destination)</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">Participants ({members?.length || 0})</h3>
          <ul className="space-y-1 text-sm">
            {(members || []).map((m) => (
              <li key={m.userId._id} className="flex items-center gap-2 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-forest-600"></span>
                {m.userId.name} ({m.role})
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">Checkpoint arrivals</h3>
          <div className="space-y-1 text-sm">
            {emergencies?.length ? (
              <p className="text-xs text-slate-500 italic">See Emergency events tab for details.</p>
            ) : (
              <p className="text-xs text-slate-500 italic">No arrival data recorded.</p>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">Emergency events</h3>
          <div className="text-sm">
            <span className={`font-bold ${emergencies?.length ? 'text-red-600' : 'text-green-600'}`}>
              {emergencies?.length || 0} event(s)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
