import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, MapPinned } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/common/Toast.jsx';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-76px)] items-center px-5 pb-12 pt-28 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_35px_90px_-40px_rgba(15,57,40,.28)] lg:grid-cols-[.9fr_1.1fr]">
        <aside className="relative hidden min-h-[540px] flex-col justify-between overflow-hidden bg-forest-950 p-10 text-white lg:flex">
          <div className="absolute -right-28 -top-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 top-2 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-200"><MapPinned size={23} /></span>
            <p className="mt-12 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300">Pick up where you left off</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">Your crew is just a sign-in away.</h1>
            <p className="mt-4 text-sm leading-6 text-emerald-100/70">See the trips you planned, reconnect with your riders, and keep the journey moving.</p>
          </div>
          <p className="relative text-xs text-emerald-100/50">Your location stays yours until you choose to share it.</p>
        </aside>

        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8">
            <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-forest-700">Welcome back</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">Welcome back.</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in to pick up your journey.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold text-slate-700">Email address</label>
              <input
                id="login-email"
                {...register('email')}
                type="email"
                autoComplete="email"
                className={`input !rounded-xl !py-3 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold text-slate-700">Password</label>
              <span className="relative block">
                <input
                  id="login-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input !rounded-xl !py-3 !pr-12 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-forest-900/15 transition hover:-translate-y-0.5 hover:bg-forest-800 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-7 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-extrabold text-forest-700 hover:text-forest-900">
              Create an account <ArrowRight size={13} className="ml-1 inline" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
