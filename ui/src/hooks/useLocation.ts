import { useCallback, useEffect } from 'react';
import { useLocationStore } from '../stores/location.store';
import type {
  GeolocationOptions,
  Coordinates,
} from '../types/location';

/**
 * Custom hook for location functionality
 * Provides easy access to location store and actions
 */
export const useLocation = () => {
  const {
    currentLocation,
    lastKnownLocation,
    isLoading,
    error,
    permission,
    isWatching,
    getCurrentLocation,
    watchPosition,
    stopWatching,
    clearError,
    requestPermission,
    checkPermission,
    reverseGeocode,
  } = useLocationStore();

  return {
    // State
    currentLocation,
    lastKnownLocation,
    isLoading,
    error,
    permission,
    isWatching,
    
    // Actions
    getCurrentLocation,
    watchPosition,
    stopWatching,
    clearError,
    requestPermission,
    checkPermission,
    reverseGeocode,
  };
};

/**
 * Hook to automatically get current location with reverse geocoding on mount
 * Useful for components that need location with address information immediately
 */
export const useCurrentLocationWithAddress = (options?: GeolocationOptions) => {
  const { getCurrentLocation, ...locationState } = useLocation();

  const fetchLocationWithAddress = useCallback(async () => {
    try {
      // getCurrentLocation now automatically performs reverse geocoding
      await getCurrentLocation(options);
    } catch (error) {
      // Error is handled by the store
      console.warn('Failed to get current location with address:', error);
    }
  }, [getCurrentLocation, options]);

  useEffect(() => {
    fetchLocationWithAddress();
  }, [fetchLocationWithAddress]);

  return {
    ...locationState,
    refetch: fetchLocationWithAddress,
  };
};

/**
 * Hook to automatically get current location on mount
 * Useful for components that need location immediately
 */
export const useCurrentLocation = (options?: GeolocationOptions) => {
  const { getCurrentLocation, ...locationState } = useLocation();

  const fetchLocation = useCallback(async () => {
    try {
      await getCurrentLocation(options);
    } catch (error) {
      // Error is handled by the store
      console.warn('Failed to get current location:', error);
    }
  }, [getCurrentLocation, options]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    ...locationState,
    refetch: fetchLocation,
  };
};

/**
 * Hook to automatically start watching position on mount
 * Useful for components that need continuous location updates
 */
export const useLocationWatcher = (
  options?: GeolocationOptions,
  autoStart: boolean = true
) => {
  const { watchPosition, stopWatching, ...locationState } = useLocation();

  const startWatching = useCallback(async () => {
    try {
      await watchPosition(options);
    } catch (error) {
      // Error is handled by the store
      console.warn('Failed to start watching location:', error);
    }
  }, [watchPosition, options]);

  useEffect(() => {
    if (autoStart) {
      startWatching();
    }

    // Cleanup function to stop watching when component unmounts
    return () => {
      stopWatching();
    };
  }, [autoStart, startWatching, stopWatching]);

  return {
    ...locationState,
    startWatching,
    stopWatching,
  };
};

/**
 * Hook for location permissions management
 * Provides utilities for checking and requesting permissions
 */
export const useLocationPermission = () => {
  const { permission, requestPermission, checkPermission, clearError } = useLocation();

  const checkAndRequestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // First check current permission status
      const currentPermission = await checkPermission();
      
      if (currentPermission.granted) {
        return true;
      }
      
      if (currentPermission.denied) {
        // Permission was previously denied, user needs to enable it manually
        return false;
      }
      
      // Permission is in prompt state, request it
      return await requestPermission();
    } catch (error) {
      console.warn('Failed to check/request location permission:', error);
      return false;
    }
  }, [checkPermission, requestPermission]);

  return {
    permission,
    checkPermission,
    requestPermission,
    checkAndRequestPermission,
    clearError,
  };
};

/**
 * Hook to calculate distance between two coordinates
 * Uses Haversine formula for accurate distance calculation
 */
export const useLocationUtils = () => {
  /**
   * Calculate distance between two coordinates in kilometers
   */
  const calculateDistance = useCallback((
    coord1: Coordinates,
    coord2: Coordinates
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(coord2.latitude - coord1.latitude);
    const dLon = toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(coord1.latitude)) * 
      Math.cos(toRadians(coord2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }, []);

  /**
   * Format coordinates for display
   */
  const formatCoordinates = useCallback((
    coordinates: Coordinates,
    precision: number = 6
  ): string => {
    const lat = coordinates.latitude.toFixed(precision);
    const lng = coordinates.longitude.toFixed(precision);
    return `${lat}, ${lng}`;
  }, []);

  /**
   * Check if a coordinate is within a certain radius of another coordinate
   */
  const isWithinRadius = useCallback((
    center: Coordinates,
    point: Coordinates,
    radiusKm: number
  ): boolean => {
    const distance = calculateDistance(center, point);
    return distance <= radiusKm;
  }, [calculateDistance]);

  /**
   * Get compass direction between two coordinates
   */
  const getBearing = useCallback((
    from: Coordinates,
    to: Coordinates
  ): number => {
    const dLon = toRadians(to.longitude - from.longitude);
    const fromLat = toRadians(from.latitude);
    const toLat = toRadians(to.latitude);
    
    const y = Math.sin(dLon) * Math.cos(toLat);
    const x = 
      Math.cos(fromLat) * Math.sin(toLat) -
      Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLon);
    
    let bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360; // Normalize to 0-360
  }, []);

  return {
    calculateDistance,
    formatCoordinates,
    isWithinRadius,
    getBearing,
  };
};

// Utility functions
const toRadians = (degrees: number): number => degrees * (Math.PI / 180);
const toDegrees = (radians: number): number => radians * (180 / Math.PI);

/**
 * Hook that combines location data with utility functions
 * Provides a comprehensive location solution
 */
export const useLocationWithUtils = () => {
  const locationData = useLocation();
  const locationUtils = useLocationUtils();
  const permissionUtils = useLocationPermission();

  return {
    ...locationData,
    ...locationUtils,
    ...permissionUtils,
  };
};
