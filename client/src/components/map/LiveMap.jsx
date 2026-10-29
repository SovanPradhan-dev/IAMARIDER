import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import RiderMarker from './RiderMarker.jsx';
import CheckpointMarker from './CheckpointMarker.jsx';
import { MAP_ATTRIBUTION, MAP_TILE_URL } from './mapTiles.js';

// Ensure Leaflet CSS is imported once
import 'leaflet/dist/leaflet.css';

function MapReady({ onReady }) {
  const map = useMap();
  useEffect(() => onReady?.(map), [map, onReady]);
  return null;
}

export default function LiveMap({ riders, checkpoints, route, center, zoom = 13, fitToRiders = false, onMapReady }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!fitToRiders || !mapRef.current) return;
    const valid = riders.filter(
      (r) => r.location?.coordinates?.length === 2
    );
    if (valid.length === 0) return;
    const group = new L.featureGroup(
      valid.map((r) => L.marker([r.location.coordinates[1], r.location.coordinates[0]]))
    );
    mapRef.current.fitBounds(group.getBounds().pad(0.25));
  }, [fitToRiders, riders, mapRef.current]);

  return (
    <MapContainer
      ref={(el) => {
        mapRef.current = el;
      }}
      center={center || [22.5726, 88.3639]}
      zoom={zoom}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
    >
      <MapReady onReady={onMapReady} />
      <TileLayer
        url={MAP_TILE_URL}
        attribution={MAP_ATTRIBUTION}
      />
      {route && route.coordinates && route.coordinates.length > 0 && (
        <Polyline
          positions={route.coordinates.map((c) => [c[1], c[0]])}
          color="#1d7a57"
          weight={4}
          opacity={0.8}
        />
      )}
      {riders.map((rider) => (
        <RiderMarker key={rider.userId} rider={rider} />
      ))}
      {checkpoints.map((cp) => (
        <CheckpointMarker key={cp._id} checkpoint={cp} />
      ))}
    </MapContainer>
  );
}
