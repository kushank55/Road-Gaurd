import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import type { CalendarEvent } from '@/services/calendar.service';

interface CalendarViewProps {
  className?: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ className }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  const { events, loading, error, updateFilters } = useCalendar();

  // Get the start and end of the current month
  const monthStart = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    return date;
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return date;
  }, [currentDate]);

  // Filter and update calendar data when month changes
  React.useEffect(() => {
    updateFilters({
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString()
    });
  }, [monthStart, monthEnd, updateFilters]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [monthStart, monthEnd]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {};
    
    console.log('Grouping events:', events);
    
    events.forEach(event => {
      if (event.start) {
        const eventDate = new Date(event.start);
        const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
        console.log('Event:', event.title, 'Date:', eventDate, 'Key:', dateKey);
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      }
    });
    
    console.log('Grouped events by date:', grouped);
    return grouped;
  }, [events]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    const dayEvents = eventsByDate[dateKey] || [];
    if (day === 31) { // Debug for today
      console.log('Getting events for day', day, 'Key:', dateKey, 'Events:', dayEvents);
    }
    return dayEvents;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-600';
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return '#dc2626';
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-gray-600 mb-4">
          {error.includes('authentication') 
            ? 'Please log in to view your calendar events.' 
            : 'Unable to load calendar data at the moment.'}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // Note: always render the calendar grid. If there are no events we show
  // a non-blocking empty-state banner above the grid so the month view is
  // still visible (empty calendar) instead of returning early.

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-4 w-4" />
              My Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-base font-semibold min-w-[140px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Empty state banner (non-blocking) */}
          {events.length === 0 && (
            <div className="text-center py-4">
              <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No scheduled appointments for this month.</p>
            </div>
          )}
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="p-1 text-center font-medium text-gray-500 text-xs">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isToday = day && 
                new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-1 border border-gray-200 ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium mb-0.5 ${
                        isToday ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 2).map(event => {
                          const startTime = event.start ? new Date(event.start) : null;
                          return (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-all border-l-2"
                              style={{ 
                                backgroundColor: `${getPriorityColor(event.priority)}15`,
                                borderLeftColor: getPriorityBorderColor(event.priority)
                              }}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityColor(event.priority)}`}></div>
                                <span className="truncate font-medium text-gray-800 text-xs">{event.title}</span>
                              </div>
                              {startTime && (
                                <div className="flex items-center gap-1 text-gray-600">
                                  <ClockIcon className="h-2.5 w-2.5 flex-shrink-0" />
                                  <span className="text-xs">{startTime.toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal/Panel */}
      {selectedEvent && (
        <Card className="max-h-80 overflow-y-auto">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Service Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <h3 className="font-semibold text-base">{selectedEvent.title}</h3>
              <p className="text-gray-600 text-sm">{selectedEvent.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedEvent.status)}>
                    {selectedEvent.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    {selectedEvent.priority.toUpperCase()}
                  </Badge>
                </div>

                {selectedEvent.start && (
                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="h-3 w-3 text-gray-500" />
                    <span>
                      {new Date(selectedEvent.start).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <MapPinIcon className="h-3 w-3 text-gray-500" />
                  <span className="truncate">{selectedEvent.location.address}</span>
                </div>

                {selectedEvent.customer && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-3 w-3 text-gray-500" />
                    <span>{selectedEvent.customer.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Issue Description</h4>
                <p className="text-sm text-gray-600">{selectedEvent.issue_description}</p>
              </div>
            </div>

            {selectedEvent.image_urls && selectedEvent.image_urls.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-sm">Images</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedEvent.image_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Service image ${index + 1}`}
                      className="w-full h-16 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CalendarView;
