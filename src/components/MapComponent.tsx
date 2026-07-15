import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MunicipalityData } from '../types';

export const MUN_COORDINATES: Record<string, [number, number]> = {
  'Tunja': [5.5353, -73.3678],
  'Belén': [5.9861, -72.9150],
  'Betéitiva': [5.9142, -72.8122],
  'Chiquinquirá': [5.6175, -73.8164],
  'Chivatá': [5.5653, -73.2842],
  'Gámeza': [5.8011, -72.7844],
  'Cucaita': [5.5417, -73.4542],
  'Cuítiva': [5.5806, -72.9750],
  'Chíquiza': [5.6167, -73.4833],
  'Duitama': [5.8264, -73.0300],
  'El Cocuy': [6.2417, -72.4417],
  'Garagoa': [5.0806, -73.3639],
  'Iza': [5.6167, -72.9833],
  'Villa de Leyva': [5.6372, -73.5244],
  'Monguí': [5.7222, -72.8444],
  'Motavita': [5.5722, -73.3639],
  'Oicatá': [5.5972, -73.3028],
  'Pachavita': [5.0114, -73.4189],
  'Paipa': [5.7833, -73.1167],
  'Paya': [5.6300, -72.4300],
  'Ráquira': [5.5389, -73.6333],
  'Saboyá': [5.6989, -73.7744],
  'Samacá': [5.5000, -73.4833],
  'Sáchica': [5.5833, -73.5458],
  'Siachoque': [5.5133, -73.2450],
  'Soatá': [6.1333, -72.6833],
  'Socha': [5.9667, -72.7167],
  'Sogamoso': [5.7144, -72.9250],
  'Sora': [5.5667, -73.4333],
  'Sotaquirá': [5.7667, -73.2500],
  'Santa Sofía': [5.7114, -73.6067],
  'Tibasosa': [5.7417, -72.9975],
  'Tipacoque': [6.2611, -72.6833],
  'Tópaga': [5.7667, -72.8333],
  'Turmequé': [5.3214, -73.4939],
  'Tuta': [5.6917, -73.2250],
  'Ventaquemada': [5.3722, -73.5222],
};

interface MapComponentProps {
  municipalities: MunicipalityData[];
  selectedMunicipality: MunicipalityData | null;
  onSelectMunicipality: (m: MunicipalityData) => void;
  viewLevel: 'municipal' | 'provincial' | 'departamental';
  dashboardProvince: string;
}

// Utility function to match GeoJSON feature with local municipality data
const findMunicipalityData = (feature: any, list: MunicipalityData[]): MunicipalityData | undefined => {
  const dpto = feature.properties?.DPTO_CCDGO || '';
  const mpio = feature.properties?.MPIO_CCDGO || '';
  const daneCode = dpto + mpio;
  const nameGeo = feature.properties?.MPIO_CNMBR || '';

  return list.find((m) => {
    if (m.daneCode && m.daneCode === daneCode) return true;
    // Normalized comparison
    const n1 = m.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const n2 = nameGeo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return n1 === n2;
  });
};

