import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const checkpointIcon = L.divIcon({
  className: 'custom-checkpoint-marker',
  html: '<div style="width:24px;height:24px;background:#f59e0b;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff">⚑</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -10],
});

export default function CheckpointMarker({ checkpoint }) {
  const coordinates = checkpoint.location?.coordinates;
  if (!coordinates || coordinates.length !== 2) return null;

  return (
    <Marker position={[coordinates[1], coordinates[0]]} icon={checkpointIcon}>
      <Popup>
        <strong>{checkpoint.name}</strong>
        <br />
        <small>{checkpoint.description || 'Checkpoint'}</small>
      </Popup>
    </Marker>
  );
}
