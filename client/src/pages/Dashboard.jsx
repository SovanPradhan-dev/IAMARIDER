import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, CalendarDays, CheckCircle2, Compass, MapPin, Plus, Radio, Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/common/Toast.jsx';

const dateLabel = (value) => {
  if (!value) return 'Date to be decided';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Date to be decided' : date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  scheduled: 'bg-sky-50 text-sky-800 ring-sky-200',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function TripCard({ trip }) {
  const start = trip.startLocation?.coordinates;
  const destination = trip.destination?.coordinates;
  const isLive = trip.status === 'active';
  return (
    <Link to={`/trips/${trip._id}`} className="group relative overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5">
      {isLive && <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-forest-700 to-emerald-400" />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isLive ? 'animate-pulse bg-emerald-500' : trip.status === 'scheduled' ? 'bg-sky-500' : 'bg-slate-400'}`} />
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.12em] ring-1 ring-inset ${statusStyles[trip.status] || statusStyles.completed}`}>
              {trip.status}
            </span>
          </div>
          <h3 className="truncate text-base font-extrabold tracking-tight text-slate-900 group-hover:text-forest-800">{trip.name}</h3>
          <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{trip.description || 'A new journey with your crew.'}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-500 transition group-hover:bg-forest-50 group-hover:text-forest-700">
          <Compass size={18} />
        </span>
      </div>
      <div className="my-4 space-y-3 border-y border-slate-100 py-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <CalendarDays size={14} className="shrink-0 text-slate-400" /> {dateLabel(trip.plannedDepartureAt)}
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <MapPin size={14} className="shrink-0 text-forest-700" />
          {start && destination
            ? `${start[1].toFixed(2)}, ${start[0].toFixed(2)} → ${destination[1].toFixed(2)}, ${destination[0].toFixed(2)}`
            : `Trip code ${trip.tripCode}`}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400">{trip.tripCode}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-forest-700 transition group-hover:gap-2">
          Open trip <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

function TripSection({ title, note, trips, icon: Icon }) {
  if (!trips.length) return null;
  return (
    <section className="mt-9">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Icon size={17} className="text-forest-700" />{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">{trips.length}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{trips.map((trip) => <TripCard key={trip._id} trip={trip} />)}</div>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/users/me/trips')
      .then(({ data }) => {
        if (active) setTrips(data.trips || []);
      })
      .catch((err) => {
        if (!active) return;
        const message = err.response?.data?.error || 'Could not load your trips.';
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const groups = useMemo(() => ({
    active: trips.filter((trip) => trip.status === 'active'),
    upcoming: trips.filter((trip) => trip.status === 'scheduled'),
    completed: trips.filter((trip) => ['completed', 'cancelled'].includes(trip.status)),
  }), [trips]);

  return (
    <div className="mx-auto max-w-[1320px]">
      <section className="relative overflow-hidden rounded-[28px] bg-forest-950 px-6 py-7 text-white shadow-xl shadow-forest-950/10 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/[.08]" />
        <div className="pointer-events-none absolute -right-3 -top-24 h-64 w-64 rounded-full border border-white/[.08]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-emerald-300"><Compass size={14} /> Your riding dashboard</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Good to see you, {user?.name?.split(' ')[0] || 'rider'}.</h2>
            <p className="mt-2 text-sm text-emerald-100/70">Your next adventure is only a plan away.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link to="/trips/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-extrabold text-forest-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50">
              <Plus size={16} /> Plan a trip
            </Link>
            <Link to="/trips/join" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[.08] px-4 py-3 text-xs font-bold text-white transition hover:bg-white/[.14]">
              Join with a code <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'All your trips', value: trips.length, icon: Compass, accent: 'bg-slate-100 text-slate-700' },
          { label: 'On the road now', value: groups.active.length, icon: Radio, accent: 'bg-emerald-50 text-emerald-700' },
          { label: 'Ready to ride', value: groups.upcoming.length, icon: CalendarDays, accent: 'bg-sky-50 text-sky-700' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${accent}`}><Icon size={19} /></span>
            <span>
              <span className="block text-2xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : value}</span>
              <span className="text-[11px] font-semibold text-slate-500">{label}</span>
            </span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading trips">
          {[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-[22px] bg-white ring-1 ring-slate-200/80" />)}
        </div>
      ) : error && trips.length === 0 ? (
        <div role="alert" className="mt-9 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
      ) : trips.length === 0 ? (
        <div className="mt-9 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white px-6 py-12 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-forest-50 text-forest-700"><Compass size={27} /></span>
          <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">Your next story starts here.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Plan a route and invite your crew, or jump into a trip with a code from its leader.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/trips/create" className="btn-primary"><Plus size={16} /> Plan a trip</Link>
            <Link to="/trips/join" className="btn-outline"><Users size={16} /> Join a trip</Link>
          </div>
        </div>
      ) : (
        <>
          <TripSection title="Happening now" note="Your active trips and live rides" trips={groups.active} icon={Radio} />
          <TripSection title="Coming up" note="Trips on your calendar" trips={groups.upcoming} icon={CalendarDays} />
          <TripSection title="Past journeys" note="Trips you have completed or wrapped up" trips={groups.completed} icon={CheckCircle2} />
        </>
      )}
    </div>
  );
}
