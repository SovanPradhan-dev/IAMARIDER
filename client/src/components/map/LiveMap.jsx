import { MapContainer, TileLayer, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import RiderMarker from './RiderMarker.jsx';
import CheckpointMarker from './CheckpointMarker.jsx';

// Ensure Leaflet CSS is imported once
import 'leaflet/dist/leaflet.css';

export default function LiveMap({ riders, checkpoints, route, center, zoom = 13, fitToRiders = false }) {
  const mapRef = useRef(null);
  const boundsRef = useRef(null);

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
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
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
