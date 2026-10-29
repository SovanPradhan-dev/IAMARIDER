import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, CircleDot, Compass, LockKeyhole, MapPin, Users } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';
import TripLocationPicker from '../components/map/TripLocationPicker.jsx';

const schema = z.object({
  name: z.string().trim().min(2, 'Trip name must be at least 2 characters').max(120),
  description: z.string().max(1000).optional(),
  startLatitude: z.number({ invalid_type_error: 'Pick a starting point on the map' }).min(-90).max(90),
  startLongitude: z.number({ invalid_type_error: 'Pick a starting point on the map' }).min(-180).max(180),
  destLatitude: z.number({ invalid_type_error: 'Pick a destination on the map' }).min(-90).max(90),
  destLongitude: z.number({ invalid_type_error: 'Pick a destination on the map' }).min(-180).max(180),
  plannedDepartureAt: z.string().min(1, 'Departure date is required'),
  maxMembers: z.coerce.number().int().min(2).max(100).default(10),
  privacy: z.enum(['public', 'private']).default('private'),
});

const initialValues = {
  name: '',
  description: '',
  startLatitude: '',
  startLongitude: '',
  destLatitude: '',
  destLongitude: '',
  plannedDepartureAt: '',
  maxMembers: 10,
  privacy: 'private',
};

const LocationFields = ({ label, latitude, longitude, register, errors, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-center gap-2">
      <span className={`grid h-8 w-8 place-items-center rounded-xl ${color}`}>
        <MapPin size={16} />
      </span>
      <span className="text-sm font-bold text-slate-900">{label}</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-[11px] font-semibold text-slate-500">
        Latitude
        <input {...register(latitude, { valueAsNumber: true })} type="number" step="any" className="input mt-1 !py-2 text-sm" placeholder="Click map" />
      </label>
      <label className="text-[11px] font-semibold text-slate-500">
        Longitude
        <input {...register(longitude, { valueAsNumber: true })} type="number" step="any" className="input mt-1 !py-2 text-sm" placeholder="Click map" />
      </label>
    </div>
    {(errors[latitude] || errors[longitude]) && (
      <p className="mt-2 text-xs font-medium text-red-600">
        {errors[latitude]?.message || errors[longitude]?.message}
      </p>
    )}
  </div>
);

export default function CreateTrip() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState('start');
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: initialValues });

  const start = { latitude: watch('startLatitude'), longitude: watch('startLongitude') };
  const destination = { latitude: watch('destLatitude'), longitude: watch('destLongitude') };
  const setMapPoint = (latitude, longitude) => {
    const prefix = target === 'start' ? 'start' : 'dest';
    setValue(`${prefix}Latitude`, Number(latitude.toFixed(6)), { shouldValidate: true, shouldDirty: true });
    setValue(`${prefix}Longitude`, Number(longitude.toFixed(6)), { shouldValidate: true, shouldDirty: true });
    if (target === 'start') setTarget('destination');
  };

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const { data: response } = await api.post('/trips', {
        name: data.name,
        description: data.description,
        startLatitude: data.startLatitude,
        startLongitude: data.startLongitude,
        destLatitude: data.destLatitude,
        destLongitude: data.destLongitude,
        plannedDepartureAt: new Date(data.plannedDepartureAt).toISOString(),
        maxMembers: data.maxMembers,
        privacy: data.privacy,
      });
      toast.success('Your trip is ready to go');
      navigate(`/trips/${response.trip._id}`);
    } catch (err) {
      const message = err.response?.data?.error || 'We could not create your trip. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-forest-700">
        <ArrowLeft size={15} /> Back to your trips
      </Link>
      <section className="relative mb-7 overflow-hidden rounded-[28px] bg-forest-950 px-6 py-7 text-white shadow-xl shadow-forest-950/10 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-14 -top-32 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-20 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-200">
            <Compass size={13} /> Plan your next ride
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Make it a journey.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/75">
            Set the route, invite your crew, and keep everyone connected from the first mile to the last.
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest-50 text-forest-700"><Compass size={19} /></span>
              <div>
                <h3 className="font-bold text-slate-900">The essentials</h3>
                <p className="mt-1 text-xs text-slate-500">Give your ride a name and a little context.</p>
              </div>
            </div>
            <div className="space-y-5">
              <label className="block text-xs font-bold text-slate-600">
                Trip name
                <input {...register('name')} className="input mt-2 !rounded-xl !py-3" placeholder="A coast-to-coast weekend" />
                {errors.name && <span className="mt-1.5 block text-xs text-red-600">{errors.name.message}</span>}
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Description <span className="font-normal text-slate-400">· optional</span>
                <textarea {...register('description')} className="input mt-2 !rounded-xl" rows={3} placeholder="What should your crew know before setting off?" />
                {errors.description && <span className="mt-1.5 block text-xs text-red-600">{errors.description.message}</span>}
              </label>
              <label className="block text-xs font-bold text-slate-600">
                <span className="mb-2 flex items-center gap-2"><CalendarDays size={15} className="text-forest-700" /> Planned departure</span>
                <input {...register('plannedDepartureAt')} type="datetime-local" className="input !rounded-xl" />
                {errors.plannedDepartureAt && <span className="mt-1.5 block text-xs text-red-600">{errors.plannedDepartureAt.message}</span>}
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><Users size={19} /></span>
              <div>
                <h3 className="font-bold text-slate-900">Your crew</h3>
                <p className="mt-1 text-xs text-slate-500">Choose the group size and who can join.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold text-slate-600">
                Maximum riders
                <span className="relative mt-2 block">
                  <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input {...register('maxMembers')} type="number" min="2" max="100" className="input !rounded-xl !pl-9" />
                </span>
                {errors.maxMembers && <span className="mt-1.5 block text-xs text-red-600">{errors.maxMembers.message}</span>}
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Who can join?
                <span className="relative mt-2 block">
                  <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select {...register('privacy')} className="input !rounded-xl !pl-9">
                    <option value="private">Invite code only</option>
                    <option value="public">Anyone with the code</option>
                  </select>
                </span>
              </label>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-50 text-sky-700"><MapPin size={19} /></span>
            <div>
              <h3 className="font-bold text-slate-900">Plot your route</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Choose a point, then click the map to place it. Drag around to find your route.</p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setTarget('start')} className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-bold transition ${target === 'start' ? 'bg-white text-forest-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              <CircleDot size={14} /> Start
            </button>
            <button type="button" onClick={() => setTarget('destination')} className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-xs font-bold transition ${target === 'destination' ? 'bg-white text-forest-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              <MapPin size={14} /> Destination
            </button>
          </div>
          <TripLocationPicker start={start} destination={destination} target={target} onPick={setMapPoint} />
          <div className="mt-4 space-y-3">
            <LocationFields label="Starting point" latitude="startLatitude" longitude="startLongitude" register={register} errors={errors} color="bg-forest-50 text-forest-700" />
            <LocationFields label="Destination" latitude="destLatitude" longitude="destLongitude" register={register} errors={errors} color="bg-orange-50 text-orange-600" />
          </div>
          <p className="mt-4 text-[11px] leading-5 text-slate-400">Coordinates are used to place the trip’s start and destination pins. Turn-by-turn directions are not generated.</p>
        </section>

        <div className="lg:col-span-2">
          {error && <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-xs leading-5 text-slate-500">Your trip code will be created after saving. Only share it with people you want in your group.</p>
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-forest-900/15 transition hover:-translate-y-0.5 hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Creating your trip…' : <>Create trip <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
