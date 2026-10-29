import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowLeft, ChevronRight, Compass, LayoutDashboard, LogOut,
  MapPinned, Menu, MessageCircle, Plus, ShieldAlert, Sparkles, UserRound, Users, X,
} from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from './NotificationBell.jsx';

const primaryLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/trips/create', label: 'Plan a trip', icon: Plus },
  { to: '/trips/join', label: 'Join with a code', icon: Compass },
];

const tripLinks = [
  { suffix: '', label: 'Trip overview', icon: MapPinned, end: true },
  { suffix: '/live', label: 'Live map', icon: Activity },
  { suffix: '/members', label: 'Riders', icon: Users },
  { suffix: '/chat', label: 'Trip chat', icon: MessageCircle },
  { suffix: '/checkpoints', label: 'Checkpoints', icon: MapPinned },
  { suffix: '/emergencies', label: 'Safety alerts', icon: ShieldAlert },
  { suffix: '/history', label: 'Trip history', icon: Compass },
];

const routeNames = [
  [/^\/dashboard$/, 'Overview'],
  [/^\/trips\/create$/, 'Plan a trip'],
  [/^\/trips\/join$/, 'Join a trip'],
  [/\/live$/, 'Live map'],
  [/\/members$/, 'Riders'],
  [/\/chat$/, 'Trip chat'],
  [/\/checkpoints$/, 'Checkpoints'],
  [/\/emergencies$/, 'Safety alerts'],
  [/\/history$/, 'Trip history'],
  [/^\/trips\/[^/]+$/, 'Trip overview'],
  [/^\/profile$/, 'Profile settings'],
];

function Brand({ dark = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-3" aria-label="RideTogether home">
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${dark ? 'bg-white/10 text-white ring-1 ring-white/15' : 'bg-forest-700 text-white'} shadow-lg shadow-forest-950/10`}>
        <Compass size={21} strokeWidth={2.2} />
      </span>
      <span className="text-[17px] font-extrabold tracking-tight text-slate-950">
        Ride<span className="text-forest-700">Together</span>
      </span>
    </Link>
  );
}

function Avatar({ user, size = 'h-10 w-10' }) {
  return user?.avatarUrl ? (
    <img src={user.avatarUrl} alt="" className={`${size} rounded-2xl object-cover ring-1 ring-slate-200`} />
  ) : (
    <span className={`${size} grid place-items-center rounded-2xl bg-forest-100 text-sm font-bold text-forest-800 ring-1 ring-forest-200`}>
      {user?.name?.trim()?.[0]?.toUpperCase() || <UserRound size={17} />}
    </span>
  );
}

export default function Layout({ children }) {
  const { user, accessToken, isAuthenticated, logout, getMe } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isPublic = pathname === '/' || pathname === '/login' || pathname === '/register';
  const tripMatch = pathname.match(/^\/trips\/([^/]+)/);
  const tripRoot = tripMatch && !['create', 'join'].includes(tripMatch[1])
    ? `/trips/${tripMatch[1]}`
    : null;
  const title = routeNames.find(([pattern]) => pattern.test(pathname))?.[1] || 'RideTogether';

  const breadcrumb = useMemo(() => {
    if (pathname === '/dashboard') return ['Workspace', 'Overview'];
    if (pathname.startsWith('/trips/')) return ['Your rides', title];
    if (pathname === '/profile') return ['Account', 'Profile settings'];
    return ['RideTogether', title];
  }, [pathname, title]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isAuthenticated && !user) getMe().catch(() => {});
  }, [isAuthenticated, user, getMe]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderLinks = (links, onNavigate) => links.map(({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold transition ${
        isActive
          ? 'bg-forest-700 text-white shadow-md shadow-forest-900/15'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={17} strokeWidth={1.9} />
      <span>{label}</span>
      <ChevronRight className="ml-auto opacity-0 transition group-hover:opacity-50" size={14} />
    </NavLink>
  ));

  if (isPublic) {
    return (
      <div className="min-h-screen bg-[#f7f9f7] text-slate-900">
        <header className="absolute inset-x-0 top-0 z-30">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
            <Brand />
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white/70">
                Sign in
              </Link>
              <Link to="/register" className="rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-forest-900/15 transition hover:bg-forest-800">
                Get started
              </Link>
            </div>
          </div>
        </header>
        <main>{children}</main>
        {pathname === '/' && (
          <footer className="border-t border-slate-200/80 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <span>© {new Date().getFullYear()} RideTogether. Ride together, arrive together.</span>
              <span className="inline-flex items-center gap-2"><ShieldAlert size={14} /> Your location is shared only when you choose.</span>
            </div>
          </footer>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-slate-900 lg:flex">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-slate-200/80 bg-white px-5 py-6 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-1">
          <Brand />
          <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
            <X size={19} />
          </button>
        </div>

        <div className="mt-10">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
          <nav className="space-y-1.5" aria-label="Main navigation">
            {renderLinks(primaryLinks, () => setMenuOpen(false))}
          </nav>
        </div>

        {tripRoot && (
          <div className="mt-9">
            <div className="mb-3 flex items-center justify-between px-3">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Current trip</p>
              <Link to={tripRoot} title="Trip overview" className="text-slate-400 hover:text-forest-700"><ArrowLeft size={14} /></Link>
            </div>
            <nav className="space-y-1.5" aria-label="Trip navigation">
              {renderLinks(tripLinks.map(({ suffix, ...link }) => ({ ...link, to: `${tripRoot}${suffix}` })), () => setMenuOpen(false))}
            </nav>
          </div>
        )}

        <div className="mt-auto">
          <div className="mb-4 rounded-2xl bg-forest-950 p-4 text-white">
            <div className="mb-3 flex items-center gap-2 text-emerald-300">
              <Sparkles size={15} />
              <span className="text-[10px] font-bold uppercase tracking-[.16em]">Ride well</span>
            </div>
            <p className="text-sm font-semibold leading-5">The best trips are better together.</p>
            <p className="mt-1.5 text-[11px] leading-4 text-emerald-100/70">Share your route, keep your crew in sync.</p>
          </div>
          <div className={`flex items-center gap-3 rounded-2xl border p-3 transition ${pathname === '/profile' ? 'border-forest-200 bg-forest-50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <Link to="/profile" className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar user={user} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900">{user?.name || 'Your account'}</span>
                <span className="block truncate text-[11px] text-slate-500">{user?.email || 'Profile & settings'}</span>
              </span>
            </Link>
            <button type="button" aria-label="Log out" title="Log out" onClick={handleLogout} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[76px] items-center justify-between px-4 sm:px-7 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label="Open navigation" onClick={() => setMenuOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm hover:bg-slate-50 lg:hidden">
                <Menu size={19} />
              </button>
              <div className="min-w-0">
                <div className="mb-1 hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400 sm:flex">
                  <span>{breadcrumb[0]}</span><ChevronRight size={12} /><span className="text-forest-700">{breadcrumb[1]}</span>
                </div>
                <h1 className="truncate text-lg font-bold tracking-tight text-slate-900">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell isAuthenticated={isAuthenticated} accessToken={accessToken} />
              <Link to="/trips/create" className="hidden items-center gap-2 rounded-xl bg-forest-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-forest-900/10 transition hover:-translate-y-0.5 hover:bg-forest-800 sm:inline-flex">
                <Plus size={15} /> Plan a trip
              </Link>
              <Link to="/profile" className="rounded-2xl ring-offset-2 transition hover:ring-2 hover:ring-forest-400" aria-label="Open profile">
                <Avatar user={user} size="h-10 w-10" />
              </Link>
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-76px)] w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
