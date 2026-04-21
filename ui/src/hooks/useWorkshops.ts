import { useState, useEffect } from 'react';
import { workshopService, type Workshop, type WorkshopFilters } from '@/services/workshop.service';

export interface UseWorkshopsResult {
  workshops: Workshop[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  refetch: (filters?: WorkshopFilters) => Promise<void>;
}

export const useWorkshops = (initialFilters?: WorkshopFilters): UseWorkshopsResult => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseWorkshopsResult['pagination']>(null);

  const fetchWorkshops = async (filters?: WorkshopFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await workshopService.getWorkshops(filters);
      
      if (response.success) {
        setWorkshops(response.data.workshops);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Failed to fetch workshops');
        setWorkshops([]);
        setPagination(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching workshops');
      setWorkshops([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops(initialFilters);
  }, [initialFilters]);

  return {
    workshops,
    loading,
    error,
    pagination,
    refetch: fetchWorkshops
  };
};
