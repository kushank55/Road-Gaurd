import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, MapPin, Star, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/button';
import { useLocation } from '@/hooks/useLocation';

export interface FilterState {
  search: string;
  status: string;
  minRating: number;
  maxDistance: number;
  owner: string;
  sortBy: 'name' | 'rating' | 'distance';
  sortOrder: 'asc' | 'desc';
}

interface WorkshopFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  workshopsCount: number;
  isLoading?: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  minRating: 0,
  maxDistance: 50,
  owner: '',
  sortBy: 'name',
  sortOrder: 'asc'
};

export function WorkshopFilters({ onFiltersChange, workshopsCount, isLoading = false }: WorkshopFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isExpanded, setIsExpanded] = useState(false);
  const { getCurrentLocation, currentLocation } = useLocation();

  // Debounce filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.maxDistance < 50) count++;
    if (filters.owner) count++;
    if (filters.sortBy !== 'name' || filters.sortOrder !== 'asc') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Main Filter Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workshops by name or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="distance">Sort by Distance</option>
            </select>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Star className="h-4 w-4" />
                  Minimum Rating
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={filters.minRating}
                    onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0★</span>
                    <span className="font-medium">{filters.minRating}★</span>
                    <span>5★</span>
                  </div>
                </div>
              </div>

              {/* Distance Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Max Distance (km)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={filters.maxDistance}
                    onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1km</span>
                    <span className="font-medium">{filters.maxDistance}km</span>
                    <span>100km</span>
                  </div>
                </div>
                {!currentLocation && (
                  <div className="mt-1">
                    <button
                      onClick={() => getCurrentLocation()}
                      className="text-xs text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Enable location for distance filter
                    </button>
                  </div>
                )}
              </div>

              {/* Owner Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Owner
                </label>
                <input
                  type="text"
                  placeholder="Filter by owner name..."
                  value={filters.owner}
                  onChange={(e) => handleFilterChange('owner', e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as any)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex justify-between items-center pt-2">
              <div className="text-sm text-muted-foreground">
                {isLoading ? 'Loading...' : `${workshopsCount} workshop${workshopsCount !== 1 ? 's' : ''} found`}
              </div>
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="text-xs px-3 py-1"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
