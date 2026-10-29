import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity, ArrowRight, CalendarDays, Check, Copy, MapPin, MessageCircle,
  ShieldAlert, Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

const routeLinks = [
  { path: 'live', label: 'Live map', detail: 'See your crew on the route', icon: Activity, color: 'bg-emerald-50 text-emerald-700' },
  { path: 'members', label: 'Riders', detail: 'Meet the trip members', icon: Users, color: 'bg-sky-50 text-sky-700' },
  { path: 'chat', label: 'Trip chat', detail: 'Keep everyone in sync', icon: MessageCircle, color: 'bg-violet-50 text-violet-700' },
  { path: 'checkpoints', label: 'Checkpoints', detail: 'Stops and arrival updates', icon: MapPin, color: 'bg-orange-50 text-orange-700' },
  { path: 'emergencies', label: 'Safety alerts', detail: 'Trip alerts and event history', icon: ShieldAlert, color: 'bg-rose-50 text-rose-700' },
  { path: 'history', label: 'Trip history', detail: 'A record of the journey', icon: CalendarDays, color: 'bg-slate-100 text-slate-700' },
];

const formatPoint = (point) => {
  const coordinates = point?.coordinates;
  return coordinates?.length === 2
    ? `${coordinates[1].toFixed(4)}°, ${coordinates[0].toFixed(4)}°`
    : 'Location not set';
};

export default function TripDetails() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const loadTrip = useCallback(async () => {
    try {
      const [tripResponse, memberResponse] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/members`),
      ]);
      setTrip(tripResponse.data.trip);
      setMembers(memberResponse.data.members || []);
      setIsLeader(tripResponse.data.membership?.role === 'leader');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const changeStatus = async (action, nextStatus, confirmation) => {
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/trips/${tripId}/${action}`);
      if (data.trip) setTrip(data.trip);
      else setTrip((current) => ({ ...current, status: nextStatus }));
      toast.success(nextStatus === 'active' ? 'Trip started. Have a great ride!' : `Trip ${nextStatus}.`);
    } catch (err) {
      toast.error(err.response?.data?.error || `Could not ${action} this trip`);
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(trip.tripCode);
      setCopied(true);
      toast.success('Trip code copied');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Clipboard access is unavailable in this browser');
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl animate-pulse space-y-5"><div className="h-52 rounded-[28px] bg-white ring-1 ring-slate-200" /><div className="h-32 rounded-3xl bg-white ring-1 ring-slate-200" /><div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-32 rounded-3xl bg-white ring-1 ring-slate-200" />)}</div></div>;
  }
  if (!trip) {
    return <div role="alert" className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 text-center"><h2 className="text-xl font-extrabold text-slate-900">Trip unavailable</h2><p className="mt-2 text-sm text-slate-500">This trip could not be found or you no longer have access.</p><Link to="/dashboard" className="btn-primary mt-6">Back to overview</Link></div>;
  }

  const statusColor = {
    active: 'bg-emerald-100 text-emerald-800',
    scheduled: 'bg-sky-100 text-sky-800',
    completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-rose-100 text-rose-700',
  }[trip.status] || 'bg-slate-100 text-slate-700';

  return (
    <div className="mx-auto max-w-[1320px]">
      <section className="relative overflow-hidden rounded-[28px] bg-forest-950 px-6 py-7 text-white shadow-xl shadow-forest-950/10 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/[.08]" />
        <div className="pointer-events-none absolute right-8 top-12 h-52 w-52 rounded-full border border-white/[.08]" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-200">
              <span className={`h-2 w-2 rounded-full ${trip.status === 'active' ? 'animate-pulse bg-emerald-300' : 'bg-white/60'}`} />
              {trip.status} trip
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{trip.name}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/70">{trip.description || 'A new journey with your crew. All the details in one place.'}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-emerald-100/80">
              <span className="inline-flex items-center gap-2"><CalendarDays size={14} />{trip.plannedDepartureAt ? new Date(trip.plannedDepartureAt).toLocaleString() : 'Departure time not set'}</span>
              <span className="inline-flex items-center gap-2"><Users size={14} />{members.length} / {trip.maxMembers} riders</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            {trip.status === 'active' && <Link to={`/trips/${tripId}/live`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-forest-900 transition hover:-translate-y-0.5 hover:bg-emerald-50"><Activity size={15} /> Open live map</Link>}
            {trip.status === 'scheduled' && isLeader && (
              <>
                <button disabled={busy} onClick={() => changeStatus('start', 'active', 'Start this trip for all members?')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-forest-900 transition hover:bg-emerald-50 disabled:opacity-60"><Activity size={15} /> Start trip</button>
                <button disabled={busy} onClick={() => changeStatus('cancel', 'cancelled', 'Cancel this trip? Members will no longer be able to ride it.')} className="rounded-xl border border-white/20 px-4 py-3 text-xs font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-60">Cancel trip</button>
              </>
            )}
            {trip.status === 'active' && isLeader && <button disabled={busy} onClick={() => changeStatus('end', 'completed', 'End this trip for everyone?')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-xs font-extrabold text-white transition hover:bg-rose-600 disabled:opacity-60">End trip</button>}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-[1.2fr_.8fr_.8fr]">
        <button type="button" onClick={copyCode} className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:border-forest-200 hover:shadow-md">
          <span>
            <span className="block text-[9px] font-extrabold uppercase tracking-[.15em] text-slate-400">Invite your crew · Trip code</span>
            <span className="mt-1 block font-mono text-lg font-extrabold tracking-[.12em] text-slate-900">{trip.tripCode}</span>
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700">{copied ? <Check size={17} /> : <Copy size={17} />}</span>
        </button>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-slate-400">Starting point</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800"><span className="h-2 w-2 rounded-full bg-forest-600" />{formatPoint(trip.startLocation)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-slate-400">Destination</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800"><span className="h-2 w-2 rounded-full bg-orange-500" />{formatPoint(trip.destination)}</p>
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between">
          <div><h3 className="text-base font-extrabold text-slate-900">Everything for this trip</h3><p className="mt-1 text-xs text-slate-500">Your ride tools, members, and trip updates.</p></div>
          <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.1em] ${statusColor}`}>{trip.status}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {routeLinks.map(({ path, label, detail, icon: Icon, color }) => (
            <Link key={path} to={`/trips/${tripId}/${path}`} className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/5">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${color}`}><Icon size={19} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">{label}</span><span className="mt-1 block text-[11px] text-slate-500">{detail}</span></span>
              <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-forest-700" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-9 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div><h3 className="font-extrabold text-slate-900">Your crew</h3><p className="mt-1 text-xs text-slate-500">Riders currently in this trip</p></div>
          <Link to={`/trips/${tripId}/members`} className="text-xs font-bold text-forest-700 hover:text-forest-900">Manage riders <ArrowRight size={13} className="ml-1 inline" /></Link>
        </div>
        {members.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.slice(0, 6).map((member) => (
              <div key={member._id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-forest-100 text-sm font-extrabold text-forest-800">
                  {member.userId?.avatarUrl ? <img src={member.userId.avatarUrl} alt="" className="h-full w-full object-cover" /> : member.userId?.name?.[0]?.toUpperCase() || '?'}
                </span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-900">{member.userId?.name || 'Rider'}</span><span className="mt-0.5 block text-[10px] capitalize text-slate-500">{member.role}</span></span>
                {member.role === 'leader' && <span className="rounded-full bg-forest-100 px-2 py-1 text-[9px] font-bold text-forest-800">LEADER</span>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">No riders have joined yet.</p>}
      </section>
    </div>
  );
}
