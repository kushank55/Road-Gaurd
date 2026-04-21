import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Star, MapPin, User2, ExternalLink } from 'lucide-react';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Button from "@/components/button";
import { Link } from "react-router-dom";
import { useLocation } from '@/hooks/useLocation';

// Fix Leaflet marker icons
const fixLeafletIcons = () => {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

// Custom workshop icon
const workshopIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjRjU5RTBCIiBzdHJva2U9IiNEOTI2MDkiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// User location icon
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMzQjgyRjYiIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+Cg==',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

type Shop = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  owner: string;
  services: string[];
  locationLabel: string;
  lat: number;
  lng: number;
  review: { author: string; rating: number; text: string };
};

interface WorkshopMapViewProps {
  shops: Shop[];
  radiusKm?: number;
  className?: string;
}

export function WorkshopMapView({ shops, radiusKm, className = "h-[600px]" }: WorkshopMapViewProps) {
  const { currentLocation, getCurrentLocation } = useLocation();

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Calculate center and zoom based on workshops
  const mapCenter = useMemo(() => {
    if (currentLocation) {
      return [currentLocation.coordinates.latitude, currentLocation.coordinates.longitude] as [number, number];
    }
    
    if (shops.length === 0) {
      return [40.7128, -74.0060] as [number, number]; // Default to NYC
    }

    if (shops.length === 1) {
      return [shops[0].lat, shops[0].lng] as [number, number];
    }

    // Calculate center of all workshops
    const avgLat = shops.reduce((sum, shop) => sum + shop.lat, 0) / shops.length;
    const avgLng = shops.reduce((sum, shop) => sum + shop.lng, 0) / shops.length;
    
    return [avgLat, avgLng] as [number, number];
  }, [shops, currentLocation]);

  const mapZoom = useMemo(() => {
    if (shops.length <= 1) return 13;
    return 11;
  }, [shops.length]);

  return (
    <div className={`relative overflow-hidden rounded-lg border shadow-sm ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location */}
        {currentLocation && (
          <>
            <Marker position={[currentLocation.coordinates.latitude, currentLocation.coordinates.longitude]} icon={userIcon}>
              <Popup>
                <div className="text-center">
                  <p className="font-medium">Your Location</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Search radius circle */}
            {radiusKm && (
              <Circle
                center={[currentLocation.coordinates.latitude, currentLocation.coordinates.longitude]}
                radius={radiusKm * 1000} // Convert km to meters
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            )}
          </>
        )}

        {/* Workshop markers */}
        {shops.map((shop) => (
          <Marker key={shop.id} position={[shop.lat, shop.lng]} icon={workshopIcon}>
            <Popup maxWidth={300} className="workshop-popup">
              <div className="p-2 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight">{shop.name}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{shop.review.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Image */}
                <div className="w-full h-24 rounded-md overflow-hidden">
                  <img
                    src={shop.imageUrl || "/placeholder.svg"}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {shop.description}
                </p>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{shop.locationLabel}</span>
                </div>

                {/* Owner */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User2 className="h-3 w-3" />
                  <span>Owner: {shop.owner}</span>
                </div>

                {/* Services */}
                {shop.services.length > 0 && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Services: </span>
                    <span className="font-medium">
                      {shop.services.slice(0, 2).join(', ')}
                      {shop.services.length > 2 && ` +${shop.services.length - 2} more`}
                    </span>
                  </div>
                )}

                {/* Action Button */}
                <Button className="w-full bg-amber-500 text-black hover:bg-amber-400 text-xs py-1 px-2">
                  <Link 
                    to={`/workshops/shop/${shop.id}`} 
                    className="flex items-center justify-center gap-1"
                  >
                    View Details
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Enable Location Button (if no location) */}
      {!currentLocation && (
        <div className="absolute top-4 right-4 z-20">
          <Button
            onClick={() => getCurrentLocation()}
            className="bg-white text-black border border-gray-300 hover:bg-gray-50 text-xs px-3 py-2 shadow-md"
          >
            <MapPin className="h-4 w-4 mr-1" />
            Enable Location
          </Button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-lg border p-3 space-y-2">
        <h4 className="text-xs font-semibold">Map Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🔧</span>
            </div>
            <span>Workshop</span>
          </div>
          {currentLocation && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Your Location</span>
            </div>
          )}
          {radiusKm && currentLocation && (
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 border-2 border-blue-500 rounded-full bg-blue-100"></div>
              <span>{radiusKm}km Radius</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
