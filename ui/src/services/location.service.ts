import type { Coordinates } from '../types/location';

/**
 * Location service for external location-related API calls
 * This service provides basic location functionality
 */
class LocationService {
  constructor() {}

  /**
   * Reverse geocode coordinates to get address information
   * This is the main method used by the location store
   * 
   * @param coordinates - The coordinates to reverse geocode
   * @returns Promise with address information
   */
  async reverseGeocode(coordinates: Coordinates): Promise<{
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }> {
    try {
      console.log('Reverse geocoding coordinates:', coordinates);
      
      // Using OpenStreetMap Nominatim API (free and reliable)
      const { latitude, longitude } = coordinates;
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'RoadGuard/1.0', // Required by Nominatim
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Geocoding error: ${data.error}`);
      }

      // Extract address components
      const address = data.display_name || '';
      const addressParts = data.address || {};
      
      return {
        address,
        city: addressParts.city || addressParts.town || addressParts.village || '',
        state: addressParts.state || '',
        country: addressParts.country || '',
        postalCode: addressParts.postcode || '',
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      
      // Return a fallback address based on coordinates
      return {
        address: `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`,
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        postalCode: '',
      };
    }
  }

  /**
   * Forward geocode an address to get coordinates
   * This is a placeholder implementation
   * 
   * @param address - The address to geocode
   * @returns Promise with coordinates
   */
  async forwardGeocode(address: string): Promise<Coordinates> {
    try {
      console.log('Forward geocoding address:', address);
      
      // Using OpenStreetMap Nominatim API for forward geocoding
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'RoadGuard/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('No results found for the given address');
      }

      const result = data[0];
      
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        accuracy: 10,
      };
    } catch (error) {
      console.error('Forward geocoding failed:', error);
      
      // Fallback to mock coordinates
      return {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 1000, // Lower accuracy for fallback
      };
    }
  }

  /**
   * Search for places near a given location
   * This is a placeholder implementation
   * 
   * @param coordinates - Center coordinates for search
   * @param query - Search query (e.g., "restaurant", "gas station")
   * @param radius - Search radius in meters
   * @returns Promise with nearby places
   */
  async searchNearby(
    coordinates: Coordinates,
    query: string,
    // radius intentionally unused in places where Overpass km conversion happens; keep param for API compatibility
    _radius: number = 1000
  ): Promise<Array<{
    name: string;
    address: string;
    coordinates: Coordinates;
    distance: number;
    rating?: number;
    types: string[];
  }>> {
    try {
      console.log('Searching for:', query, 'near:', coordinates, 'within:', _radius, 'meters');
      
      // Using OpenStreetMap Overpass API for places search
      const { latitude, longitude } = coordinates;
      const radiusKm = _radius / 1000;
      
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"${query}"](around:${radiusKm},${latitude},${longitude});
          way["amenity"~"${query}"](around:${radiusKm},${latitude},${longitude});
          relation["amenity"~"${query}"](around:${radiusKm},${latitude},${longitude});
        );
        out body;
        >;
        out skel qt;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        throw new Error(`Places search API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Process the results
      const places = data.elements
        .filter((element: any) => element.tags && element.tags.name)
        .map((element: any) => {
          const distance = this.calculateDistance(
            coordinates,
            { latitude: element.lat, longitude: element.lon }
          );
          
          return {
            name: element.tags.name,
            address: element.tags['addr:street'] || 'Unknown address',
            coordinates: {
              latitude: element.lat,
              longitude: element.lon,
            },
            distance: Math.round(distance * 1000), // Convert to meters
            rating: 4.0, // Default rating
            types: [element.tags.amenity, 'establishment'],
          };
        })
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, 10); // Limit to 10 results

  return places.length > 0 ? places : this.getMockPlaces(coordinates, query, _radius);
    } catch (error) {
      console.error('Places search failed:', error);
  return this.getMockPlaces(coordinates, query, _radius);
    }
  }

  /**
   * Get current location using IP-based geolocation
   * Useful as a fallback when GPS is not available
   * 
   * @returns Promise with approximate coordinates
   */
  async getLocationByIP(): Promise<Coordinates> {
    try {
      // Using a free IP geolocation service (replace with your preferred service)
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 10000, // IP-based location is typically less accurate
        };
      }
      
      throw new Error('IP geolocation failed');
    } catch (error) {
      console.error('IP geolocation failed:', error);
      throw new Error('Failed to get location by IP');
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * 
      Math.cos(this.toRadians(coord2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get mock places for fallback
   */
  private getMockPlaces(
    coordinates: Coordinates,
    query: string,
    _radius: number
  ): Array<{
    name: string;
    address: string;
    coordinates: Coordinates;
    distance: number;
    rating?: number;
    types: string[];
  }> {
    return [
      {
        name: `Mock ${query} 1`,
        address: '123 Sample Street',
        coordinates: {
          latitude: coordinates.latitude + 0.001,
          longitude: coordinates.longitude + 0.001,
        },
        distance: 100,
        rating: 4.5,
        types: [query, 'establishment'],
      },
      {
        name: `Mock ${query} 2`,
        address: '456 Example Avenue',
        coordinates: {
          latitude: coordinates.latitude - 0.001,
          longitude: coordinates.longitude - 0.001,
        },
        distance: 200,
        rating: 4.2,
        types: [query, 'establishment'],
      },
    ];
  }
}

// Export a singleton instance
export const locationService = new LocationService();

// Export the class for custom instances
export { LocationService };
