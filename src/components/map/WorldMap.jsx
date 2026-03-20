import React, { useEffect, useRef } from 'react';
import { MapContainer, Marker, ZoomControl, useMap, LayerGroup, useMapEvents, GeoJSON } from 'react-leaflet';
import L, { Icon } from 'leaflet';
import { leafletLayer } from 'protomaps-leaflet';
import 'leaflet/dist/leaflet.css';

// Create custom marker icon with #0A4D68 color
const createCustomMarkerIcon = () => {
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="#0A4D68"/>
      <circle cx="12.5" cy="12.5" r="5" fill="white"/>
    </svg>
  `;
  return new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(svgIcon),
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const terminalIcon = createCustomMarkerIcon();

function MapController({ searchCenter }) {
  const map = useMap();
  
  useEffect(() => {
    if (searchCenter) {
      map.setView(searchCenter.position, searchCenter.zoom, { animate: true });
    } else if (searchCenter === null) {
      // Reset to Greenwich when search is cleared
      map.setView([0, 0], 2, { animate: true });
    }
  }, [searchCenter, map]);
  
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: () => {
      if (onMapClick) onMapClick();
    }
  });
  return null;
}

// Add CSS to hide non-English labels and improve text rendering
const mapStyles = `
  .leaflet-container {
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  }
  .leaflet-popup-content {
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  }
`;

function BaseMapLayer({ mapMode }) {
  const map = useMap();
  
  useEffect(() => {
    let layer;
    
    if (mapMode === 'BUNDLED') {
      // Bundled PMTiles mode (offline, no external dependencies)
      // Note: Place base-map.pmtiles file in public/tiles/ directory
      // You can download PMTiles from https://maps.protomaps.com/builds/
      layer = leafletLayer({
        url: '/tiles/base-map.pmtiles',
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
    } else {
      // Use OpenStreetMap tiles with English-only labels (no Arabic, Chinese, etc.)
      layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        className: 'map-tiles'
      });
    }
    
    layer.addTo(map);
    
    return () => {
      map.removeLayer(layer);
    };
  }, [map, mapMode]);
  
  return null;
}

// Default color mapping for zone types (fallback if no color in DB)
const defaultZoneColors = {
  'ECA_SECA': '#FF6B6B',
  'ECA_NECA': '#4ECDC4',
  'PIRACY_HRA': '#FFD93D',
  'MARPOL_SPECIAL_AREA': '#95E1D3',
  'WAR_RISK': '#FA7070',
  'PSSA': '#A8DADC',
  'COMPANY_TRADING_AREA': '#A8DADC'
};

// Component for rendering maritime zones with caching
function MaritimeZonesLayer({ maritimeZones, visibleZoneTypes }) {
  const zonesLayerRef = useRef(new Map());
  
  return (
    <LayerGroup>
      {maritimeZones.map((zone) => {
        if (!zone.geoJson || !visibleZoneTypes.has(zone.zoneType) || !zone.isActive) return null;

        try {
          // Cache parsed GeoJSON to avoid re-parsing on every render
          let geoJsonData = zonesLayerRef.current.get(zone.id);
          if (!geoJsonData) {
            geoJsonData = JSON.parse(zone.geoJson);
            zonesLayerRef.current.set(zone.id, geoJsonData);
          }

          // Use zone color from DB or fallback to default mapping
          const color = zone.color || defaultZoneColors[zone.zoneType] || '#999999';
          const fillOpacity = zone.fillOpacity ?? 0.12;
          const strokeOpacity = zone.strokeOpacity ?? 0.7;
          const strokeWeight = zone.strokeWeight ?? 1;

          return (
            <GeoJSON
              key={zone.id}
              data={geoJsonData}
              style={{
                color: color,
                fillColor: color,
                weight: strokeWeight,
                opacity: strokeOpacity,
                fillOpacity: fillOpacity,
              }}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`<b>${zone.name}</b><br/><i>${zone.zoneType.replace(/_/g, ' ')}</i>${zone.notes ? '<br/>' + zone.notes : ''}`);
              }}
            />
          );
        } catch (e) {
          console.error("Error parsing GeoJSON for zone", zone.id, e);
          return null;
        }
      })}
    </LayerGroup>
  );
}

export default function WorldMap({ 
  terminals, 
  onTerminalClick, 
  onMapClick,
  selectedTerminal, 
  searchCenter,
  mapMode = 'EXTERNAL',
  overlays = { routes: [], zones: [] },
  maritimeZones = [],
  visibleZoneTypes = new Set()
}) {
  return (
    <>
      <style>{`
        .leaflet-container {
          background: #f1f5f9 !important;
        }
        .map-tiles {
          opacity: 0.9;
        }
      `}</style>
      <MapContainer 
        center={[0, 0]} 
        zoom={2} 
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        className="w-full h-full rounded-xl"
        zoomControl={false}
        style={{ background: '#f1f5f9', zIndex: 1 }}
      >
      <MapController searchCenter={searchCenter} />
      <MapClickHandler onMapClick={onMapClick} />
      <ZoomControl position="bottomright" />
      
      {/* Base map layer - bundled tiles or external fallback */}
      <BaseMapLayer mapMode={mapMode} />
      
      {/* Terminal markers layer */}
      <LayerGroup>
        {terminals.map((terminal) => (
          <Marker 
            key={terminal.id}
            position={[terminal.latitude, terminal.longitude]}
            icon={terminalIcon}
            eventHandlers={{
              click: () => onTerminalClick(terminal)
            }}
          />
        ))}
      </LayerGroup>
      
      {/* Future: Voyage routes overlay layer (placeholder) */}
      {overlays.routes && overlays.routes.length > 0 && (
        <LayerGroup>
          {/* Route polylines will be rendered here in future implementation */}
        </LayerGroup>
      )}
      
      {/* Maritime zones overlay layer - renders zones from GeoJSON with transparency */}
      <MaritimeZonesLayer 
        maritimeZones={maritimeZones}
        visibleZoneTypes={visibleZoneTypes}
      />
      </MapContainer>
    </>
  );
}