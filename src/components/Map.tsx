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
              <div style="padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px; color: #111827;">${countyName} County</div>
                <div style="display: flex; align-items: center;">
                  <div style="width: 16px; height: 16px; border: 2px solid #3b82f6; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
                  <span style="font-size: 14px; color: #6b7280;">Loading water systems...</span>
                </div>
                <style>
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                </style>
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
              <div style="min-width: 300px; max-width: 400px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #111827; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">${countyName} County</div>
            `;
            
            if (waterSystems && waterSystems.length > 0) {
              const totalActiveViolations = waterSystems.reduce((sum: number, system: any) => sum + (system.activeViolations || 0), 0);
              const totalEnforcementActions = waterSystems.reduce((sum: number, system: any) => sum + (system.enforcementActions || 0), 0);
              
              popupContent += `
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                  ${waterSystems.length} water system${waterSystems.length !== 1 ? 's' : ''} found
                  ${totalActiveViolations > 0 ? ` • <span style="color: #dc2626; font-weight: 500;">${totalActiveViolations} active violation${totalActiveViolations !== 1 ? 's' : ''}</span>` : ' • <span style="color: #059669; font-weight: 500;">No active violations</span>'}
                  ${totalEnforcementActions > 0 ? ` • <span style="color: #d97706; font-weight: 500;">${totalEnforcementActions} enforcement action${totalEnforcementActions !== 1 ? 's' : ''}</span>` : ''}
                </div>
                <div style="max-height: 250px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px;">
              `;
              waterSystems.forEach((system: { PWSID: string; PWS_NAME: string; activeViolations?: number; enforcementActions?: number; totalViolations?: number; POPULATION_SERVED_COUNT?: number; }) => {
                const borderColor = (system.activeViolations && system.activeViolations > 0) ? '#dc2626' : '#3b82f6';
                const bgColor = (system.activeViolations && system.activeViolations > 0) ? '#fef2f2' : '#f9fafb';
                
                popupContent += `
                  <div style="margin: 4px 0; padding: 8px; background: ${bgColor}; border-radius: 6px; border-left: 4px solid ${borderColor};">
                    <a href="/system/${system.PWSID}" 
                       style="color: #2563eb; font-weight: 500; font-size: 14px; text-decoration: none; display: block;"
                       target="_blank"
                       onmouseover="this.style.color='#1d4ed8'; this.style.textDecoration='underline'"
                       onmouseout="this.style.color='#2563eb'; this.style.textDecoration='none'">
                      ${system.PWS_NAME}
                    </a>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                      <div style="font-size: 12px; color: #6b7280;">PWSID: ${system.PWSID}</div>
                      <div style="display: flex; gap: 4px;">
                        ${system.activeViolations !== undefined ? `
                          <div style="font-size: 11px; padding: 2px 6px; border-radius: 12px; ${
                            system.activeViolations > 0 
                              ? 'background: #fee2e2; color: #991b1b;' 
                              : 'background: #dcfce7; color: #166534;'
                          }">
                            ${system.activeViolations > 0 
                              ? `${system.activeViolations} active` 
                              : 'Compliant'
                            }
                          </div>
                        ` : ''}
                        ${system.enforcementActions && system.enforcementActions > 0 ? `
                          <div style="font-size: 11px; padding: 2px 6px; border-radius: 12px; background: #fef3c7; color: #92400e;">
                            ${system.enforcementActions} enforcement
                          </div>
                        ` : ''}
                      </div>
                    </div>
                    ${system.POPULATION_SERVED_COUNT ? `
                      <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                        Serves: ${system.POPULATION_SERVED_COUNT.toLocaleString()} people
                      </div>
                    ` : ''}
                  </div>
                `;
              });
              popupContent += '</div>';
            } else {
              popupContent += `
                <div style="text-align: center; padding: 16px; background: #fef3c7; border-radius: 8px; border: 1px solid #f59e0b;">
                  <div style="color: #92400e; font-size: 14px; margin-bottom: 4px;">No water systems found in this county.</div>
                  <div style="font-size: 12px; color: #a16207;">Try searching by system name instead.</div>
                </div>
              `;
            }
            popupContent += '</div>';
            popup.setContent(popupContent);
          } catch (err) {
            popup.setContent(`
              <div style="padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="font-weight: bold; font-size: 18px; margin-bottom: 8px; color: #111827;">${countyName} County</div>
                <div style="color: #dc2626; font-size: 14px; margin-bottom: 4px;">Could not load water system data.</div>
                <div style="font-size: 12px; color: #6b7280;">Please try again later.</div>
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