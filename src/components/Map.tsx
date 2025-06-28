'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngExpression } from 'leaflet';
import * as topojson from 'topojson-client';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Map = () => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const position: LatLngExpression = [32.8391, -83.6324]; // Center of Georgia

  useEffect(() => {
    const fetchGeographicData = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json');
        
        if (!res.ok) {
          throw new Error('Failed to fetch geographic data');
        }
        
        const usTopoJson = await res.json();

        // Filter for Georgia counties (FIPS code for Georgia is 13)
        const gaCounties = {
          type: "GeometryCollection",
          geometries: usTopoJson.objects.counties.geometries.filter((g: any) => g.id.startsWith('13'))
        };
        
        const gaGeoJson = topojson.feature(usTopoJson, gaCounties);
        setGeoJsonData(gaGeoJson);
      } catch (err) {
        console.error('Error fetching geographic data:', err);
        setError('Failed to load map data');
      } finally {
        setLoading(false);
      }
    };

    fetchGeographicData();
  }, []);

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties && feature.properties.name) {
      layer.on({
        click: async (e) => {
          const countyName = feature.properties.name;
          const popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(`
              <div class="p-3">
                <div class="font-bold text-lg mb-2">${countyName} County</div>
                <div class="flex items-center">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span class="text-sm text-gray-600">Loading water systems...</span>
                </div>
              </div>
            `)
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

            let popupContent = `
              <div class="p-3 max-w-xs">
                <div class="font-bold text-lg mb-3 text-gray-900">${countyName} County</div>
            `;
            
            if (waterSystems && waterSystems.length > 0) {
              popupContent += `
                <div class="text-sm text-gray-600 mb-2">${waterSystems.length} water system${waterSystems.length !== 1 ? 's' : ''} found:</div>
                <div class="max-h-40 overflow-y-auto">
              `;
              waterSystems.forEach((system: { PWSID: string; PWS_NAME: string; }) => {
                popupContent += `
                  <div class="mb-2 p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                    <a href="/system/${system.PWSID}" 
                       class="text-blue-600 hover:text-blue-800 font-medium text-sm block hover:underline"
                       target="_blank">
                      ${system.PWS_NAME}
                    </a>
                    <div class="text-xs text-gray-500 mt-1">PWSID: ${system.PWSID}</div>
                  </div>
                `;
              });
              popupContent += '</div>';
            } else {
              popupContent += `
                <div class="text-center py-4">
                  <div class="text-gray-500 text-sm">No water systems found in this county.</div>
                  <div class="text-xs text-gray-400 mt-1">Try searching by system name instead.</div>
                </div>
              `;
            }
            popupContent += '</div>';
            popup.setContent(popupContent);
          } catch (err) {
            popup.setContent(`
              <div class="p-3">
                <div class="font-bold text-lg mb-2 text-gray-900">${countyName} County</div>
                <div class="text-red-600 text-sm">Could not load water system data.</div>
                <div class="text-xs text-gray-500 mt-1">Please try again later.</div>
              </div>
            `);
            console.error('Error loading water systems:', err);
          }
        },
        mouseover: (e) => {
          const layer = e.target;
          layer.setStyle({
            weight: 3,
            color: '#2563eb',
            fillOpacity: 0.3
          });
        },
        mouseout: (e) => {
          const layer = e.target;
          layer.setStyle({
            weight: 1,
            color: '#374151',
            fillOpacity: 0.1
          });
        }
      });
    }
  };

  const geoJsonStyle = {
    fillColor: '#3b82f6',
    weight: 1,
    opacity: 0.8,
    color: '#374151',
    fillOpacity: 0.1
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Georgia map...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 mb-2">Failed to load map</div>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MapContainer 
        center={position} 
        zoom={7} 
        style={{ height: '600px', width: '100%' }}
        className="rounded-lg shadow-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geoJsonData && (
          <GeoJSON 
            data={geoJsonData} 
            onEachFeature={onEachFeature}
            style={geoJsonStyle}
          />
        )}
      </MapContainer>
    </motion.div>
  );
};

export default Map; 