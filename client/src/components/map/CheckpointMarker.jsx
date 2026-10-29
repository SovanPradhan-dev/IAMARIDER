import { Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function CheckpointMarker({ checkpoint }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!checkpoint.location?.coordinates) return;
    const lat = checkpoint.location.coordinates[1];
    const lon = checkpoint.location.coordinates[0];
    const pos = [lat, lon];
    const icon = L.divIcon({
      className: 'custom-checkpoint-marker',
      html: `<div style="width:24px;height:24px;background:#f59e0b;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff">⚑</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    } else {
      markerRef.current = L.marker(pos, { icon }).addTo(map);
      markerRef.current.bindPopup(
        `<strong>${checkpoint.name}</strong><br/><small>${checkpoint.description || 'Checkpoint'}</small>`
      );
    }
  }, [checkpoint.location, checkpoint.name, checkpoint.description, map]);

  return null;
}
