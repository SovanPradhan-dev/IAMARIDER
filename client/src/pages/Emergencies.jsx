import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, MapPin, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

const typeStyles = {
  sos: 'bg-rose-100 text-rose-800',
  medical: 'bg-orange-100 text-orange-800',
  breakdown: 'bg-amber-100 text-amber-800',
  other: 'bg-slate-100 text-slate-700',
};

export default function Emergencies() {
  const { tripId } = useParams();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.get(`/trips/${tripId}`), api.get(`/trips/${tripId}/emergencies`)])
      .then(([tripResponse, emergencyResponse]) => {
        if (!active) return;
        setIsLeader(tripResponse.data.membership?.role === 'leader');
        setEmergencies(emergencyResponse.data.emergencies || []);
      })
      .catch((err) => {
        if (active) toast.error(err.response?.data?.error || 'Failed to load trip safety alerts');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tripId]);

  const resolveEmergency = async (id, status) => {
    const notes = window.prompt('Resolution notes (optional):');
    if (notes === null) return;
    try {
      const { data } = await api.patch(`/trips/${tripId}/emergencies/${id}`, { status, resolutionNotes: notes });
      setEmergencies((current) => current.map((event) => event._id === id ? data.emergency || {
        ...event,
        status,
        resolvedAt: new Date().toISOString(),
        resolutionNotes: notes,
      } : event));
      toast.success(`Alert marked ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update this alert');
    }
  };

  if (loading) return <div className="mx-auto max-w-5xl animate-pulse space-y-4"><div className="h-36 rounded-3xl bg-white ring-1 ring-slate-200" />{[1, 2].map((item) => <div key={item} className="h-32 rounded-2xl bg-white ring-1 ring-slate-200" />)}</div>;

  const activeCount = emergencies.filter((event) => event.status === 'active').length;
  return (
    <div className="mx-auto max-w-5xl">
      <section className="mb-5 overflow-hidden rounded-[26px] bg-rose-950 p-6 text-white shadow-xl shadow-rose-950/10 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-rose-200"><ShieldAlert size={14} /> Trip safety</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Here when your crew needs a hand.</h2>
            <p className="mt-2 text-sm leading-6 text-rose-100/70">Review SOS, medical, and breakdown alerts shared by riders in this trip.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-xs font-bold"><AlertTriangle size={15} />{activeCount} active {activeCount === 1 ? 'alert' : 'alerts'}</span>
        </div>
      </section>

      <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        RideTogether alerts are only delivered in the app to trip members. They do not contact emergency services.
      </div>

      {emergencies.length ? (
        <div className="space-y-3">
          {emergencies.map((event) => {
            const activeEvent = event.status === 'active';
            const coordinates = event.location?.coordinates;
            return (
              <article key={event._id} className={`rounded-2xl border bg-white p-5 shadow-sm ${activeEvent ? 'border-rose-200' : 'border-slate-200/80'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${activeEvent ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {activeEvent ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.13em] ${typeStyles[event.eventType] || typeStyles.other}`}>{event.eventType}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.13em] ${activeEvent ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{event.status}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-extrabold text-slate-900">{event.message || `${event.eventType} alert reported`}</h3>
                    <p className="mt-1 text-xs text-slate-500">Reported by {event.reportedBy?.name || 'A trip member'}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={12} />{new Date(event.createdAt).toLocaleString()}</span>
                      {coordinates?.length === 2 && <a className="inline-flex items-center gap-1.5 font-semibold text-forest-700 hover:text-forest-900" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${coordinates[1]}&mlon=${coordinates[0]}#map=15/${coordinates[1]}/${coordinates[0]}`}><MapPin size={12} />Open alert location <ArrowRight size={11} /></a>}
                    </div>
                    {event.resolutionNotes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{event.resolutionNotes}</p>}
                  </div>
                  {activeEvent && isLeader && (
                    <div className="flex gap-2 sm:flex-col">
                      <button onClick={() => resolveEmergency(event._id, 'resolved')} className="rounded-lg bg-forest-700 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-forest-800">Mark resolved</button>
                      <button onClick={() => resolveEmergency(event._id, 'cancelled')} className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">Close alert</button>
                    </div>
                  )}
                  {activeEvent && !isLeader && <span className="self-start rounded-lg bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-500">Trip leader can resolve</span>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldAlert size={23} /></span>
          <h3 className="mt-4 font-extrabold text-slate-900">All clear for this trip.</h3>
          <p className="mt-2 text-sm text-slate-500">There are no safety alerts to show right now.</p>
          <Link to={`/trips/${tripId}/live`} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-forest-700 hover:text-forest-900">Back to live map <ArrowRight size={14} /></Link>
        </div>
      )}
    </div>
  );
}
