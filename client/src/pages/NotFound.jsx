import { Compass, Home, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-forest-950/5 sm:p-12">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-forest-50 text-forest-700"><SearchX size={28} /></span>
        <p className="mt-6 font-mono text-5xl font-extrabold tracking-tight text-forest-700">404</p>
        <h2 className="mt-2 text-xl font-extrabold text-slate-900">This road ends here.</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">The page you’re looking for has moved or doesn’t exist.</p>
        <Link to="/" className="btn-primary mt-6">
          <Home size={15} /> Find your way back <Compass size={15} />
        </Link>
      </div>
    </div>
  );
}
