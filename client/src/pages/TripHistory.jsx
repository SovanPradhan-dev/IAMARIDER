import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, MessageCircle, ShieldAlert, Users } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';
import RouteHistoryMap from '../components/map/RouteHistoryMap.jsx';

const durationMinutes = (start, end) => {
  if (!start || !end) return null;
  const minutes = Math.round((new Date(end) - new Date(start)) / 60000);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
};

export default function TripHistory() {
  const { tripId } = useParams();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/trips/${tripId}/history/summary`),
      api.get(`/trips/${tripId}/history`, { params: { page: 1, limit: 1000 } }),
    ])
      .then(([summaryResponse, historyResponse]) => {
        if (!active) return;
        setSummary(summaryResponse.data);
        setHistory(historyResponse.data.history || []);
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.error || 'Failed to load trip history');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tripId]);

  const stats = useMemo(() => ({
    duration: durationMinutes(summary?.trip?.startedAt, summary?.trip?.endedAt),
    members: summary?.members?.length || 0,
    checkpoints: summary?.checkpoints?.length || 0,
    alerts: summary?.emergencies?.length || 0,
  }), [summary]);

  if (loading) return <div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-36 rounded-3xl bg-white ring-1 ring-slate-200" /><div className="h-96 rounded-3xl bg-white ring-1 ring-slate-200" /><div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-40 rounded-2xl bg-white ring-1 ring-slate-200" />)}</div></div>;
  if (!summary?.trip) return <div role="alert" className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Trip history is not available.</div>;

  const { trip, members = [], messageCount = 0, checkpoints = [], emergencies = [], arrivals = [] } = summary;
  return (
    <div className="mx-auto max-w-6xl">
      <section className="mb-5 flex flex-col gap-5 rounded-[26px] bg-forest-950 p-6 text-white shadow-xl shadow-forest-950/10 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-emerald-300"><CalendarDays size={14} /> The journey so far</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight">{trip.name}</h2>
          <p className="mt-2 text-sm text-emerald-100/70">A record of the people, places, and moments from your trip.</p>
        </div>
        <Link to={`/trips/${tripId}`} className="inline-flex items-center gap-2 text-xs font-bold text-white/80 transition hover:text-white">Trip overview <ArrowRight size={14} /></Link>
      </section>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Recorded ride time', value: stats.duration === null ? '—' : `${stats.duration} min`, icon: Clock3, tone: 'bg-sky-50 text-sky-700' },
          { label: 'GPS samples', value: history.length, icon: Activity, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Messages shared', value: messageCount, icon: MessageCircle, tone: 'bg-violet-50 text-violet-700' },
          { label: 'Crew members', value: stats.members, icon: Users, tone: 'bg-orange-50 text-orange-700' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={17} /></span>
            <span><span className="block text-lg font-extrabold text-slate-900">{value}</span><span className="text-[10px] font-semibold text-slate-500">{label}</span></span>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 px-1">
          <div><h3 className="font-extrabold text-slate-900">Recorded route</h3><p className="mt-1 text-[11px] text-slate-500">Sampled GPS points shared by trip riders.</p></div>
          <span className="font-mono text-[10px] font-bold text-slate-400">{history.length} {history.length === 1 ? 'point' : 'points'}</span>
        </div>
        <div className="h-[320px] overflow-hidden rounded-2xl bg-slate-50 sm:h-[420px]">
          <RouteHistoryMap history={history} />
        </div>
        {history.length > 0 && <p className="mt-3 px-1 text-[10px] leading-5 text-slate-400">This is sampled location history, not a continuous recording or a measured distance. Different rider routes are shown in different colors.</p>}
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-extrabold text-slate-900">The crew</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">{members.length}</span></div>
          <div className="space-y-3">
            {members.length ? members.map((member) => (
              <div key={member._id} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-forest-50 text-xs font-extrabold text-forest-800">
                  {member.userId?.avatarUrl ? <img src={member.userId.avatarUrl} alt="" className="h-full w-full object-cover" /> : member.userId?.name?.[0]?.toUpperCase() || '?'}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">{member.userId?.name || 'Rider'}</span>
                <span className="text-[9px] capitalize text-slate-400">{member.role}</span>
              </div>
            )) : <p className="text-xs text-slate-500">No member records.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-extrabold text-slate-900">Checkpoint arrivals</h3><span className="rounded-full bg-forest-50 px-2 py-1 text-[9px] font-bold text-forest-700">{arrivals.length}</span></div>
          {arrivals.length ? <div className="space-y-3">
            {arrivals.slice(0, 6).map((arrival) => <div key={arrival._id} className="flex items-start gap-2.5"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-forest-600" /><p className="text-xs leading-5 text-slate-600"><strong className="font-bold text-slate-800">{arrival.userId?.name || 'Rider'}</strong> checked in at {new Date(arrival.arrivedAt).toLocaleString()}</p></div>)}
          </div> : <div className="py-4 text-center"><MapPin size={19} className="mx-auto text-slate-300" /><p className="mt-2 text-xs text-slate-500">No checkpoint arrivals were recorded.</p></div>}
          {checkpoints.length > 0 && <Link to={`/trips/${tripId}/checkpoints`} className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-forest-700">View checkpoints <ArrowRight size={12} /></Link>}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-extrabold text-slate-900">Safety alerts</h3><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${emergencies.length ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{emergencies.length}</span></div>
          {emergencies.length ? <div className="space-y-3">
            {emergencies.slice(0, 5).map((event) => <div key={event._id} className="flex items-start gap-2.5"><ShieldAlert size={15} className={`mt-0.5 shrink-0 ${event.status === 'active' ? 'text-rose-600' : 'text-slate-400'}`} /><p className="text-xs leading-5 text-slate-600"><strong className="font-bold uppercase text-slate-800">{event.eventType}</strong> · {event.reportedBy?.name || 'Rider'} · {event.status}</p></div>)}
          </div> : <div className="py-4 text-center"><ShieldAlert size={19} className="mx-auto text-slate-300" /><p className="mt-2 text-xs text-slate-500">No safety events recorded.</p></div>}
          {emergencies.length > 0 && <Link to={`/trips/${tripId}/emergencies`} className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-forest-700">View alerts <ArrowRight size={12} /></Link>}
        </section>
      </div>
    </div>
  );
}
