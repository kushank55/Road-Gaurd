import { useState, useEffect, useCallback } from 'react';
import { workshopService, type WorkshopDetails } from '@/services/workshop.service';

export interface UseWorkshopDetailsResult {
  workshop: WorkshopDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useWorkshopDetails = (id: string): UseWorkshopDetailsResult => {
  const [workshop, setWorkshop] = useState<WorkshopDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkshopDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching workshop details for ID:', id);
      const response = await workshopService.getWorkshopDetails(id);
      console.log('Workshop details response:', response);
      
      if (response.success) {
        setWorkshop(response.data);
        console.log('Workshop data set:', response.data);
      } else {
        setError(response.message || 'Failed to fetch workshop details');
        setWorkshop(null);
        console.error('Workshop fetch failed:', response.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching workshop details';
      setError(errorMessage);
      setWorkshop(null);
      console.error('Workshop fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchWorkshopDetails();
    }
  }, [id, fetchWorkshopDetails]);

  return {
    workshop,
    loading,
    error,
    refetch: fetchWorkshopDetails
  };
};
