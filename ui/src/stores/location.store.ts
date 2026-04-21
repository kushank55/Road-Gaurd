import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  LocationStore,
  LocationState,
  LocationData,
  LocationError,
  LocationPermissionState,
  GeolocationOptions,
  Coordinates,
} from "../types/location";

// Default geolocation options
const DEFAULT_GEOLOCATION_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000, // 15 seconds
  maximumAge: 300000, // 5 minutes
};

// Initial state
const initialState: LocationState = {
  currentLocation: null,
  lastKnownLocation: null,
  isLoading: false,
  error: null,
  permission: {
    granted: false,
    denied: false,
    prompt: true,
  },
  watchId: null,
  isWatching: false,
};

/**
 * Utility function to convert GeolocationPositionError to LocationError
 */
const createLocationError = (error: GeolocationPositionError): LocationError => {
  let type: LocationError['type'];
  let message: string;

  switch (error.code) {
    case error.PERMISSION_DENIED:
      type = 'PERMISSION_DENIED';
      message = 'Location access denied by user';
      break;
    case error.POSITION_UNAVAILABLE:
      type = 'POSITION_UNAVAILABLE';
      message = 'Location information unavailable';
      break;
    case error.TIMEOUT:
      type = 'TIMEOUT';
      message = 'Location request timed out';
      break;
    default:
      type = 'UNKNOWN';
      message = error.message || 'Unknown location error';
  }

  return {
    code: error.code,
    message,
    type,
  };
};

/**
 * Convert GeolocationPosition to LocationData
 */
const createLocationData = (position: GeolocationPosition): LocationData => {
  const { coords, timestamp } = position;
  
  return {
    coordinates: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude || undefined,
      altitudeAccuracy: coords.altitudeAccuracy || undefined,
      heading: coords.heading || undefined,
      speed: coords.speed || undefined,
    },
    timestamp,
  };
};

/**
 * Check if geolocation is supported
 */
const isGeolocationSupported = (): boolean => {
  return 'geolocation' in navigator;
};

/**
 * Zustand store for location state management
 */
