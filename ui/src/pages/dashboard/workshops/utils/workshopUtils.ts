import type { Workshop } from '@/services/workshop.service';
import type { FilterState } from '../components/WorkshopFilters';

type CardShop = {
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

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  point1: Coordinates,
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.latitude);
  const dLon = toRad(point2.lng - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

/**
 * Filter workshops based on the provided filters
 */
export function filterWorkshops(
  shops: CardShop[],
  filters: FilterState,
  userLocation?: Coordinates | null
): CardShop[] {
  return shops.filter((shop) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        shop.name.toLowerCase().includes(searchTerm) ||
        shop.description.toLowerCase().includes(searchTerm) ||
        shop.locationLabel.toLowerCase().includes(searchTerm) ||
        shop.owner.toLowerCase().includes(searchTerm) ||
        shop.services.some(service => service.toLowerCase().includes(searchTerm));
      
      if (!matchesSearch) return false;
    }

    // Rating filter
    if (filters.minRating > 0 && shop.review.rating < filters.minRating) {
      return false;
    }

    // Owner filter
    if (filters.owner && !shop.owner.toLowerCase().includes(filters.owner.toLowerCase())) {
      return false;
    }

    // Distance filter (only if user location is available)
    if (userLocation && filters.maxDistance < 50) {
      const distance = calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng });
      if (distance > filters.maxDistance) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort workshops based on the provided sort criteria
 */
export function sortWorkshops(
  shops: CardShop[],
  filters: FilterState,
  userLocation?: Coordinates | null
): CardShop[] {
  return [...shops].sort((a, b) => {
    let comparison = 0;

    switch (filters.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      
      case 'rating':
        comparison = a.review.rating - b.review.rating;
        break;
      
      case 'distance':
        if (userLocation) {
          const distanceA = calculateDistance(userLocation, { lat: a.lat, lng: a.lng });
          const distanceB = calculateDistance(userLocation, { lat: b.lat, lng: b.lng });
          comparison = distanceA - distanceB;
        } else {
          // If no location, sort by name as fallback
          comparison = a.name.localeCompare(b.name);
        }
        break;
      
      default:
        comparison = 0;
    }

    // Apply sort order
    return filters.sortOrder === 'desc' ? -comparison : comparison;
  });
}

/**
 * Add distance information to workshops if user location is available
 */
export function addDistanceToWorkshops(
  shops: CardShop[],
  userLocation?: Coordinates | null
): (CardShop & { distance?: number })[] {
  if (!userLocation) return shops;

  return shops.map(shop => ({
    ...shop,
    distance: calculateDistance(userLocation, { lat: shop.lat, lng: shop.lng })
  }));
}

/**
 * Convert Workshop to CardShop format
 */
export function adaptWorkshopsToCardShop(workshops: Workshop[]): CardShop[] {
  return workshops.map((workshop: Workshop) => ({
    id: workshop.id,
    name: workshop.name,
    description: workshop.description,
    imageUrl: workshop.image_url || '/workshop-exterior.png',
    owner: workshop.owner?.name || 'Unknown Owner',
    services: [], // Services would need to be fetched separately
    locationLabel: workshop.address,
    lat: workshop.latitude,
    lng: workshop.longitude,
    review: {
      author: workshop.owner?.name || 'Unknown Owner',
      rating: workshop.rating,
      text: 'Workshop review',
    },
  }));
}
