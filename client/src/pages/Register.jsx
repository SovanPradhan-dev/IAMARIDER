import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, MapPinned } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/common/Toast.jsx';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function Register() {
  const navigate = useNavigate();
  const { register: registerAccount, loading } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ name, email, password }) => {
    setError('');
    try {
      await registerAccount(name, email, password);
      toast.success('Account created. Please sign in.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-76px)] items-center px-5 pb-12 pt-28 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_35px_90px_-40px_rgba(15,57,40,.28)] lg:grid-cols-[.9fr_1.1fr]">
        <aside className="relative hidden min-h-[600px] flex-col justify-between overflow-hidden bg-forest-950 p-10 text-white lg:flex">
          <div className="absolute -right-28 -top-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 top-2 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-200"><MapPinned size={23} /></span>
            <p className="mt-12 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300">Adventure feels better shared</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">Make every mile a group memory.</h1>
            <p className="mt-4 text-sm leading-6 text-emerald-100/70">Plan a route, invite the people you ride with, and find your crew along the way.</p>
          </div>
          <p className="relative text-xs text-emerald-100/50">Your account is the start of your next journey.</p>
        </aside>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-7">
            <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-forest-700">Join the crew</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Create your account.</h2>
            <p className="mt-2 text-sm text-slate-500">It only takes a minute to get ride-ready.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <label htmlFor="register-name" className="block text-xs font-bold text-slate-700">
              Your name
              <input id="register-name" {...register('name')} autoComplete="name" className={`input mt-1.5 !rounded-xl !py-3 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="Alex Rider" />
              {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name.message}</span>}
            </label>
            <label htmlFor="register-email" className="block text-xs font-bold text-slate-700">
              Email address
              <input id="register-email" {...register('email')} type="email" autoComplete="email" className={`input mt-1.5 !rounded-xl !py-3 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="you@example.com" />
              {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
            </label>
            <label htmlFor="register-password" className="block text-xs font-bold text-slate-700">
              Password
              <span className="relative mt-1.5 block">
                <input id="register-password" {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`input !rounded-xl !py-3 !pr-12 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
              {errors.password && <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>}
            </label>
            <label htmlFor="register-confirm-password" className="block text-xs font-bold text-slate-700">
              Confirm password
              <input id="register-confirm-password" {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`input mt-1.5 !rounded-xl !py-3 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`} placeholder="Enter your password again" />
              {errors.confirmPassword && <span className="mt-1 block text-xs text-red-600">{errors.confirmPassword.message}</span>}
            </label>

            <button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-forest-900/15 transition hover:-translate-y-0.5 hover:bg-forest-800 disabled:opacity-60">
              {loading ? 'Creating your account…' : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            Already riding with us?{' '}
            <Link to="/login" className="font-extrabold text-forest-700 hover:text-forest-900">Sign in <ArrowRight size={13} className="ml-1 inline" /></Link>
          </p>
        </div>
      </div>
    </div>
  );
}
