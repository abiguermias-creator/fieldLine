import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SiteMap = ({ sites = [] }) => {
  const defaultPosition = [9.03, 38.74]; // Addis Ababa

  const sitesWithCoordinates = sites.filter(
    (site) =>
      site.latitude !== null &&
      site.latitude !== undefined &&
      site.longitude !== null &&
      site.longitude !== undefined
  );

  return (
    <MapContainer
      center={defaultPosition}
      zoom={13}
      style={{
        height: '500px',
        width: '100%',
      }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {sitesWithCoordinates.map((site) => (
        <Marker
          key={site.id}
          position={[site.latitude, site.longitude]}
        >
          <Popup>
            <strong>{site.name}</strong>

            <br />
            <br />

            <strong>Client:</strong>{' '}
            {site.client?.name || 'No client assigned'}

            <br />

            <strong>Address:</strong>{' '}
            {site.address || 'No address'}

            <br />

            <strong>City:</strong>{' '}
            {site.city || 'Not provided'}

            <br />

            <strong>Access Notes:</strong>{' '}
            {site.accessNotes || 'No access notes'}

            <br />
            <br />

            <strong>Latitude:</strong>{' '}
            {site.latitude}

            <br />

            <strong>Longitude:</strong>{' '}
            {site.longitude}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default SiteMap;