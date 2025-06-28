'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';

// GeoJSON data for Georgia counties will be passed as a prop
interface MapProps {
  geoJsonData: any;
}

const Map = ({ geoJsonData }: MapProps) => {
  const position: LatLngExpression = [32.8391, -83.6324]; // Center of Georgia

  return (
    <MapContainer center={position} zoom={7} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {geoJsonData && <GeoJSON data={geoJsonData} />}
    </MapContainer>
  );
};

export default Map; 