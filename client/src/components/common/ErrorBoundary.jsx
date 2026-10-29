import { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Page rendering failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700"><AlertTriangle size={23} /></span>
            <h2 className="mt-4 text-xl font-extrabold text-slate-900">This page hit a bump in the road.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">The rest of RideTogether is still here. Try the page again or head back to your trips.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => this.setState({ hasError: false })} className="btn-outline"><RotateCw size={15} /> Try again</button>
              <Link to="/dashboard" className="btn-primary">Back to overview</Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
