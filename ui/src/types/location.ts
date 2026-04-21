// Location-related types and interfaces

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface LocationData {
  coordinates: Coordinates;
  timestamp: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface LocationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

export interface LocationError {
  code: number;
  message: string;
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface LocationState {
  currentLocation: LocationData | null;
  lastKnownLocation: LocationData | null;
  isLoading: boolean;
  error: LocationError | null;
  permission: LocationPermissionState;
  watchId: number | null;
  isWatching: boolean;
}

export interface LocationActions {
  getCurrentLocation: (options?: GeolocationOptions) => Promise<LocationData>;
  watchPosition: (options?: GeolocationOptions) => Promise<void>;
  stopWatching: () => void;
  clearError: () => void;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<LocationPermissionState>;
  reverseGeocode: (coordinates: Coordinates) => Promise<void>;
}

export interface LocationStore extends LocationState, LocationActions {}

// Constants for error types
export const LOCATION_ERROR_TYPES = {
  PERMISSION_DENIED: 'PERMISSION_DENIED' as const,
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE' as const,
  TIMEOUT: 'TIMEOUT' as const,
  UNKNOWN: 'UNKNOWN' as const,
} as const;

// Default geolocation options
export const DEFAULT_GEOLOCATION_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000, // 15 seconds
  maximumAge: 300000, // 5 minutes
};
