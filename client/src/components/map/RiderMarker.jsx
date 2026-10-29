import { Marker, Popup } from 'react-leaflet';
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
  const coordinates = rider.location?.coordinates;
  if (!coordinates || coordinates.length !== 2) return null;

  const freshnessLabel = rider.freshness === 'online'
    ? 'Live'
    : rider.freshness === 'stale'
      ? 'Stale location'
      : 'Offline';

  return (
    <Marker
      position={[coordinates[1], coordinates[0]]}
      icon={riderIcon(rider.freshness)}
    >
      <Popup>
        <strong>{rider.name || 'Rider'}</strong>
        <br />
        <small>{freshnessLabel}</small>
      </Popup>
    </Marker>
  );
}
