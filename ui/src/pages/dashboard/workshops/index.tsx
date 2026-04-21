import React, { useMemo, useState, useCallback } from 'react';
import { ShopCard } from '@/pages/dashboard/workshops/components/shopCard';
import { WorkshopListItem } from '@/pages/dashboard/workshops/components/WorkshopListItem';
import { WorkshopMapView } from '@/pages/dashboard/workshops/components/WorkshopMapView';
import { WorkshopFilters, type FilterState } from '@/pages/dashboard/workshops/components/WorkshopFilters';
import { ViewToggle, type ViewMode } from '@/pages/dashboard/workshops/components/ViewToggle';
import { WorkshopSkeletonGrid, WorkshopSkeletonList } from '@/pages/dashboard/workshops/components/WorkshopSkeleton';
import { WorkshopEmptyState } from '@/pages/dashboard/workshops/components/WorkshopEmptyState';
import { useWorkshops } from '@/hooks/useWorkshops';
import { useLocation } from '@/hooks/useLocation';
import { 
  filterWorkshops, 
  sortWorkshops, 
  adaptWorkshopsToCardShop, 
  addDistanceToWorkshops 
} from '@/pages/dashboard/workshops/utils/workshopUtils';
import './styles/workshops.css';

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
  distance?: number;
};

export default function ShopsPage() {
  const { workshops, loading, error, refetch } = useWorkshops();
  const { currentLocation, getCurrentLocation } = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    minRating: 0,
    maxDistance: 50,
    owner: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Adapt workshops to card shop format
  const adaptedShops: CardShop[] = useMemo(() => {
    return adaptWorkshopsToCardShop(workshops);
  }, [workshops]);

  // Add distance information if user location is available
  const shopsWithDistance = useMemo(() => {
    const coords = currentLocation ? currentLocation.coordinates : null;
    return addDistanceToWorkshops(adaptedShops, coords);
  }, [adaptedShops, currentLocation]);

  // Filter and sort workshops
  const filteredAndSortedShops = useMemo(() => {
    const coords = currentLocation ? currentLocation.coordinates : null;
    const filtered = filterWorkshops(shopsWithDistance, filters, coords);
    return sortWorkshops(filtered, filters, coords);
  }, [shopsWithDistance, filters, currentLocation]);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleViewChange = useCallback((newView: ViewMode) => {
    setViewMode(newView);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      minRating: 0,
      maxDistance: 50,
      owner: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, []);

  // Get current location on mount if not available and user wants distance-based features
  React.useEffect(() => {
    const coords = currentLocation ? currentLocation.coordinates : null;
    if (!coords && (filters.maxDistance < 50 || filters.sortBy === 'distance')) {
      getCurrentLocation();
    }
  }, [currentLocation, filters.maxDistance, filters.sortBy, getCurrentLocation]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-pretty text-2xl font-semibold">Workshops Nearby</h1>
              <p className="text-muted-foreground">
                Loading workshops...
              </p>
            </div>
            <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
          </div>
        </header>
        
        <div className="workshop-content">
          {viewMode === 'list' ? <WorkshopSkeletonList /> : <WorkshopSkeletonGrid />}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-lg text-red-600">Error: {error}</div>
          <button 
            onClick={() => refetch()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const renderWorkshopsContent = () => {
    if (filteredAndSortedShops.length === 0) {
      const isEmpty = workshops.length === 0;
      return (
        <WorkshopEmptyState
          type={isEmpty ? 'no-workshops' : 'no-results'}
          onRefresh={() => refetch()}
          onClearFilters={isEmpty ? undefined : resetFilters}
        />
      );
    }

    switch (viewMode) {
      case 'list':
        return (
          <div className="space-y-4">
            {filteredAndSortedShops.map((shop) => (
              <WorkshopListItem key={shop.id} shop={shop} />
            ))}
          </div>
        );
      
      case 'map':
        return (
          <WorkshopMapView 
            shops={filteredAndSortedShops} 
            radiusKm={filters.maxDistance < 50 ? filters.maxDistance : undefined}
          />
        );
      
      case 'grid':
      default:
        return (
          <div className="grid gap-6 lg:grid-cols-1">
            {filteredAndSortedShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        );
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-pretty text-2xl font-semibold">Workshops Nearby</h1>
            <p className="text-muted-foreground">
              Explore and book trusted automotive workshops. 
            </p>
          </div>
          <ViewToggle currentView={viewMode} onViewChange={handleViewChange} />
        </div>
      </header>

      {/* Filters */}
      <WorkshopFilters 
        onFiltersChange={handleFiltersChange}
        workshopsCount={filteredAndSortedShops.length}
        isLoading={loading}
      />

      {/* Results Summary */}
      {filteredAndSortedShops.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedShops.length} of {workshops.length} workshop{workshops.length !== 1 ? 's' : ''}
            {filters.sortBy === 'distance' && currentLocation && (
              <span> • Sorted by distance</span>
            )}
            {filters.minRating > 0 && (
              <span> • Minimum {filters.minRating}★ rating</span>
            )}
            {filters.maxDistance < 50 && currentLocation && (
              <span> • Within {filters.maxDistance}km</span>
            )}
          </p>
          {viewMode === 'map' && (
            <p className="text-xs text-muted-foreground">
              Click on markers to view workshop details
            </p>
          )}
        </div>
      )}

      {/* Content */}
      <section>
        {renderWorkshopsContent()}
      </section>
    </main>
  );
}