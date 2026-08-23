import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapCenter({ sites }) {
  const map = useMap();

  if (sites.length === 0) {
    return null;
  }

  const firstSite = sites[0];

  if (
    firstSite.latitude === null ||
    firstSite.latitude === undefined ||
    firstSite.longitude === null ||
    firstSite.longitude === undefined
  ) {
    return null;
  }

  map.setView([Number(firstSite.latitude), Number(firstSite.longitude)], 13);

  return null;
}

const SiteMap = ({ sites = [] }) => {
  const defaultPosition = [9.03, 38.74];

  const sitesWithCoordinates = sites.filter(
    (site) => site.latitude !== null && site.latitude !== undefined && site.longitude !== null && site.longitude !== undefined
  );

  const center =
    sitesWithCoordinates.length > 0
      ? [Number(sitesWithCoordinates[0].latitude), Number(sitesWithCoordinates[0].longitude)]
      : defaultPosition;

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{
        height: '500px',
        width: '100%'
      }}
    >
      <MapCenter sites={sitesWithCoordinates} />

      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {sitesWithCoordinates.map((site) => (
        <Marker key={site.id} position={[Number(site.latitude), Number(site.longitude)]}>
          <Popup>
            <strong>{site.name || 'Work order site'}</strong>
            <br />
            <br />
            <strong>Address:</strong> {site.address || 'No address'}
            <br />
            <strong>City:</strong> {site.city || 'Not provided'}
            <br />
            <br />
            <strong>Latitude:</strong> {site.latitude}
            <br />
            <strong>Longitude:</strong> {site.longitude}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default SiteMap;
