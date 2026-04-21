import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let DefaultIcon = L.divIcon({
  html: `<svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 19.9167 12.5 41 12.5 41C12.5 41 25 19.9167 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="#2563eb"/>
    <circle cx="12.5" cy="12.5" r="4" fill="white"/>
  </svg>`,
  className: 'custom-div-icon',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface LeafletMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  radiusMeters: number;
  className?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  latitude, 
  longitude, 
  address, 
  radiusMeters,
  className = "w-full h-[320px] md:h-[420px]"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Validate coordinates
  const validLatitude = typeof latitude === 'number' && !isNaN(latitude) ? latitude : 40.7128;
  const validLongitude = typeof longitude === 'number' && !isNaN(longitude) ? longitude : -74.0060;

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Clear any existing map instance
    const container = mapRef.current as any;
    if (container._leaflet_id) {
      container._leaflet_id = undefined;
    }

    // Initialize the map
    const map = L.map(mapRef.current).setView([validLatitude, validLongitude], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (mapRef.current) {
        const container = mapRef.current as any;
        container._leaflet_id = undefined;
      }
    };
  }, []); // Empty dependency array - only run once

  // Update marker and circle when coordinates or address change
  const updateMarkerAndCircle = useCallback(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove existing marker and circle
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    // Add marker with tooltip
    const marker = L.marker([validLatitude, validLongitude], { icon: DefaultIcon })
      .addTo(map);

    if (address) {
      marker.bindTooltip(address, {
        permanent: false,
        direction: 'top',
        offset: [0, -35],
        className: 'custom-tooltip'
      });
    }

    // Add radius circle
    const circle = L.circle([validLatitude, validLongitude], {
      color: '#2563eb',
      fillColor: '#2563eb',
      fillOpacity: 0.1,
      radius: radiusMeters
    }).addTo(map);

    // Update map view to fit the circle
    const bounds = circle.getBounds();
    map.fitBounds(bounds, { 
      padding: [20, 20],
      maxZoom: 15 // Prevent zooming in too much
    });

    markerRef.current = marker;
    circleRef.current = circle;
  }, [validLatitude, validLongitude, address, radiusMeters]);

  // Update marker and circle when dependencies change
  useEffect(() => {
    updateMarkerAndCircle();
  }, [updateMarkerAndCircle]);

  return (
    <div className="relative">
      <div ref={mapRef} className={className} />
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-tooltip {
            background: rgb(55 65 81) !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          }
          .custom-tooltip::before {
            border-top-color: rgb(55 65 81) !important;
          }
          .custom-div-icon {
            background: none !important;
            border: none !important;
          }
        `
      }} />
    </div>
  );
};

export default LeafletMap;
