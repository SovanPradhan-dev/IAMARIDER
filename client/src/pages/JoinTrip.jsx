import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

const schema = z.object({
  tripCode: z.string().min(1, 'Trip code is required'),
});

export default function JoinTrip() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { tripCode: '' } });

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const { data: res } = await api.post('/trips/join', {
        tripCode: data.tripCode.trim().toUpperCase(),
      });
      toast.success('Joined trip');
      navigate(`/trips/${res.trip._id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to join trip';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="card mx-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Join a trip</h2>
        <p className="text-sm text-slate-600 mb-6">
          Enter the unique Trip ID shared by the trip leader (e.g. RT-7K9P2Q).
        </p>
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trip ID</label>
            <div className="relative">
              <input
                {...register('tripCode')}
                type="text"
                className={`input pl-10 ${errors.tripCode ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="RT-7K9P2Q"
              />
              <span className="absolute left-3 top-2.5 text-slate-400">RT-</span>
            </div>
            {errors.tripCode && <p className="mt-1 text-sm text-red-600">{errors.tripCode.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Joining...' : 'Join Trip'}
          </button>
        </form>
      </div>
    </div>
  );
}
