import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Crown, Shield, UserRound, UserRoundMinus, Users } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

export default function TripMembers() {
  const { tripId } = useParams();
  const [members, setMembers] = useState([]);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  const loadMembers = useCallback(async () => {
    try {
      const [tripResponse, memberResponse] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/members`),
      ]);
      setTrip(tripResponse.data.trip);
      setMembers(memberResponse.data.members || []);
      setIsLeader(tripResponse.data.membership?.role === 'leader');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load trip members');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this rider from the trip?')) return;
    setWorkingId(memberId);
    try {
      await api.delete(`/trips/${tripId}/members/${memberId}`);
      setMembers((current) => current.filter((member) => member.userId?._id !== memberId));
      toast.success('Rider removed from the trip');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not remove this rider');
    } finally {
      setWorkingId(null);
    }
  };

  const transferLeadership = async (memberId) => {
    if (!window.confirm('Transfer trip leadership to this rider?')) return;
    setWorkingId(memberId);
    try {
      await api.post(`/trips/${tripId}/transfer-leadership`, { targetUserId: memberId });
      setMembers((current) => current.map((member) => ({
        ...member,
        role: member.userId?._id === memberId ? 'leader' : member.role === 'leader' ? 'rider' : member.role,
      })));
      setIsLeader(false);
      toast.success('Trip leadership transferred');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not transfer trip leadership');
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl animate-pulse space-y-4"><div className="h-36 rounded-3xl bg-white ring-1 ring-slate-200" />{[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-5 rounded-[26px] bg-forest-950 p-6 text-white shadow-xl shadow-forest-950/10 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-emerald-300"><Users size={14} /> Your crew</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">The people behind the ride.</h2>
          <p className="mt-2 text-sm text-emerald-100/70">{trip?.name} · {members.length} of {trip?.maxMembers || '—'} riders</p>
        </div>
        <Link to={`/trips/${tripId}`} className="inline-flex items-center gap-2 text-xs font-bold text-white/80 transition hover:text-white">Trip overview <ArrowRight size={14} /></Link>
      </div>

      {members.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {members.map((member) => {
            const rider = member.userId || {};
            const isTripLeader = member.role === 'leader';
            return (
              <article key={member._id} className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:flex-row sm:items-center sm:p-5">
                <span className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl ${isTripLeader ? 'bg-amber-50 text-amber-700' : 'bg-forest-50 text-forest-800'}`}>
                  {rider.avatarUrl ? <img src={rider.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-base font-extrabold">{rider.name?.[0]?.toUpperCase() || <UserRound size={20} />}</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-extrabold text-slate-900">{rider.name || 'Rider'}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] ${isTripLeader ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                      {isTripLeader && <Crown size={11} />}{member.role}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{rider.email || 'Trip member'}</p>
                  <p className="mt-1 text-[10px] text-slate-400">Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'this trip'}</p>
                </div>
                {isLeader && !isTripLeader && (
                  <div className="flex gap-2 sm:flex-col">
                    <button disabled={workingId === rider._id} onClick={() => transferLeadership(rider._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50">
                      <Shield size={13} /> Make leader
                    </button>
                    <button disabled={workingId === rider._id} onClick={() => removeMember(rider._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50">
                      <UserRoundMinus size={13} /> Remove
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Users size={23} /></span>
          <h3 className="mt-4 font-extrabold text-slate-900">Your crew will show up here.</h3>
          <p className="mt-2 text-sm text-slate-500">Share the trip code with riders you want to invite.</p>
        </div>
      )}
    </div>
  );
}
