import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authStore } from '../../store/authStore';
import { disconnectSocket } from '../../lib/socket';

export default function Layout({ children }) {
  const { user, isAuthenticated, logout, getMe } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user) {
      getMe().catch(() => {});
    }
  }, [isAuthenticated, user, getMe]);

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/trips/create', label: 'Create Trip' },
    { to: '/trips/join', label: 'Join Trip' },
    { to: '/profile', label: 'Profile' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top navbar */}
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-forest-600 flex items-center justify-center text-xs font-bold text-white">
                RT
              </div>
              <span className="font-bold text-forest-800 tracking-tight">RideTogether</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition ${
                  location.pathname === l.to
                    ? 'text-forest-600'
                    : 'text-slate-600 hover:text-forest-600'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-600 hover:text-red-600 underline"
                >
                  Log out
                </button>
                <span className="text-xs font-medium text-slate-400">
                  {user?.name || 'You'}
                </span>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile sidebar */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/95 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <div className="absolute top-5 right-5 p-2" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <nav className="p-6 space-y-4">
            {navLinks.map((l) => (
              <button
                key={l.to}
                onClick={() => { navigate(l.to); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 text-lg font-medium rounded-lg transition ${
                  location.pathname === l.to
                    ? 'bg-forest-600/10 text-forest-600'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-lg font-medium rounded-lg text-red-400 hover:bg-red-500/10"
            >
              Log out
            </button>
          </nav>
        </div>
      )}

      <main className="px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
