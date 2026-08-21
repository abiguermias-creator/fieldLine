import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_POSITION = [9.03, 38.74]; // Addis Ababa

function MapCenterUpdater({ position }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position);
  }, [map, position]);

  return null;
}

export default function ManualSiteMap({ latitude, longitude, onLocationChange }) {
  const initialPosition =
    latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined
      ? [Number(latitude), Number(longitude)]
      : DEFAULT_POSITION;

  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      setPosition([Number(latitude), Number(longitude)]);
    }
  }, [latitude, longitude]);

  function handleDragEnd(event) {
    const marker = event.target;
    const location = marker.getLatLng();

    const newPosition = [location.lat, location.lng];

    setPosition(newPosition);

    onLocationChange({
      latitude: location.lat,
      longitude: location.lng
    });
  }

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{
        height: '400px',
        width: '100%'
      }}
    >
      <MapCenterUpdater position={position} />

      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend: handleDragEnd
        }}
      >
        <Popup>
          <strong>Site location</strong>
          <br />
          Drag this pin to the exact site location.
          <br />
          <br />
          Latitude: {position[0].toFixed(6)}
          <br />
          Longitude: {position[1].toFixed(6)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
