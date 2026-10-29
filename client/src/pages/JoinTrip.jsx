import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, KeyRound, Users } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../components/common/Toast.jsx';

const schema = z.object({
  tripCode: z.string().trim().min(1, 'Enter the trip code').max(20, 'Trip code is too long'),
});

export default function JoinTrip() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { tripCode: '' },
  });

  const onSubmit = async ({ tripCode }) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/trips/join', { tripCode: tripCode.trim().toUpperCase() });
      toast.success('You joined the trip');
      navigate(`/trips/${data.trip._id}`);
    } catch (err) {
      const message = err.response?.data?.error || 'We could not join this trip.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-forest-700"><ArrowLeft size={15} /> Back to your trips</Link>
      <div className="grid overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-xl shadow-forest-950/5 md:grid-cols-[.9fr_1.1fr]">
        <div className="relative flex min-h-72 flex-col justify-between overflow-hidden bg-forest-950 p-7 text-white sm:p-9">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border border-white/10" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-200"><Users size={21} /></span>
            <h2 className="mt-8 text-3xl font-extrabold tracking-tight">The more, the merrier.</h2>
            <p className="mt-3 max-w-xs text-sm leading-6 text-emerald-100/70">Enter the invitation code from your trip leader and get in on the ride.</p>
          </div>
          <span className="relative text-[10px] font-bold uppercase tracking-[.15em] text-emerald-300">Your crew is waiting</span>
        </div>

        <div className="p-6 sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-forest-800"><KeyRound size={13} /> Trip invitation</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950">Join a trip</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Trip codes look like <span className="font-mono font-bold text-slate-700">RT-7K9P2Q</span>. Ask the leader if you need one.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">{error}</div>}
            <label htmlFor="trip-code" className="block text-xs font-bold text-slate-700">Invitation code
              <span className="relative mt-2 block">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="trip-code" {...register('tripCode')} type="text" autoCapitalize="characters" autoComplete="off" className={`input !rounded-xl !py-3 !pl-10 font-mono uppercase tracking-[.12em] ${errors.tripCode ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="RT-7K9P2Q" />
              </span>
              {errors.tripCode && <span className="mt-1.5 block text-xs text-red-600">{errors.tripCode.message}</span>}
            </label>
            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-forest-900/15 transition hover:-translate-y-0.5 hover:bg-forest-800 disabled:opacity-60">
              {loading ? 'Joining your crew…' : <>Join trip <ArrowRight size={16} /></>}
            </button>
          </form>
          <p className="mt-5 text-[11px] leading-5 text-slate-400">Joining a trip makes its shared trip information visible to you. You control whether to share your live location.</p>
        </div>
      </div>
    </div>
  );
}
