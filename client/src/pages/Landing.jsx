import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-sm font-semibold mb-6">
        RideTogether · Group Trip Coordination
      </div>
      <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
        Coordinate your group ride in real time
      </h1>
      <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
        Create a trip, share a unique Trip ID, and watch your fellow riders on a shared live map.
        Built for motorcycles, bicycles, cars, and any group on the move.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <Link to="/register" className="btn-primary px-8 py-3 text-lg">
          Get started
        </Link>
        <Link to="/login" className="btn-outline px-8 py-3 text-lg">
          Sign in
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-left">
        {[
          {
            title: 'Live GPS tracking',
            desc: 'Share your location with trip members and see everyone on a shared map.',
          },
          {
            title: 'Group chat',
            desc: 'Trip-specific messaging with history and read receipts.',
          },
          {
            title: 'Checkpoints',
            desc: 'Set waypoints and report arrivals as a group.',
          },
          {
            title: 'SOS & breakdown',
            desc: 'Send emergency alerts visible to authorized trip members only.',
          },
          {
            title: 'Trip lifecycle',
            desc: 'Scheduled → active → completed, managed by the trip leader.',
          },
          {
            title: 'Role-based access',
            desc: 'Leader and rider permissions enforced on the server.',
          },
        ].map((f) => (
          <div key={f.title} className="card">
            <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
            <p className="text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500">
        <p>
          RideTogether does not automatically contact emergency services. SOS/breakdown alerts are
          delivered only to authorized members of your trip. GPS sharing is user-controlled and can
          be stopped at any time.
        </p>
      </div>
    </div>
  );
}
