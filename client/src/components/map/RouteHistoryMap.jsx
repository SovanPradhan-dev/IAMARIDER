import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import { MAP_ATTRIBUTION, MAP_TILE_URL } from './mapTiles.js';
import { useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';

const colors = ['#187454', '#0284c7', '#d97706', '#7c3aed', '#e11d48', '#0891b2'];

function FitHistory({ groups }) {
  const map = useMap();
  const bounds = useMemo(
    () => Object.values(groups).flatMap((group) => group.positions),
    [groups]
  );
  useEffect(() => {
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32] });
  }, [map, bounds]);
  return null;
}

export default function RouteHistoryMap({ history }) {
  const groups = useMemo(() => history.reduce((result, point) => {
    const coordinates = point.location?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length !== 2) return result;
    const id = point.userId?._id || point.userId?.toString() || 'rider';
    const entry = result[id] || {
      id,
      name: point.userId?.name || 'Rider',
      positions: [],
    };
    entry.positions.push([coordinates[1], coordinates[0]]);
    result[id] = entry;
    return result;
  }, {}), [history]);

  const points = Object.values(groups);
  const center = points[0]?.positions[0] || [22.5, 0];

  if (!points.length) {
    return (
      <div className="grid h-full min-h-[280px] place-items-center rounded-2xl bg-slate-50 px-6 text-center">
        <div><p className="text-sm font-bold text-slate-700">No GPS route recorded</p><p className="mt-1 text-xs leading-5 text-slate-500">The trip history will draw a route here when riders have shared sampled GPS locations.</p></div>
      </div>
    );
  }

  return (
    <MapContainer center={center} zoom={8} scrollWheelZoom className="h-full min-h-[280px] w-full rounded-2xl">
      <TileLayer
        url={MAP_TILE_URL}
        attribution={MAP_ATTRIBUTION}
      />
      <FitHistory groups={groups} />
      {points.flatMap((group, index) => [
        group.positions.length > 1 && <Polyline key={`line-${group.id}`} positions={group.positions} pathOptions={{ color: colors[index % colors.length], weight: 4, opacity: 0.8 }} />,
        group.positions.length > 0 && <CircleMarker key={`start-${group.id}`} center={group.positions[0]} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: colors[index % colors.length], fillOpacity: 1 }} />,
        group.positions.length > 1 && <CircleMarker key={`end-${group.id}`} center={group.positions.at(-1)} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: colors[index % colors.length], fillOpacity: 1 }} />,
      ].filter(Boolean))}
    </MapContainer>
  );
}
