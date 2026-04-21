// Google Calendar Integration Service
declare global {
  interface Window {
    gapi: {
      load: (apis: string, callback: () => void) => void;
      client: {
        init: (config: GoogleApiConfig) => Promise<void>;
        calendar: {
          events: {
            list: (params: EventListParams) => Promise<EventListResponse>;
            insert: (params: EventInsertParams) => Promise<EventResponse>;
            patch: (params: EventUpdateParams) => Promise<void>;
            delete: (params: EventDeleteParams) => Promise<void>;
          };
        };
      };
      auth2: {
        getAuthInstance: () => AuthInstance;
      };
    };
    google: Record<string, unknown>;
  }
}

interface GoogleApiConfig {
  apiKey: string;
  clientId: string;
  discoveryDocs: string[];
  scope: string;
}

interface AuthInstance {
  isSignedIn: {
    get: () => boolean;
  };
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    organizer?: boolean;
  }>;
}

interface EventListParams {
  calendarId: string;
  timeMin?: string;
  timeMax?: string;
  singleEvents?: boolean;
  orderBy?: string;
}

interface EventListResponse {
  result: {
    items: GoogleEvent[];
  };
}

interface EventInsertParams {
  calendarId: string;
  resource: Partial<GoogleEvent>;
}

interface EventUpdateParams {
  calendarId: string;
  eventId: string;
  resource: Partial<GoogleEvent>;
}

interface EventDeleteParams {
  calendarId: string;
  eventId: string;
}

interface EventResponse {
  result: {
    id: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date | null;
  end: Date | null;
  status: string;
  priority: string;
  service_type: string;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  } | null;
  issue_description: string;
  image_urls: string[];
  estimated_completion: Date | null;
  actual_completion: Date | null;
  googleEventId?: string;
}

export interface WorkerCalendarData {
  worker: {
    id: string;
    name: string;
    email: string;
    specialization: string[];
    is_available: boolean;
  };
  calendar: CalendarEvent[];
}

export interface CalendarFilters {
  startDate?: string;
  endDate?: string;
}

import { TokenManager } from '../lib/token.utils';

// Google Calendar Configuration
const GOOGLE_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
  API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || 'your-google-api-key',
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  SCOPES: 'https://www.googleapis.com/auth/calendar'
};

class CalendarService {
  private isGoogleApiInitialized = false;
  private isSignedIn = false;
  private readonly calendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary';
  private readonly apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  async initializeGoogleAPI(): Promise<boolean> {
    try {
      if (this.isGoogleApiInitialized) {
        return true;
      }

      // Load Google API script if not already loaded
      if (!window.gapi) {
        await this.loadGoogleAPIScript();
      }

      await new Promise<void>((resolve) => {
        window.gapi.load('client:auth2', resolve);
      });

      await window.gapi.client.init({
        apiKey: GOOGLE_CONFIG.API_KEY,
        clientId: GOOGLE_CONFIG.CLIENT_ID,
        discoveryDocs: [GOOGLE_CONFIG.DISCOVERY_DOC],
        scope: GOOGLE_CONFIG.SCOPES
      });

      this.isGoogleApiInitialized = true;
      this.isSignedIn = window.gapi.auth2.getAuthInstance().isSignedIn.get();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      return false;
    }
  }

