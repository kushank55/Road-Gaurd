import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ListIcon, ClockIcon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CalendarView from '@/components/CalendarView';
import { useCalendar } from '@/hooks/useCalendar';

const MechanicShopPanel: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const { events, loading } = useCalendar();

  // Get today's events
  const today = new Date();
  const todayEvents = events.filter(event => {
    if (!event.start) return false;
    const eventDate = new Date(event.start);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  });

  // Get status counts
  const completedToday = todayEvents.filter(e => e.status === 'completed').length;
  const pendingTasks = events.filter(e => e.status === 'pending' || e.status === 'assigned').length;
  const inProgressTasks = events.filter(e => e.status === 'in_progress').length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mechanic Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {user?.name}! Here's your schedule and task overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Tasks</p>
                <p className="text-2xl font-bold text-blue-600">{todayEvents.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">{completedToday}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{inProgressTasks}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingTasks}</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
          >
            <ListIcon className="h-4 w-4" />
            List View
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'calendar' ? (
        <CalendarView />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map(event => {
                    const startTime = event.start ? new Date(event.start) : null;
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
                        default:
                          return 'bg-gray-100 text-gray-800';
                      }
                    };

                    return (
                      <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {startTime && (
                              <span className="text-sm font-medium text-blue-600">
                                {startTime.toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                            )}
                            <Badge className={getStatusColor(event.status)}>
                              {event.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{event.location.address}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No tasks scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events
                  .filter(event => {
                    if (!event.start) return false;
                    const eventDate = new Date(event.start);
                    return eventDate > today;
                  })
                  .slice(0, 5)
                  .map(event => {
                    const eventDate = event.start ? new Date(event.start) : null;
                    return (
                      <div key={event.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {eventDate && (
                          <p className="text-xs text-gray-500">
                            {eventDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
              {events.filter(event => {
                if (!event.start) return false;
                const eventDate = new Date(event.start);
                return eventDate > today;
              }).length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No upcoming tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MechanicShopPanel;

