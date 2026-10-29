import { useEffect, useState } from 'react';

const freshnessLabel = (f) => {
  switch (f) {
    case 'online': return 'Live';
    case 'stale': return 'Stale';
    case 'offline': return 'Offline';
    default: return 'Unknown';
  }
};

const freshnessColor = (f) => {
  switch (f) {
    case 'online': return 'text-green-700 bg-green-100';
    case 'stale': return 'text-amber-700 bg-amber-100';
    case 'offline': return 'text-slate-500 bg-slate-100';
    default: return 'text-slate-500 bg-slate-100';
  }
};

export default function RiderList({ riders, currentUserId }) {
  const [, setRefresh] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setRefresh((r) => r + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const withFreshness = riders.map((rider) => {
    if (!rider.updatedAt) return { ...rider, freshness: 'offline' };
    return {
      ...rider,
      freshness: Date.now() - new Date(rider.updatedAt).getTime() > 90000 ? 'stale' : 'online',
    };
  });
  const sorted = withFreshness.sort((a, b) => {
    const order = { online: 0, stale: 1, offline: 2 };
    return (order[a.freshness] ?? 99) - (order[b.freshness] ?? 99);
  });

  return (
    <div className="space-y-2">
      {sorted.map((rider) => (
        <div
          key={rider.userId}
          className={`flex items-center gap-3 p-2.5 rounded-lg border ${
            rider.userId === currentUserId
              ? 'bg-forest-50 border-forest-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-2 h-2 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">{rider.name || 'Rider'}</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${freshnessColor(rider.freshness)}`}>
                {freshnessLabel(rider.freshness)}
              </span>
            </div>
            {rider.role === 'leader' && (
              <span className="text-[10px] text-forest-600 font-bold uppercase tracking-wider">Leader</span>
            )}
            {rider.location && (
              <p className="text-xs text-slate-500">
                {rider.location.coordinates?.[1]?.toFixed(5)}, {rider.location.coordinates?.[0]?.toFixed(5)}
              </p>
            )}
            {rider.updatedAt && (
              <p className="text-xs text-slate-400">
                Last update: {new Date(rider.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          {rider.userId === currentUserId && (
            <span className="text-[10px] text-slate-400 font-medium">You</span>
          )}
        </div>
      ))}
      {sorted.length === 0 && (
        <div className="text-xs text-slate-400 italic text-center py-4">No riders yet</div>
      )}
    </div>
  );
}
