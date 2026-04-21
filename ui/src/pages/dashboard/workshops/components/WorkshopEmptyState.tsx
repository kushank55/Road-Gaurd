import { Search, MapPin, RefreshCw } from 'lucide-react';
import Button from '@/components/button';

interface EmptyStateProps {
  type: 'no-workshops' | 'no-results';
  onRefresh?: () => void;
  onClearFilters?: () => void;
}

export function WorkshopEmptyState({ type, onRefresh, onClearFilters }: EmptyStateProps) {
  if (type === 'no-workshops') {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <MapPin className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Workshops Available</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          We couldn't find any workshops in your area at the moment. Try refreshing or check back later.
        </p>
        {onRefresh && (
          <Button onClick={onRefresh} className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Workshops
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        We couldn't find any workshops matching your current filters. Try adjusting your search criteria or clearing some filters.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters} className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Clear All Filters
          </Button>
        )}
        {onRefresh && (
          <Button onClick={onRefresh} className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Workshops
          </Button>
        )}
      </div>
    </div>
  );
}
