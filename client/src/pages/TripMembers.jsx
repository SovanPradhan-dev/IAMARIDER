import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';
import { useAuth } from '../hooks/useAuth';

export default function TripMembers() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [trip, setTrip] = useState(null);
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
        setIsLeader(tRes.data.trip.leaderId?._id === user?._id);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load members');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId, user?._id]);

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the trip?')) return;
    try {
      await api.delete(`/trips/${tripId}/members/${userId}`);
      toast.success('Member removed');
      setMembers((prev) => prev.filter((m) => m.userId._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const transferLeadership = async (userId) => {
    if (!confirm('Transfer leadership to this member?')) return;
    try {
      await api.post(`/trips/${tripId}/transfer-leadership`, { targetUserId: userId });
      toast.success('Leadership transferred');
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to transfer leadership');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-center h-64 text-slate-500">Loading members...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <a href={`/trips/${tripId}`} className="text-sm text-forest-600 hover:underline mb-2 block">← Back to trip</a>
          <h1 className="text-2xl font-bold text-slate-900">Members</h1>
          <p className="text-slate-600">{trip?.name}</p>
        </div>
      </div>

      <div className="card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 text-sm font-semibold text-slate-600">Member</th>
              <th className="pb-3 text-sm font-semibold text-slate-600">Role</th>
              <th className="pb-3 text-sm font-semibold text-slate-600">Status</th>
              <th className="pb-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.userId._id} className="group hover:bg-slate-50">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-xs">
                      {m.userId.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{m.userId.name}</div>
                      <div className="text-xs text-slate-500">{m.userId.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    m.role === 'leader' ? 'bg-forest-100 text-forest-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {m.role}
                  </span>
                </td>
                <td className="py-4">
                  <span className={`text-xs font-semibold ${
                    m.status === 'joined' ? 'text-green-700' : 'text-red-600'
                  }`}>{m.status}</span>
                </td>
                <td className="py-4 text-right">
                  {m.role !== 'leader' && isLeader && (
                    <>
                      <button
                        onClick={() => transferLeadership(m.userId._id)}
                        className="text-[10px] text-forest-600 font-semibold mr-3 hover:underline"
                      >
                        Make leader
                      </button>
                      <button
                        onClick={() => removeMember(m.userId._id)}
                        className="text-[10px] text-red-600 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
