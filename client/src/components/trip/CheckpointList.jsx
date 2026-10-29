import { useState } from 'react';
import { api } from '../../lib/api';
import { toast } from '../common/Toast.jsx';

export default function CheckpointList({ tripId, checkpoints, isLeader }) {
  const [newCp, setNewCp] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    sequence: '',
    plannedArrivalAt: '',
  });
  const [loading, setLoading] = useState(false);

  const addCheckpoint = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      setNewCp({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        sequence: '',
        plannedArrivalAt: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add checkpoint');
    } finally {
      setLoading(false);
    }
  };

  const reportArrival = async (cpId) => {
    if (!confirm('Report arrival at this checkpoint?')) return;
    try {
      await api.post(`/trips/${tripId}/checkpoints/${cpId}/arrivals`);
      toast.success('Arrival reported');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report arrival');
    }
  };

  return (
    <div className="card h-[420px] flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Checkpoints</h3>
        {isLeader ? (
          <button className="text-xs text-forest-600 hover:underline">Manage</button>
        ) : null}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {checkpoints.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">
            No checkpoints
          </p>
        ) : (
          checkpoints.map((cp) => (
            <div key={cp._id} className="p-2 rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900">{cp.name}</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                  #{cp.sequence}
                </span>
              </div>
              {cp.description ? (
                <p className="text-xs text-slate-600 mb-1">{cp.description}</p>
              ) : null}
              <button
                onClick={() => reportArrival(cp._id)}
                className="text-[10px] text-forest-600 font-semibold hover:underline px-2 py-1"
              >
                Report arrival
              </button>
            </div>
          ))
        )}
      </div>
      {isLeader ? (
        <div className="p-3 border-t border-slate-200">
          <form onSubmit={addCheckpoint} className="space-y-2">
            <input
              placeholder="Checkpoint name"
              value={newCp.name}
              onChange={(e) => setNewCp({ ...newCp, name: e.target.value })}
              className="input text-xs"
            />
            <div className="flex gap-2">
              <input
                placeholder="Lat"
                value={newCp.latitude}
                onChange={(e) => setNewCp({ ...newCp, latitude: e.target.value })}
                className="input text-xs flex-1"
              />
              <input
                placeholder="Lon"
                value={newCp.longitude}
                onChange={(e) => setNewCp({ ...newCp, longitude: e.target.value })}
                className="input text-xs flex-1"
              />
              <input
                placeholder="Seq"
                value={newCp.sequence}
                onChange={(e) => setNewCp({ ...newCp, sequence: e.target.value })}
                className="input text-xs w-20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs py-1.5"
            >
              {loading ? 'Adding...' : 'Add checkpoint'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
