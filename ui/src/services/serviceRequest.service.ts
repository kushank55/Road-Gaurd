import { api } from './index';

export interface ServiceRequest {
  id: string;
  user_id: string;
  workshop_id: string | null;
  name: string;
  description: string;
  service_type: 'INSTANT_SERVICE' | 'PRE_BOOK_SLOTS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'QUOTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  issue_description: string;
  image_urls: string[];
  assigned_worker_id: string | null;
  estimated_completion: string | null;
  actual_completion: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  workshop?: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  assignedWorker?: {
    id: string;
    name: string;
    phone: string;
    specialization: string;
  };
}

export interface CreateServiceRequestData {
  workshop_id?: string;
  name: string;
  description: string;
  service_type: 'INSTANT_SERVICE' | 'PRE_BOOK_SLOTS';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  issue_description: string;
  image_urls?: string[];
}

export interface ServiceRequestFilters {
  status?: string;
  service_type?: string;
  priority?: string;
  workshop_id?: string;
  user_id?: string;
  assigned_worker_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface ServiceRequestResponse {
  success: boolean;
  message: string;
  data: ServiceRequest;
}

export interface ServiceRequestsResponse {
  success: boolean;
  message: string;
  data: {
    serviceRequests: ServiceRequest[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

/**
 * Service Request Service
 * Handles all service request-related API calls
 */
export class ServiceRequestService {
  private static instance: ServiceRequestService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceRequestService {
    if (!ServiceRequestService.instance) {
      ServiceRequestService.instance = new ServiceRequestService();
    }
    return ServiceRequestService.instance;
  }

  /**
   * Create a new service request
   */
  async createServiceRequest(data: CreateServiceRequestData): Promise<ServiceRequestResponse> {
    try {
      console.log('Sending service request data:', data);
      
      const response = await api.post<ServiceRequest>('/service-requests', data);
      
      console.log('Service request created successfully:', response.data);
      
      return {
        success: response.success,
        message: response.message || 'Service request created successfully',
        data: response.data
      };
    } catch (error: any) {
      console.error('Failed to create service request:', error);
      throw new Error(error.message || 'Failed to create service request');
    }
  }

  /**
   * Get all service requests with filtering
   */
  async getServiceRequests(filters?: ServiceRequestFilters): Promise<ServiceRequestsResponse> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }

      const response = await api.get<{ serviceRequests: ServiceRequest[]; pagination: any }>(
        `/service-requests?${params.toString()}`
      );

      return {
        success: response.success,
        message: response.message || 'Service requests retrieved successfully',
        data: response.data
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get service requests');
    }
  }

  /**
   * Get service request by ID
   */
  async getServiceRequestById(id: string): Promise<ServiceRequestResponse> {
    try {
      const response = await api.get<ServiceRequest>(`/service-requests/${id}`);
      return {
        success: response.success,
        message: response.message || 'Service request retrieved successfully',
        data: response.data
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get service request');
    }
  }

  /**
   * Update service request
   */
  async updateServiceRequest(id: string, data: Partial<CreateServiceRequestData>): Promise<ServiceRequestResponse> {
    try {
      const response = await api.patch<ServiceRequest>(`/service-requests/${id}`, data);
      return {
        success: response.success,
        message: response.message || 'Service request updated successfully',
        data: response.data
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update service request');
    }
  }

  /**
   * Assign workshop to service request
   */
  async assignWorkshop(id: string, workshopId: string, assignedWorkerId?: string): Promise<ServiceRequestResponse> {
    try {
      const response = await api.post<ServiceRequest>(`/service-requests/${id}/assign-workshop`, {
        workshop_id: workshopId,
        assigned_worker_id: assignedWorkerId
      });
      return {
        success: response.success,
        message: response.message || 'Workshop assigned successfully',
        data: response.data
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to assign workshop');
    }
  }

  /**
   * Assign worker to service request
   */
  async assignWorker(id: string, workerId?: string): Promise<ServiceRequestResponse> {
    try {
      const response = await api.patch<ServiceRequest>(`/service-requests/${id}/assign-worker`, {
        assigned_worker_id: workerId
      });
      return {
        success: response.success,
        message: response.message || 'Worker assignment updated successfully',
        data: response.data
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to assign worker');
    }
  }
}

// Export singleton instance
export const serviceRequestService = ServiceRequestService.getInstance();
