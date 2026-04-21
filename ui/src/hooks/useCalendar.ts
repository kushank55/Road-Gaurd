import { useState, useEffect, useCallback } from 'react';
import calendarService from '../services/calendar.service';
import type { WorkerCalendarData, CalendarFilters } from '../services/calendar.service';

export const useCalendar = (initialFilters?: CalendarFilters) => {
  const [calendarData, setCalendarData] = useState<WorkerCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>(initialFilters || {});

  const fetchCalendarData = useCallback(async (newFilters?: CalendarFilters) => {
    try {
      setLoading(true);
      setError(null);
      const filtersToUse = newFilters || filters;
      const data = await calendarService.getWorkerCalendar(filtersToUse);
      setCalendarData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch calendar data';
      setError(errorMessage);
      console.error('Error fetching calendar data:', err);
      
      // Service will handle fallback to mock data, so we don't need to set data here
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = (newFilters: Partial<CalendarFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Check if filters actually changed to prevent infinite loops
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(updatedFilters);
    if (!filtersChanged) {
      return;
    }
    
    setFilters(updatedFilters);
    fetchCalendarData(updatedFilters);
  };

  const refreshCalendar = () => {
    fetchCalendarData();
  };

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Listen for external refresh events (other components can dispatch to force refresh)
  useEffect(() => {
    const handler = () => fetchCalendarData();
    window.addEventListener('calendar:refresh', handler);
    return () => window.removeEventListener('calendar:refresh', handler);
  }, [fetchCalendarData]);

  return {
    calendarData,
    loading,
    error,
    filters,
    updateFilters,
    refreshCalendar,
    events: calendarData?.calendar || []
  };
};
