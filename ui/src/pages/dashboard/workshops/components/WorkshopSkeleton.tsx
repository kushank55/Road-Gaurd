import { Card, CardContent } from '@/components/ui/card';

export function WorkshopCardSkeleton() {
  return (
    <Card className="border-muted/50 bg-card shadow-sm animate-pulse">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Image skeleton */}
          <div className="flex-shrink-0 md:w-56">
            <div className="h-40 w-full bg-muted rounded-lg"></div>
          </div>

          {/* Content skeleton */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded-full w-12"></div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-muted rounded-full w-16"></div>
              <div className="h-6 bg-muted rounded-full w-20"></div>
              <div className="h-6 bg-muted rounded-full w-14"></div>
            </div>

            {/* Location */}
            <div className="h-4 bg-muted rounded w-1/2"></div>

            {/* Review */}
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-8 bg-muted rounded w-24"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkshopListSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-muted/50 bg-card p-4 shadow-sm animate-pulse">
      {/* Image */}
      <div className="h-16 w-16 bg-muted rounded-lg flex-shrink-0"></div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            
            <div className="flex gap-1">
              <div className="h-5 bg-muted rounded w-12"></div>
              <div className="h-5 bg-muted rounded w-16"></div>
              <div className="h-5 bg-muted rounded w-10"></div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="h-4 bg-muted rounded w-12"></div>
            <div className="h-6 bg-muted rounded w-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkshopSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-1">
      {Array.from({ length: count }, (_, i) => (
        <WorkshopCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function WorkshopSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <WorkshopListSkeleton key={i} />
      ))}
    </div>
  );
}