export default function MapComponent({
  municipalities,
  selectedMunicipality,
  onSelectMunicipality,
  viewLevel,
  dashboardProvince,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  // Load GeoJSON once on mount
  useEffect(() => {
    fetch('/geo/map.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load geojson file');
        return res.json();
      })
      .then((data) => {
        setGeoJsonData(data);
      })
      .catch((err) => {
        console.error('Error fetching /geo/map.geojson:', err);
      });
  }, []);

  // Helper function to calculate style for a given feature
  const getFeatureStyle = (feature: any) => {
    return {
      fillColor: '#94a3b8',
      color: '#cbd5e1',     // elegant subtle border
      weight: 1.0,
      fillOpacity: 0.05,    // extremely light fill to show shape subtly
      opacity: 0.8,
    };
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Boyacá department roughly
    const defaultCenter: [number, number] = [5.65, -73.15];
    const defaultZoom = 8.5;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // CartoDB Positron - light gray style tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update GeoJSON layer on Map when geoJsonData or base list is available
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
    }

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: (feature) => getFeatureStyle(feature),
      onEachFeature: (feature, layer: any) => {
        const m = findMunicipalityData(feature, municipalities);
        let tooltipContent = '';

        if (m) {
          tooltipContent = `
            <div style="font-family: 'Inter', sans-serif; padding: 4px;">
              <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #064e3b;">${m.name}</h4>
              <p style="margin: 0 0 2px 0; font-size: 11px; font-weight: 600; color: #475569;">Provincia: <span style="color: #047857;">${m.province}</span></p>
              <p style="margin: 0; font-size: 11px; font-weight: 600; color: #475569;">Bienes de Interés Cultural: <strong style="color: #059669; font-size: 12px;">${m.totalBICs}</strong></p>
              <div style="margin-top: 6px; font-size: 9px; font-weight: bold; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">Haz clic para seleccionar</div>
            </div>
          `;
        } else {
          const rawName = feature.properties?.MPIO_CNMBR || 'Municipio';
          const titleName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
          tooltipContent = `
            <div style="font-family: 'Inter', sans-serif; padding: 4px;">
              <h4 style="margin: 0 0 2px 0; font-size: 12px; font-weight: 700; color: #334155;">${titleName}</h4>
              <p style="margin: 0; font-size: 10px; color: #64748b; line-height: 1.3;">Sin registros de Bienes de Interés Cultural en la base de datos.</p>
            </div>
          `;
        }

        layer.bindPopup(tooltipContent, {
          closeButton: false,
          offset: [0, 0],
        });

        layer.on({
          mouseover: (e: any) => {
            const target = e.target;
            target.openPopup();
            target.setStyle({
              weight: 1.5,
              color: '#64748b',
              fillOpacity: 0.15,
            });
          },
          mouseout: (e: any) => {
            const target = e.target;
            target.closePopup();
            target.setStyle(getFeatureStyle(feature));
          },
          click: () => {
            if (m) {
              onSelectMunicipality(m);
            }
          },
        });
      }
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;

    // Keep circle markers on top of polygon fills
    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((layer: any) => {
        if (typeof layer.bringToFront === 'function') {
          layer.bringToFront();
        }
      });
    }

    return () => {
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.remove();
        geoJsonLayerRef.current = null;
      }
    };
  }, [geoJsonData, municipalities]);

  // Dynamically update polygon styling when selection, view level, or active province changes
  useEffect(() => {
    const geoJsonLayer = geoJsonLayerRef.current;
    if (!geoJsonLayer) return;

    geoJsonLayer.eachLayer((layer: any) => {
      if (layer.feature) {
        layer.setStyle(getFeatureStyle(layer.feature));
      }
    });
  }, [selectedMunicipality, viewLevel, dashboardProvince, municipalities]);

  // Update Centroid Markers when municipalities list or selections change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    municipalities.forEach((m) => {
      const coords = MUN_COORDINATES[m.name];
      if (!coords) return;

      const isSelected = selectedMunicipality && selectedMunicipality.name === m.name;
      const isInActiveProvince = viewLevel === 'provincial' && m.province === dashboardProvince;
      
      // Proportional sizes for centroid circle markers
      let color = '#3b82f6'; // Blue normally
      let fillColor = '#93c5fd';
      let radius = Math.max(5, 4 + Math.log(m.totalBICs + 1) * 3);
      let weight = 1.5;
      let opacity = 0.7;
      let fillOpacity = 0.5;

      if (viewLevel === 'departamental') {
        color = '#3b82f6'; // Blue normally
        fillColor = '#93c5fd';
      } else if (viewLevel === 'provincial') {
        if (isInActiveProvince) {
          color = '#d97706'; // Dark amber
          fillColor = '#fbbf24';
          radius += 2;
          opacity = 1.0;
          fillOpacity = 0.7;
        } else {
          color = '#cbd5e1'; // Slate gray
          fillColor = '#f1f5f9';
          opacity = 0.35;
          fillOpacity = 0.15;
        }
      }

      if (isSelected) {
        color = '#047857'; // Selected (Emerald/Green)
        fillColor = '#10b981';
        radius += 4;
        weight = 3;
        opacity = 1.0;
        fillOpacity = 0.9;
      }

      const marker = L.circleMarker(coords, {
        radius,
        fillColor,
        color,
        weight,
        opacity,
        fillOpacity,
      });

      // HTML popup for circle marker
      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #064e3b;">${m.name}</h4>
          <p style="margin: 0 0 2px 0; font-size: 11px; font-weight: 600; color: #475569;">Provincia: <span style="color: #047857;">${m.province}</span></p>
          <p style="margin: 0; font-size: 11px; font-weight: 600; color: #475569;">Bienes de Interés Cultural: <strong style="color: #059669; font-size: 12px;">${m.totalBICs}</strong></p>
          <div style="margin-top: 6px; font-size: 9px; font-weight: bold; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">Haz clic para seleccionar</div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, 0],
      });

      // Centroid marker hovers
      marker.on('mouseover', function () {
        this.openPopup();
        this.setStyle({
          weight: isSelected ? 4 : 3,
          fillOpacity: 0.95,
        });
      });

      marker.on('mouseout', function () {
        this.closePopup();
        this.setStyle({
          weight,
          fillOpacity,
        });
      });

      marker.on('click', () => {
        onSelectMunicipality(m);
      });

      markersLayer.addLayer(marker);
    });
  }, [municipalities, selectedMunicipality, viewLevel, dashboardProvince, onSelectMunicipality]);

  // Fly to selected municipality coordinates when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedMunicipality) return;

    const coords = MUN_COORDINATES[selectedMunicipality.name];
    if (coords) {
      map.flyTo(coords, 10.5, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [selectedMunicipality]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([5.65, -73.15], 8.5, {
      duration: 1.2,
    });
  };

  return (
    <div className="bg-white p-6 rounded-[32px] border border-emerald-900/5 shadow-md flex flex-col gap-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-emerald-950 flex items-center gap-2 text-base md:text-lg">
            Distribución de Bienes de Interés Cultural
          </h3>
        </div>

        <button
          onClick={handleRecenter}
          className="self-start sm:self-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all border border-emerald-900/10"
        >
          Centrar
        </button>
      </div>

      {/* Map Container */}
      <div className="relative h-[380px] w-full rounded-2xl overflow-hidden border border-emerald-900/10 shadow-inner z-10">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-emerald-800/80 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-900/5">
        <span className="text-emerald-900/50 uppercase tracking-wider text-[10px] font-bold">Leyenda:</span>
        
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#10b981] border border-[#047857]" />
          <span>Municipio Seleccionado</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#93c5fd] border border-[#3b82f6]" />
          <span>Municipio con BIC</span>
        </div>

        {viewLevel === 'provincial' && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#fbbf24] border border-[#d97706]" />
            <span>Provincia Activa ({dashboardProvince})</span>
          </div>
        )}

        <div className="text-emerald-800/40 text-[11px] ml-auto">
          * El tamaño de las burbujas indica de forma proporcional la cantidad de Bienes de Interés Cultural. Los límites grises demarcan la división política municipal de Boyacá.
        </div>
      </div>
    </div>
  );
}