  private loadGoogleAPIScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.isGoogleApiInitialized) {
        await this.initializeGoogleAPI();
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }
      
      this.isSignedIn = true;
      return true;
    } catch (error) {
      console.error('Google Calendar sign in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.isGoogleApiInitialized) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
        this.isSignedIn = false;
      }
    } catch (error) {
      console.error('Google Calendar sign out failed:', error);
    }
  }

  async getWorkerCalendar(filters?: CalendarFilters): Promise<WorkerCalendarData> {
    try {
      // Get authentication token from TokenManager
      const token = TokenManager.getToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }

      // Call backend API
      const response = await fetch(`${this.apiBaseUrl}/workers/calendar?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          worker: data.data.worker,
          calendar: data.data.calendar.map((event: any) => ({
            ...event,
            start: event.start ? new Date(event.start) : null,
            end: event.end ? new Date(event.end) : null,
            estimated_completion: event.estimated_completion ? new Date(event.estimated_completion) : null,
            actual_completion: event.actual_completion ? new Date(event.actual_completion) : null
          }))
        };
      } else {
        throw new Error(data.message || 'Failed to fetch calendar data');
      }
    } catch (error) {
      console.error('Error fetching calendar data from backend:', error);
      // Re-throw so caller can handle (hooks will set error state)
      throw error;
    }
  }

  // @ts-ignore - Methods below are for future Google Calendar integration
  private async getGoogleCalendarEvents(filters?: CalendarFilters): Promise<GoogleEvent[] | null> {
    try {
      if (!this.isSignedIn) {
        const signedIn = await this.signIn();
        if (!signedIn) {
          return null;
        }
      }

      const timeMin = filters?.startDate || new Date().toISOString();
      const timeMax = filters?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await window.gapi.client.calendar.events.list({
        calendarId: this.calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @ts-ignore - reserved for future Google Calendar integration
  private async convertGoogleEventsToCalendarEvents(googleEvents: GoogleEvent[]): Promise<CalendarEvent[]> {
    return googleEvents.map(event => ({
      id: event.id,
      title: event.summary || 'Service Request',
      description: event.description || '',
      start: event.start?.dateTime ? new Date(event.start.dateTime) : null,
      end: event.end?.dateTime ? new Date(event.end.dateTime) : null,
      status: this.extractStatusFromEvent(event),
      priority: this.extractPriorityFromEvent(event),
      service_type: this.extractServiceTypeFromEvent(event),
      location: {
        address: event.location || 'Workshop Location',
        latitude: undefined,
        longitude: undefined
      },
      customer: this.extractCustomerFromEvent(event),
      issue_description: event.description || 'Service description',
      image_urls: [],
      estimated_completion: event.end?.dateTime ? new Date(event.end.dateTime) : null,
      actual_completion: null,
      googleEventId: event.id
    }));
  }

  private extractStatusFromEvent(event: GoogleEvent): string {
    const description = event.description?.toLowerCase() || '';
    if (description.includes('completed')) return 'completed';
    if (description.includes('in progress')) return 'in_progress';
    if (description.includes('assigned')) return 'assigned';
    return 'pending';
  }

  private extractPriorityFromEvent(event: GoogleEvent): string {
    const summary = event.summary?.toLowerCase() || '';
    const description = event.description?.toLowerCase() || '';
    
    if (summary.includes('urgent') || description.includes('high priority')) return 'high';
    if (summary.includes('low') || description.includes('low priority')) return 'low';
    return 'medium';
  }

  private extractServiceTypeFromEvent(event: GoogleEvent): string {
    const summary = event.summary?.toLowerCase() || '';
    
    if (summary.includes('oil change')) return 'oil_change';
    if (summary.includes('brake')) return 'brake_service';
    if (summary.includes('engine')) return 'engine_repair';
    if (summary.includes('tire')) return 'tire_service';
    return 'general_service';
  }

  private extractCustomerFromEvent(event: GoogleEvent): { name: string; email: string; phone: string } | null {
    // Try to extract customer info from event description or attendees
    if (event.attendees && event.attendees.length > 0) {
      const customer = event.attendees.find((attendee) => !attendee.organizer);
      if (customer) {
        return {
          name: customer.displayName || customer.email?.split('@')[0] || 'Customer',
          email: customer.email || '',
          phone: ''
        };
      }
    }
    
    // Extract from description if available
    const description = event.description || '';
    const emailMatch = description.match(/(\S+@\S+\.\S+)/);
    const phoneMatch = description.match(/(\+?\d{10,})/);
    
    if (emailMatch) {
      return {
        name: emailMatch[0].split('@')[0],
        email: emailMatch[0],
        phone: phoneMatch?.[0] || ''
      };
    }
    
    return null;
  }

  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<string | null> {
    try {
      if (!this.isSignedIn) {
        const signedIn = await this.signIn();
        if (!signedIn) {
          throw new Error('Not signed in to Google Calendar');
        }
      }

      const googleEvent = {
        summary: event.title,
        description: event.description || event.issue_description,
        location: event.location?.address,
        start: {
          dateTime: event.start?.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: event.end?.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: this.calendarId,
        resource: googleEvent
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      return null;
    }
  }

  async updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<boolean> {
    try {
      if (!this.isSignedIn) {
        return false;
      }

      const googleEvent = {
        summary: updates.title,
        description: updates.description || updates.issue_description,
        location: updates.location?.address,
        start: updates.start ? {
          dateTime: updates.start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        } : undefined,
        end: updates.end ? {
          dateTime: updates.end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        } : undefined
      };

      await window.gapi.client.calendar.events.patch({
        calendarId: this.calendarId,
        eventId: eventId,
        resource: googleEvent
      });

      return true;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      return false;
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
      if (!this.isSignedIn) {
        return false;
      }

      await window.gapi.client.calendar.events.delete({
        calendarId: this.calendarId,
        eventId: eventId
      });

      return true;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      return false;
    }
  }

  // Fallback mock data for development/demo
  // @ts-ignore - mock data generator used for development/demo
  private getMockCalendarData(): WorkerCalendarData {
    const today = new Date();
    console.log('Generating mock data for date:', today.toString());
    console.log('Today details:', {
      year: today.getFullYear(),
      month: today.getMonth(),
      date: today.getDate()
    });
    
    const mockEvents: CalendarEvent[] = [
      // Today's events (Aug 31, 2025)
      {
        id: 'mock-1',
        title: 'Oil Change - Toyota Camry',
        description: 'Regular oil change service',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
        status: 'in_progress',
        priority: 'medium',
        service_type: 'oil_change',
        location: {
          address: '123 Main St, Downtown',
          latitude: 40.7128,
          longitude: -74.0060
        },
        customer: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+1 (555) 123-4567'
        },
        issue_description: 'Regular maintenance oil change',
        image_urls: [],
        estimated_completion: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
        actual_completion: null
      },
      {
        id: 'mock-2',
        title: 'Brake Repair - Honda Civic',
        description: 'Customer reports squeaking brakes',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
        status: 'pending',
        priority: 'high',
        service_type: 'brake_service',
        location: {
          address: '456 Oak Avenue, Midtown',
          latitude: 40.7589,
          longitude: -73.9851
        },
        customer: {
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '+1 (555) 987-6543'
        },
        issue_description: 'Brakes making squeaking noise when stopping',
        image_urls: [],
        estimated_completion: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
        actual_completion: null
      },
      // Tomorrow's events
      {
        id: 'mock-3',
        title: 'Engine Diagnostic - Ford F-150',
        description: 'Check engine light diagnosis',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 8, 30),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0),
        status: 'assigned',
        priority: 'urgent',
        service_type: 'engine_repair',
        location: {
          address: '789 Pine Road, Uptown',
          latitude: 40.7831,
          longitude: -73.9712
        },
        customer: {
          name: 'Michael Brown',
          email: 'mbrown@email.com',
          phone: '+1 (555) 456-7890'
        },
        issue_description: 'Check engine light came on, engine running rough',
        image_urls: [],
        estimated_completion: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0),
        actual_completion: null
      },
      // Day after tomorrow
      {
        id: 'mock-4',
        title: 'Tire Replacement - BMW X5',
        description: 'Replace all four tires',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 12, 30),
        status: 'pending',
        priority: 'medium',
        service_type: 'tire_service',
        location: {
          address: '321 Elm Street, Westside',
          latitude: 40.7282,
          longitude: -74.0776
        },
        customer: {
          name: 'Lisa Davis',
          email: 'lisa.davis@email.com',
          phone: '+1 (555) 234-5678'
        },
        issue_description: 'All tires worn out, need replacement',
        image_urls: [],
        estimated_completion: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 12, 30),
        actual_completion: null
      },
      // Completed event from yesterday
      {
        id: 'mock-5',
        title: 'Battery Replacement - Nissan Altima',
        description: 'Car battery replacement',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 0),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12, 0),
        status: 'completed',
        priority: 'high',
        service_type: 'electrical_service',
        location: {
          address: '987 Cedar Lane, Southside',
          latitude: 40.7014,
          longitude: -74.0123
        },
        customer: {
          name: 'Jennifer Garcia',
          email: 'j.garcia@email.com',
          phone: '+1 (555) 567-8901'
        },
        issue_description: 'Battery completely dead, car won\'t start',
        image_urls: [],
        estimated_completion: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12, 0),
        actual_completion: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 11, 45)
      }
    ];

    console.log('Generated mock events:', mockEvents.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      dateKey: e.start ? `${e.start.getFullYear()}-${e.start.getMonth()}-${e.start.getDate()}` : 'no-date'
    })));

    return {
      worker: {
        id: 'worker-demo',
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@roadguard.com',
        specialization: ['Engine Repair', 'Brake Service', 'Oil Change', 'Diagnostic'],
        is_available: true
      },
      calendar: mockEvents
    };
  }

  isGoogleCalendarAvailable(): boolean {
    return this.isGoogleApiInitialized && this.isSignedIn;
  }

  getSignInStatus(): boolean {
    return this.isSignedIn;
  }
}

export default new CalendarService();
