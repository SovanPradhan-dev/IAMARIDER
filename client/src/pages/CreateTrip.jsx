import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

const schema = z.object({
  name: z.string().min(2, 'Trip name must be at least 2 characters').max(120),
  description: z.string().max(1000).optional(),
  startLatitude: z.number().min(-90).max(90),
  startLongitude: z.number().min(-180).max(180),
  destLatitude: z.number().min(-90).max(90),
  destLongitude: z.number().min(-180).max(180),
  plannedDepartureAt: z.string().min(1, 'Departure date is required'),
  maxMembers: z.coerce.number().int().min(2).max(100).default(10),
  privacy: z.enum(['public', 'private']).default('private'),
});

const DEFAULT_START = { lat: 22.5726, lon: 88.3639 };
const DEFAULT_DEST = { lat: 22.2503, lon: 87.5115 };

export default function CreateTrip() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapClick, setMapClick] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { ...DEFAULT_START, ...DEFAULT_DEST, maxMembers: 10, privacy: 'private' } });

  const startLat = watch('startLatitude');
  const startLon = watch('startLongitude');
  const destLat = watch('destLatitude');
  const destLon = watch('destLongitude');

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const { data: res } = await api.post('/trips', {
        name: data.name,
        description: data.description,
        startLatitude: data.startLatitude,
        startLongitude: data.startLongitude,
        destLatitude: data.destLatitude,
        destLongitude: data.destLongitude,
        plannedDepartureAt: data.plannedDepartureAt,
        maxMembers: data.maxMembers,
        privacy: data.privacy,
      });
      toast.success('Trip created');
      navigate(`/trips/${res.trip._id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create trip';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="card">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Create a new trip</h2>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Trip name</label>
            <input
              {...register('name')}
              className="input"
              placeholder="Kolkata to Digha Motorcycle Ride"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
            <textarea
              {...register('description')}
              className="input"
              rows={3}
              placeholder="Weekend coastal ride..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Starting latitude</label>
            <input {...register('startLatitude')} type="number" step="any" className="input" />
            {errors.startLatitude && <p className="mt-1 text-sm text-red-600">{errors.startLatitude.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Starting longitude</label>
            <input {...register('startLongitude')} type="number" step="any" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination latitude</label>
            <input {...register('destLatitude')} type="number" step="any" className="input" />
            {errors.destLatitude && <p className="mt-1 text-sm text-red-600">{errors.destLatitude.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination longitude</label>
            <input {...register('destLongitude')} type="number" step="any" className="input" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Planned departure</label>
            <input
              {...register('plannedDepartureAt')}
              type="datetime-local"
              className="input"
            />
            {errors.plannedDepartureAt && (
              <p className="mt-1 text-sm text-red-600">{errors.plannedDepartureAt.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Max members</label>
            <input {...register('maxMembers')} type="number" min="2" max="100" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Privacy</label>
            <select {...register('privacy')} className="input">
              <option value="private">Private (invite by Trip ID)</option>
              <option value="public">Public (anyone can view)</option>
            </select>
          </div>
          <div className="col-span-2 pt-4">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating trip...' : 'Create Trip'}
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('startLatitude', DEFAULT_START.lat);
                setValue('startLongitude', DEFAULT_START.lon);
                setValue('destLatitude', DEFAULT_DEST.lat);
                setValue('destLongitude', DEFAULT_DEST.lon);
                setMapClick(null);
              }}
              className="btn-outline"
            >
              Reset to default (Kolkata → Digha)
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 card p-4">
        <h3 className="font-semibold text-slate-900 mb-2">Preview coordinates</h3>
        <p className="text-sm text-slate-600">
          Start: {startLat?.toFixed(4)}, {startLon?.toFixed(4)} &nbsp;|&nbsp;
          Destination: {destLat?.toFixed(4)}, {destLon?.toFixed(4)}
        </p>
        {mapClick && (
          <p className="mt-1 text-xs text-slate-500">Map click would set: {mapClick.lat.toFixed(4)}, {mapClick.lon.toFixed(4)}</p>
        )}
      </div>
    </div>
  );
}
