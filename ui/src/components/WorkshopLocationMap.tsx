import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Locate } from 'lucide-react';

let DefaultIcon = L.divIcon({
  html: `<svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 19.9167 12.5 41 12.5 41C12.5 41 25 19.9167 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="#ef4444"/>
    <circle cx="12.5" cy="12.5" r="4" fill="white"/>
  </svg>`,
  className: 'custom-div-icon',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface WorkshopLocationMapProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

const WorkshopLocationMap: React.FC<WorkshopLocationMapProps> = ({ 
  latitude = 40.7128,
  longitude = -74.0060,
  onLocationSelect,
  className = "w-full h-[400px]"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([latitude, longitude], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add click event listener
    map.on('click', async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      // Update marker position
      updateMarker(lat, lng);
      
      // Try to get address from coordinates
      try {
        const address = await reverseGeocode(lat, lng);
        onLocationSelect(lat, lng, address);
      } catch (error) {
        console.warn('Failed to get address:', error);
        onLocationSelect(lat, lng);
      }
    });

    mapInstanceRef.current = map;

    // Add initial marker if coordinates provided
    if (latitude && longitude) {
      updateMarker(latitude, longitude);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position
  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
    }

    // Add new marker
    const marker = L.marker([lat, lng], { icon: DefaultIcon })
      .addTo(mapInstanceRef.current)
      .bindTooltip('Workshop Location', {
        permanent: false,
        direction: 'top',
        offset: [0, -35],
        className: 'custom-tooltip'
      });

    markerRef.current = marker;

    // Center map on new location
    mapInstanceRef.current.setView([lat, lng], 15);
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        updateMarker(lat, lng);
        
        try {
          const address = await reverseGeocode(lat, lng);
          onLocationSelect(lat, lng, address);
        } catch (error) {
          console.warn('Failed to get address:', error);
          onLocationSelect(lat, lng);
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get your current location. Please click on the map to select a location.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, [onLocationSelect, updateMarker]);

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="flex items-center gap-2"
        >
          <Locate className={`h-4 w-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
          {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
        </Button>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1" />
          Click on the map to select workshop location
        </div>
      </div>
      
      <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div ref={mapRef} className={className} />
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-tooltip {
            background: rgb(239 68 68) !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          }
          .custom-tooltip::before {
            border-top-color: rgb(239 68 68) !important;
          }
          .custom-div-icon {
            background: none !important;
            border: none !important;
          }
          .leaflet-container {
            cursor: crosshair !important;
          }
        `
      }} />
    </div>
  );
};

export default WorkshopLocationMap;