export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      /**
       * Get current location once and perform reverse geocoding
       */
      getCurrentLocation: async (options: GeolocationOptions = DEFAULT_GEOLOCATION_OPTIONS) => {
        return new Promise<LocationData>((resolve, reject) => {
          const state = get();
          
          // Prevent multiple simultaneous requests
          if (state.isLoading) {
            console.warn('Location request already in progress');
            reject(new Error('Location request already in progress'));
            return;
          }

          if (!isGeolocationSupported()) {
            const error: LocationError = {
              code: -1,
              message: 'Geolocation is not supported by this browser',
              type: 'UNKNOWN',
            };
            set({ error, isLoading: false });
            reject(error);
            return;
          }

          set({ isLoading: true, error: null });

          // Add timeout for the entire geolocation process
          const geolocationTimeout = setTimeout(() => {
            const timeoutError: LocationError = {
              code: -1,
              message: 'Geolocation request timed out',
              type: 'TIMEOUT',
            };
            set({ error: timeoutError, isLoading: false });
            reject(timeoutError);
          }, options.timeout || 15000);

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              clearTimeout(geolocationTimeout);
              
              try {
                const locationData = createLocationData(position);
                
                // Update state with coordinates first
                set({
                  currentLocation: locationData,
                  lastKnownLocation: locationData,
                  permission: { granted: true, denied: false, prompt: false },
                });

                // Perform reverse geocoding to get address with timeout
                try {
                  const { locationService } = await import('../services/location.service');
                  
                  // Add timeout for reverse geocoding
                  const geocodingPromise = locationService.reverseGeocode(locationData.coordinates);
                  const geocodingTimeout = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Reverse geocoding timeout')), 8000);
                  });
                  
                  const addressData = await Promise.race([geocodingPromise, geocodingTimeout]);
                  
                  const enrichedLocationData: LocationData = {
                    ...locationData,
                    address: addressData.address,
                    city: addressData.city,
                    state: addressData.state,
                    country: addressData.country,
                    postalCode: addressData.postalCode,
                  };

                  set({
                    currentLocation: enrichedLocationData,
                    lastKnownLocation: enrichedLocationData,
                    isLoading: false,
                    error: null,
                  });

                  resolve(enrichedLocationData);
                } catch (geocodingError) {
                  // If reverse geocoding fails, still return the location with coordinates
                  console.warn('Reverse geocoding failed:', geocodingError);
                  set({
                    isLoading: false,
                    error: null,
                  });
                  resolve(locationData);
                }
              } catch (error) {
                clearTimeout(geolocationTimeout);
                const locationError: LocationError = {
                  code: -1,
                  message: 'Failed to process location data',
                  type: 'UNKNOWN',
                };
                set({ error: locationError, isLoading: false });
                reject(locationError);
              }
            },
            (error) => {
              clearTimeout(geolocationTimeout);
              const locationError = createLocationError(error);
              set({
                error: locationError,
                isLoading: false,
                permission: {
                  granted: false,
                  denied: error.code === error.PERMISSION_DENIED,
                  prompt: error.code !== error.PERMISSION_DENIED,
                },
              });
              reject(locationError);
            },
            options
          );
        });
      },

      /**
       * Start watching position changes with reverse geocoding
       */
      watchPosition: async (options: GeolocationOptions = DEFAULT_GEOLOCATION_OPTIONS) => {
        return new Promise<void>((resolve, reject) => {
          const state = get();
          
          if (!isGeolocationSupported()) {
            const error: LocationError = {
              code: -1,
              message: 'Geolocation is not supported by this browser',
              type: 'UNKNOWN',
            };
            set({ error });
            reject(error);
            return;
          }

          // Stop existing watch if any
          if (state.watchId !== null) {
            navigator.geolocation.clearWatch(state.watchId);
          }

          set({ isLoading: true, error: null });

          // Add debouncing for reverse geocoding during position watching
          let lastGeocodingTime = 0;
          const GEOCODING_DEBOUNCE = 5000; // 5 seconds between geocoding requests during watching

          const watchId = navigator.geolocation.watchPosition(
            async (position) => {
              try {
                const locationData = createLocationData(position);
                
                // Update state with coordinates first
                set({
                  currentLocation: locationData,
                  lastKnownLocation: locationData,
                  permission: { granted: true, denied: false, prompt: false },
                  isWatching: true,
                });

                // Perform reverse geocoding to get address (with debouncing to avoid too many requests)
                const now = Date.now();
                if (now - lastGeocodingTime > GEOCODING_DEBOUNCE) {
                  lastGeocodingTime = now;
                  
                  try {
                    const { locationService } = await import('../services/location.service');
                    
                    // Add timeout for reverse geocoding during watching
                    const geocodingPromise = locationService.reverseGeocode(locationData.coordinates);
                    const geocodingTimeout = new Promise<never>((_, reject) => {
                      setTimeout(() => reject(new Error('Reverse geocoding timeout')), 5000);
                    });
                    
                    const addressData = await Promise.race([geocodingPromise, geocodingTimeout]);
                    
                    const enrichedLocationData: LocationData = {
                      ...locationData,
                      address: addressData.address,
                      city: addressData.city,
                      state: addressData.state,
                      country: addressData.country,
                      postalCode: addressData.postalCode,
                    };

                    set({
                      currentLocation: enrichedLocationData,
                      lastKnownLocation: enrichedLocationData,
                      isLoading: false,
                      error: null,
                      isWatching: true,
                    });
                  } catch (geocodingError) {
                    // If reverse geocoding fails, still keep the location with coordinates
                    console.warn('Reverse geocoding failed during position watching:', geocodingError);
                    set({
                      isLoading: false,
                      error: null,
                      isWatching: true,
                    });
                  }
                } else {
                  // Skip geocoding if debounce period hasn't passed
                  set({
                    isLoading: false,
                    error: null,
                    isWatching: true,
                  });
                }
              } catch (error) {
                const locationError: LocationError = {
                  code: -1,
                  message: 'Failed to process location data',
                  type: 'UNKNOWN',
                };
                set({
                  error: locationError,
                  isLoading: false,
                  isWatching: false,
                });
              }
            },
            (error) => {
              const locationError = createLocationError(error);
              set({
                error: locationError,
                isLoading: false,
                isWatching: false,
                permission: {
                  granted: false,
                  denied: error.code === error.PERMISSION_DENIED,
                  prompt: error.code !== error.PERMISSION_DENIED,
                },
              });
              reject(locationError);
            },
            options
          );

          set({ watchId, isWatching: true });
          resolve();
        });
      },

      /**
       * Stop watching position changes
       */
      stopWatching: () => {
        const state = get();
        if (state.watchId !== null) {
          navigator.geolocation.clearWatch(state.watchId);
          set({
            watchId: null,
            isWatching: false,
            isLoading: false,
          });
        }
      },

      /**
       * Clear any error state
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Request permission for location access
       */
      requestPermission: async (): Promise<boolean> => {
        if (!isGeolocationSupported()) {
          return false;
        }

        // For modern browsers with permissions API
        if ('permissions' in navigator) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            const granted = result.state === 'granted';
            const denied = result.state === 'denied';
            const prompt = result.state === 'prompt';

            set({
              permission: { granted, denied, prompt },
            });

            return granted;
          } catch (error) {
            // Fallback for browsers that don't support permissions API
            console.warn('Permissions API not supported, using fallback');
          }
        }

        // Fallback: try to get location to trigger permission request
        try {
          await get().getCurrentLocation({
            ...DEFAULT_GEOLOCATION_OPTIONS,
            timeout: 1000, // Quick timeout for permission check
          });
          return true;
        } catch (error) {
          return false;
        }
      },

      /**
       * Check current permission status
       */
      checkPermission: async (): Promise<LocationPermissionState> => {
        if (!isGeolocationSupported()) {
          const permission: LocationPermissionState = {
            granted: false,
            denied: true,
            prompt: false,
          };
          set({ permission });
          return permission;
        }

        if ('permissions' in navigator) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            const permission: LocationPermissionState = {
              granted: result.state === 'granted',
              denied: result.state === 'denied',
              prompt: result.state === 'prompt',
            };

            set({ permission });
            return permission;
          } catch (error) {
            console.warn('Permissions API not supported');
          }
        }

        // Return current state if permissions API is not available
        return get().permission;
      },

      /**
       * Reverse geocode coordinates to get address information
       * This method can be called manually to get address for specific coordinates
       */
      reverseGeocode: async (coordinates: Coordinates): Promise<void> => {
        try {
          set({ isLoading: true, error: null });

          // Import the location service dynamically to avoid circular dependencies
          const { locationService } = await import('../services/location.service');
          
          // Add timeout for reverse geocoding
          const geocodingPromise = locationService.reverseGeocode(coordinates);
          const geocodingTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Reverse geocoding timeout')), 10000);
          });
          
          const addressData = await Promise.race([geocodingPromise, geocodingTimeout]);

          const state = get();
          
          // Create updated location data
          const updatedLocation: LocationData = {
            coordinates,
            timestamp: state.currentLocation?.timestamp || Date.now(),
            address: addressData.address,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country,
            postalCode: addressData.postalCode,
          };

          set({
            currentLocation: updatedLocation,
            lastKnownLocation: updatedLocation,
            isLoading: false,
          });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          const locationError: LocationError = {
            code: -1,
            message: 'Failed to reverse geocode location',
            type: 'UNKNOWN',
          };
          set({ error: locationError, isLoading: false });
        }
      },
    }),
    {
      name: 'location-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist last known location and permission state
        lastKnownLocation: state.lastKnownLocation,
        permission: state.permission,
      }),
    }
  )
);
