import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

export default function Checkpoints() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [checkpoints, setCheckpoints] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const [newCp, setNewCp] = useState({ name: '', description: '', latitude: '', longitude: '', sequence: '', plannedArrivalAt: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          api.get(`/trips/${tripId}`),
          api.get(`/trips/${tripId}/checkpoints`),
        ]);
        setTrip(tRes.data.trip);
        setCheckpoints(cRes.data.checkpoints || []);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load checkpoints');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId]);

  const addCheckpoint = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/trips/${tripId}/checkpoints`, {
        name: newCp.name,
        description: newCp.description,
        latitude: parseFloat(newCp.latitude),
        longitude: parseFloat(newCp.longitude),
        sequence: parseInt(newCp.sequence, 10),
        plannedArrivalAt: newCp.plannedArrivalAt || undefined,
      });
      toast.success('Checkpoint added');
      setNewCp({ name: '', description: '', latitude: '', longitude: '', sequence: '', plannedArrivalAt: '' });
      const res = await api.get(`/trips/${tripId}/checkpoints`);
      setCheckpoints(res.data.checkpoints || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add checkpoint');
    }
  };

  const deleteCheckpoint = async (id) => {
    if (!confirm('Delete this checkpoint?')) return;
    try {
      await api.delete(`/trips/${tripId}/checkpoints/${id}`);
      toast.success('Deleted');
      setCheckpoints(checkpoints.filter((c) => c._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center h-64 text-slate-500">Loading checkpoints...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <a href={`/trips/${tripId}`} className="text-sm text-forest-600 hover:underline mb-2 block">← Back to trip</a>
          <h1 className="text-2xl font-bold text-slate-900">Checkpoints</h1>
          <p className="text-slate-600">{trip?.name}</p>
        </div>
        {isLeader && (
          <button onClick={() => {}} className="btn-outline text-sm">Manage</button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {checkpoints.map((cp) => (
          <div key={cp._id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">{cp.name}</h3>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">#{cp.sequence}</span>
            </div>
            {cp.description && <p className="text-sm text-slate-600 mb-2">{cp.description}</p>}
            <p className="text-xs text-slate-500 mb-3">
              {cp.location?.coordinates?.[1]?.toFixed(5)}, {cp.location?.coordinates?.[0]?.toFixed(5)}
            </p>
            {cp.plannedArrivalAt && (
              <p className="text-xs text-slate-500 mb-3">Planned: {new Date(cp.plannedArrivalAt).toLocaleString()}</p>
            )}
            <button
              onClick={() => { /* arrival handled in live page */ }}
              className="text-[11px] text-forest-600 font-semibold hover:underline w-full"
            >
              Report arrival
            </button>
            {isLeader && (
              <button
                onClick={() => deleteCheckpoint(cp._id)}
                className="mt-2 text-[11px] text-red-600 font-semibold hover:underline w-full"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      {isLeader && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">Add checkpoint</h3>
          <form onSubmit={addCheckpoint} className="grid md:grid-cols-4 gap-4">
            <input
              placeholder="Name"
              value={newCp.name}
              onChange={(e) => setNewCp({ ...newCp, name: e.target.value })}
              className="input"
            />
            <input
              placeholder="Lat"
              value={newCp.latitude}
              onChange={(e) => setNewCp({ ...newCp, latitude: e.target.value })}
              className="input"
            />
            <input
              placeholder="Lon"
              value={newCp.longitude}
              onChange={(e) => setNewCp({ ...newCp, longitude: e.target.value })}
              className="input"
            />
            <input
              placeholder="Seq"
              value={newCp.sequence}
              onChange={(e) => setNewCp({ ...newCp, sequence: e.target.value })}
              className="input"
            />
            <button type="submit" className="btn-primary">Add</button>
          </form>
        </div>
      )}
    </div>
  );
}
