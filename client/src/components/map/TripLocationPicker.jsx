import { CircleMarker, MapContainer, Polyline, TileLayer, useMapEvents } from 'react-leaflet';
import { MAP_ATTRIBUTION, MAP_TILE_URL } from './mapTiles.js';
import 'leaflet/dist/leaflet.css';

const isCoordinate = (value) => Number.isFinite(value);

function MapClick({ onPick }) {
  useMapEvents({
    click({ latlng }) {
      onPick(latlng.lat, latlng.lng);
    },
  });
  return null;
}

export default function TripLocationPicker({ start, destination, target, onPick }) {
  const startReady = isCoordinate(start.latitude) && isCoordinate(start.longitude);
  const destinationReady = isCoordinate(destination.latitude) && isCoordinate(destination.longitude);
  const points = [
    ...(startReady ? [[start.latitude, start.longitude]] : []),
    ...(destinationReady ? [[destination.latitude, destination.longitude]] : []),
  ];

  return (
    <div className="relative h-[310px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <MapContainer
        center={startReady ? [start.latitude, start.longitude] : [22.5726, 88.3639]}
        zoom={startReady ? 9 : 6}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          url={MAP_TILE_URL}
          attribution={MAP_ATTRIBUTION}
        />
        <MapClick onPick={onPick} />
        {points.length === 2 && <Polyline positions={points} pathOptions={{ color: '#187454', weight: 4, dashArray: '8 8' }} />}
        {startReady && (
          <CircleMarker center={[start.latitude, start.longitude]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#187454', fillOpacity: 1 }}>
          </CircleMarker>
        )}
        {destinationReady && (
          <CircleMarker center={[destination.latitude, destination.longitude]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#e17d4a', fillOpacity: 1 }} />
        )}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-[1000] flex justify-center">
        <span className="rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-md backdrop-blur">
          Click the map to set your {target === 'start' ? 'starting point' : 'destination'}
        </span>
      </div>
    </div>
  );
}
