import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

export default function Emergencies() {
  const { tripId } = useParams();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/trips/${tripId}/emergencies`)
      .then((res) => setEmergencies(res.data.emergencies || []))
      .catch((err) => toast.error(err.response?.data?.error || 'Failed to load emergencies'))
      .finally(() => setLoading(false));
  }, [tripId]);

  const resolveEmergency = async (id, status) => {
    const notes = prompt('Resolution notes (optional):');
    try {
      await api.patch(`/trips/${tripId}/emergencies/${id}`, { status, resolutionNotes: notes });
      toast.success(`Emergency marked ${status}`);
      setEmergencies((prev) => prev.map((e) => (e._id === id ? { ...e, status, resolvedAt: new Date().toISOString() } : e)));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center h-64 text-slate-500">Loading emergencies...</div>
      </div>
    );
  }

  const typeColor = (t) => {
    switch (t) {
      case 'sos': return 'bg-red-100 text-red-800';
      case 'medical': return 'bg-orange-100 text-orange-800';
      case 'breakdown': return 'bg-amber-100 text-amber-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <a href={`/trips/${tripId}`} className="text-sm text-forest-600 hover:underline mb-2 block">← Back to trip</a>
        <h1 className="text-2xl font-bold text-slate-900">Emergency events</h1>
      </div>

      <div className="card">
        {emergencies.length === 0 ? (
          <p className="p-8 text-center text-slate-500 italic">No emergency events</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {emergencies.map((e) => (
              <div key={e._id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${typeColor(e.eventType)}`}>
                    {e.eventType.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-sm text-slate-900 mb-1">
                  Reported by: {e.reportedBy?.name || 'Unknown'}
                </div>
                {e.location && (
                  <p className="text-xs text-slate-600 mb-1">
                    {e.location.coordinates?.[1]?.toFixed(5)}, {e.location.coordinates?.[0]?.toFixed(5)}
                  </p>
                )}
                <span className={`text-xs font-semibold ${
                  e.status === 'active' ? 'text-red-600' : 'text-green-600'
                }`}>Status: {e.status}</span>
                {e.resolutionNotes && (
                  <p className="mt-1 text-xs text-slate-600">Notes: {e.resolutionNotes}</p>
                )}
                {e.status === 'active' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => resolveEmergency(e._id, 'resolved')}
                      className="text-[11px] text-green-700 font-semibold hover:underline"
                    >
                      Mark resolved
                    </button>
                    <button
                      onClick={() => resolveEmergency(e._id, 'cancelled')}
                      className="text-[11px] text-red-600 font-semibold hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
