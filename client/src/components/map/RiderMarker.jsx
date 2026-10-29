import { Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

const riderIcon = (freshness) => {
  const fill =
    freshness === 'online' ? '#27a16f' : freshness === 'stale' ? '#f59e0b' : '#6b7280';
  return L.divIcon({
    className: 'custom-rider-marker',
    html: `<div style="width:26px;height:26px;background:${fill};border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px;color:#fff">•</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -10],
  });
};

export default function RiderMarker({ rider }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!rider.location || !rider.location.coordinates) return;
    const lat = rider.location.coordinates[1];
    const lon = rider.location.coordinates[0];
    const pos = [lat, lon];

    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
      markerRef.current.setIcon(riderIcon(rider.freshness));
    } else {
      markerRef.current = L.marker(pos, { icon: riderIcon(rider.freshness) }).addTo(map);
      markerRef.current.bindPopup(
        `<strong>${rider.name || 'Rider'}</strong><br/><small>${rider.freshness === 'online' ? 'Live' : rider.freshness === 'stale' ? 'Stale location' : 'Offline'}</small>`
      );
    }
  }, [rider.location, rider.freshness, rider.name, map]);

  return null;
}
