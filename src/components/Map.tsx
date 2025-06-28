'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression } from 'leaflet';

// GeoJSON data for Georgia counties will be passed as a prop
interface MapProps {
  geoJsonData: any;
}

const Map = ({ geoJsonData }: MapProps) => {
  const position: LatLngExpression = [32.8391, -83.6324]; // Center of Georgia

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties && feature.properties.name) {
      layer.on({
        click: async (e) => {
          const countyName = feature.properties.name;
          const popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(`<b>${countyName} County</b><br>Loading water systems...`)
            .openOn(e.target._map);
          
          try {
            // First, try to find systems by county name
            let res = await fetch(`/api/water-systems-by-county?name=${countyName.toUpperCase()}`);
            let { waterSystems } = await res.json();

            // If no systems are found, try searching by city name as a fallback
            if (!waterSystems || waterSystems.length === 0) {
              console.log(`[MAP LOG] No systems found for county "${countyName}". Trying city search...`);
              res = await fetch(`/api/water-systems?q=${countyName.toUpperCase()}`);
              const cityData = await res.json();
              waterSystems = cityData.waterSystems.filter((s: any) => s.CITY_NAME === countyName.toUpperCase());
            }

            let popupContent = `<b>${countyName} County</b>`;
            if (waterSystems && waterSystems.length > 0) {
              popupContent += '<ul class="list-disc pl-5 mt-2">';
              waterSystems.forEach((system: { PWSID: string; PWS_NAME: string; }) => {
                popupContent += `<li class="my-1"><a href="/system/${system.PWSID}" class="text-blue-600 hover:underline">${system.PWS_NAME}</a></li>`;
              });
              popupContent += '</ul>';
            } else {
              popupContent += '<br>No water systems found in this county.';
            }
            popup.setContent(popupContent);
          } catch (err) {
            popup.setContent(`<b>${countyName} County</b><br>Could not load data.`);
            console.error(err);
          }
        }
      });
    }
  };

  return (
    <MapContainer center={position} zoom={7} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {geoJsonData && <GeoJSON data={geoJsonData} onEachFeature={onEachFeature} />}
    </MapContainer>
  );
};

export default Map; 