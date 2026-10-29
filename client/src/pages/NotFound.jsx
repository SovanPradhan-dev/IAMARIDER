import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card text-center p-10">
        <h1 className="text-6xl font-bold text-forest-600">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Page not found</h2>
        <p className="mt-4 text-slate-600">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="mt-6 inline-block btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
