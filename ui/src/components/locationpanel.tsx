import React from "react"
import { MapPin, RefreshCw } from "lucide-react"
import Button from "./button"
import { useCurrentLocationWithAddress } from "../hooks/useLocation"
import LeafletMap from "./LeafletMap"
import { Trans } from "./Trans"

// Simple map placeholder component
function UserLocationMap({ 
  radiusMeters, 
  currentLocation 
}: { 
  radiusMeters: number; 
  currentLocation: { coordinates: { latitude: number; longitude: number }; address?: string } | null 
}) {
  const radiusKm = Math.max(1, Math.round(radiusMeters / 1000))
  
  // If we have location data, show the Leaflet map
  if (currentLocation?.coordinates) {
    return (
      <div className="relative w-full">
        <LeafletMap 
          latitude={currentLocation.coordinates.latitude}
          longitude={currentLocation.coordinates.longitude}
          address={currentLocation.address}
          radiusMeters={radiusMeters}
          className="w-full h-[320px] md:h-[420px] rounded-lg"
        />
        
        <div className="pointer-events-none absolute top-3 right-3">
          <div className="inline-flex items-center gap-2 rounded-md bg-white/90 dark:bg-gray-900/90 backdrop-blur border px-2.5 py-1.5 text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600/70 ring-2 ring-blue-600/15" />
            <span className="text-gray-700 dark:text-gray-300">~{radiusKm} km radius</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t bg-white dark:bg-gray-900">
          <span><Trans translationKey="location.services.active" text="Location services active" /></span>
          <span className="hidden sm:inline"><Trans translationKey="location.map.interactive" text="Interactive map • Hover pin for address" /></span>
        </div>
      </div>
    )
  }
  
  // Fallback placeholder when no location data
  return (
    <div className="relative w-full">
      <div className="w-full h-[320px] md:h-[420px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <MapPin className="h-12 w-12 mx-auto text-blue-600" />
          <div className="text-sm text-gray-600 dark:text-gray-400"><Trans translationKey="location.map.interactive" text="Interactive Map" /></div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            <Trans translationKey="location.map.enable" text="Enable location services to view map" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t">
        <span><Trans translationKey="location.waiting" text="Waiting for location..." /></span>
        <span className="hidden sm:inline"><Trans translationKey="location.map.available" text="Real map integration available" /></span>
      </div>
    </div>
  )
}

// Main LocationPanel Component
export default function LocationPanel() {
  const [radiusKm, setRadiusKm] = React.useState(3)
  const { currentLocation, isLoading, error, refetch } = useCurrentLocationWithAddress({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 300000, // Cache location for 5 minutes
  })

  // Memoize radius calculations to prevent unnecessary re-renders
  const radiusMeters = React.useMemo(() => radiusKm * 1000, [radiusKm])
  const etaMinutes = React.useMemo(() => Math.round(5 + radiusKm * 1.5), [radiusKm])
  
  // Memoize the radius change handler to prevent unnecessary re-renders
  const handleRadiusChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRadiusKm(Number.parseInt(e.target.value))
  }, [])

  // Extract address from location data if available
  const getLocationDisplay = () => {
    if (error) {
      return "Location permission denied or unavailable."
    }
    if (isLoading) {
      return "Getting your location..."
    }
    if (currentLocation?.address) {
      return currentLocation.address
    }
    if (currentLocation?.coordinates) {
      return `${currentLocation.coordinates.latitude.toFixed(4)}, ${currentLocation.coordinates.longitude.toFixed(4)}`
    }
    return "Waiting for location..."
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      {/* Map */}
      <div className="md:col-span-3 rounded-lg border overflow-hidden">
        <UserLocationMap radiusMeters={radiusMeters} currentLocation={currentLocation} />
      </div>

      {/* CTA / Controls */}
      <div className="md:col-span-2">
        <div className="rounded-lg border bg-white dark:bg-gray-900 p-4 md:p-5 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-base md:text-lg font-semibold"><Trans translationKey="location.find.help" text="Find help in your area" /></h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                  aria-label="Refresh location"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {getLocationDisplay()}
            </p>
          </div>

          {/* Radius control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="radius" className="text-sm font-medium">
                <Trans translationKey="location.search.radius" text="Search radius" />
              </label>
              <span className="text-xs text-gray-600 dark:text-gray-400">{radiusKm} km</span>
            </div>
            <input
              id="radius"
              type="range"
              min={1}
              max={15}
              step={1}
              value={radiusKm}
              onChange={handleRadiusChange}
              className="w-full accent-blue-600"
              aria-valuemin={1}
              aria-valuemax={15}
              aria-valuenow={radiusKm}
              aria-label="Search radius"
            />
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-500">
              <span>1km</span>
              <span>5km</span>
              <span>10km</span>
              <span>15km</span>
            </div>
          </div>

          {/* ETA only */}
          <div className="rounded-md border bg-gray-50 dark:bg-gray-800 p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium"><Trans translationKey="location.eta" text="Estimated arrival" /></div>
              <div className="text-xs text-gray-600 dark:text-gray-400"><Trans translationKey="location.eta.description" text="Based on current traffic and distance" /></div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{etaMinutes} min</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="px-5"><Trans translationKey="location.request.assistance" text="Request Assistance" /></Button>
          </div>

          {/* Safety note */}
          <p className="text-[11px] text-gray-500 dark:text-gray-500">
            <Trans translationKey="location.safety.note" text="Share your live location with the assigned provider once your request is accepted." />
          </p>
        </div>
      </div>
    </div>
  )
}