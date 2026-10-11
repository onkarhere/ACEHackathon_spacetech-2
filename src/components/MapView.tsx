import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, FireObservation } from '../types/incident';
import { ForecastHorizon, ForecastRun, PerimeterFeature } from '../types/forecast';
import { Eye, EyeOff } from 'lucide-react';
import { computeConvexHull, generateWindSpreadHull } from '../utils/geo';

interface MapViewProps {
  incident: Incident;
  hotspots: FireObservation[];
  currentPerimeter?: PerimeterFeature;
  forecastRun?: ForecastRun;
  horizon: ForecastHorizon;
  windSpeedKmh: number;
  windDirectionDeg: number;
}

export const MapView: React.FC<MapViewProps> = ({
  incident,
  hotspots,
  forecastRun,
  horizon,
  windSpeedKmh,
  windDirectionDeg,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const perimeterLayerRef = useRef<L.GeoJSON | null>(null);
  const forecastLayerRef = useRef<L.GeoJSON | null>(null);

  // Visibility states
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showPerimeter, setShowPerimeter] = useState<boolean>(true);
  const [showRiskZone, setShowRiskZone] = useState<boolean>(true);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [incident.latitude, incident.longitude],
        zoom: 8,
        zoomControl: true,
        attributionControl: true,
      });

      // Esri World Dark Gray Canvas Base (Clean tactical dark map with zero watermark)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OSM contributors',
        maxZoom: 16,
      }).addTo(map);

      // Esri World Dark Gray Reference Labels (Provincial boundaries and text)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
      }).addTo(map);


      hotspotsLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Retain instance
    };
  }, []);

  // 2. Center map when incident changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([incident.latitude, incident.longitude], 8, {
        animate: true,
      });
    }
  }, [incident.id, incident.latitude, incident.longitude]);

  // 3. Render Hotspots
  useEffect(() => {
    if (!mapInstanceRef.current || !hotspotsLayerRef.current) return;
    hotspotsLayerRef.current.clearLayers();

    if (!showHotspots) return;

    hotspots.forEach((hs) => {
      const frp = hs.frp || 25;
      const radius = Math.min(9, Math.max(4.5, Math.sqrt(frp) * 0.7));

      const marker = L.circleMarker([hs.latitude, hs.longitude], {
        radius,
        fillColor: '#F97316',
        color: '#EA580C',
        weight: 1.2,
        opacity: 0.95,
        fillOpacity: 0.85,
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 11px; color: #E2E8F0; min-width: 170px;">
          <div style="color: #F97316; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 3px; margin-bottom: 4px;">
            Hotspot (NASA FIRMS)
          </div>
          <div>Lat/Lon: <strong>${hs.latitude.toFixed(4)}, ${hs.longitude.toFixed(4)}</strong></div>
          <div>Brightness: <strong>${hs.brightness ? Math.round(hs.brightness) + ' K' : '340 K'}</strong></div>
          <div>Fire Power (FRP): <strong>${hs.frp ? Math.round(hs.frp) + ' MW' : '25 MW'}</strong></div>
          <div>Confidence: <strong>${hs.confidence || 'nominal'}</strong></div>
          <div style="font-size: 9px; color: #94A3B8; margin-top: 3px;">Sensor: ${hs.source}</div>
        </div>
      `;
      marker.bindPopup(popupContent);
      hotspotsLayerRef.current?.addLayer(marker);
    });
  }, [hotspots, showHotspots]);

  // 4. Render Estimated Perimeter (Convex Hull Outline)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (perimeterLayerRef.current) {
      mapInstanceRef.current.removeLayer(perimeterLayerRef.current);
      perimeterLayerRef.current = null;
    }

    if (!showPerimeter || hotspots.length < 3) return;

    // Compute dynamic convex hull of active hotspots
    const points: [number, number][] = hotspots.map((h) => [h.longitude, h.latitude]);
    const hull = computeConvexHull(points);

    if (hull.length < 3) return;

    const geojsonFeature: GeoJSON.Feature = {
      type: 'Feature',
      properties: {
        label: 'Estimated outline (not mapped)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [hull],
      },
    };

    const layer = L.geoJSON(geojsonFeature, {
      style: {
        color: '#F97316',
        weight: 2,
        opacity: 0.95,
        fillColor: '#EA580C',
        fillOpacity: 0.08,
      },
      onEachFeature: (_, l) => {
        l.bindPopup(`
          <div style="font-size: 11px; color: #E2E8F0;">
            <strong style="color: #F97316;">Estimated outline (not mapped)</strong>
            <p style="margin: 4px 0 0; color: #94A3B8;">Estimated cluster perimeter derived from NASA FIRMS thermal centroid cluster.</p>
          </div>
        `);
      },
    }).addTo(mapInstanceRef.current);

    perimeterLayerRef.current = layer;
  }, [hotspots, showPerimeter]);

  // 5. Render Projected Risk Zone (+6h / +12h)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (forecastLayerRef.current) {
      mapInstanceRef.current.removeLayer(forecastLayerRef.current);
      forecastLayerRef.current = null;
    }

    if (!showRiskZone || horizon === 0 || hotspots.length < 3) return;

    const points: [number, number][] = hotspots.map((h) => [h.longitude, h.latitude]);
    const baseHull = computeConvexHull(points);
    const spreadHull = generateWindSpreadHull(
      baseHull,
      incident.latitude,
      incident.longitude,
      windDirectionDeg,
      windSpeedKmh,
      horizon
    );

    const riskGeojson: GeoJSON.Feature = {
      type: 'Feature',
      properties: {
        label: `Projected risk zone (+${horizon}h demo model)`,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [spreadHull],
      },
    };

    const layer = L.geoJSON(riskGeojson, {
      style: {
        color: '#F59E0B',
        weight: 2,
        opacity: 0.9,
        dashArray: '5, 5',
        fillColor: '#D97706',
        fillOpacity: 0.18,
      },
      onEachFeature: (_, l) => {
        l.bindPopup(`
          <div style="font-size: 11px; color: #E2E8F0;">
            <strong style="color: #F59E0B;">Projected risk zone (demo model)</strong>
            <p style="margin: 4px 0 0; color: #94A3B8;">+${horizon}h directional envelope based on surface wind vector.</p>
          </div>
        `);
      },
    }).addTo(mapInstanceRef.current);

    forecastLayerRef.current = layer;
  }, [hotspots, horizon, showRiskZone, windSpeedKmh, windDirectionDeg, incident.latitude, incident.longitude]);

  return (
    <div className="relative w-full h-[440px] sm:h-[480px] rounded-xl overflow-hidden border border-[#1A2438] bg-[#0A0E17]">
      
      {/* Map DOM */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Top-Right: LAYERS Box */}
      <div className="absolute top-3 right-3 z-10 pointer-events-auto">
        <div className="bg-[#0B101D]/90 backdrop-blur-md border border-[#1C273E] rounded-lg px-3 py-2 text-xs shadow-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>LAYERS</span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-200">
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className="flex items-center gap-2 w-full hover:text-white transition py-0.5 cursor-pointer text-left"
            >
              {showHotspots ? (
                <Eye className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className={showHotspots ? 'text-slate-200' : 'text-slate-500 line-through'}>
                Hotspots
              </span>
            </button>

            <button
              onClick={() => setShowPerimeter(!showPerimeter)}
              className="flex items-center gap-2 w-full hover:text-white transition py-0.5 cursor-pointer text-left"
            >
              {showPerimeter ? (
                <Eye className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className={showPerimeter ? 'text-slate-200' : 'text-slate-500 line-through'}>
                Perimeter
              </span>
            </button>

            <button
              onClick={() => setShowRiskZone(!showRiskZone)}
              className="flex items-center gap-2 w-full hover:text-white transition py-0.5 cursor-pointer text-left"
            >
              {showRiskZone ? (
                <Eye className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className={showRiskZone ? 'text-slate-200' : 'text-slate-500 line-through'}>
                Risk Zone
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom-Left: LEGEND Box */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
        <div className="bg-[#0B101D]/90 backdrop-blur-md border border-[#1C273E] rounded-lg px-3 py-2 text-xs shadow-xl min-w-[190px]">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            LEGEND
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] shrink-0" />
              <span>Hotspot (NASA FIRMS)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-2.5 border border-[#EA580C] bg-[#EA580C]/20 rounded-xs shrink-0" />
              <span>Estimated outline (not mapped)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-2.5 border border-[#F59E0B] border-dashed bg-[#F59E0B]/20 rounded-xs shrink-0" />
              <span>Projected risk zone (demo model)</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
