import axios from "axios";
import type { AxiosResponse } from "axios";
import { ENV } from "../config/auth.config";
import { TokenManager } from "../lib/token.utils";

// Workshop types
export interface Workshop {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string | null;
  status: 'OPEN' | 'CLOSED';
  rating: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface WorkshopFilters {
  status?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface WorkshopResponse {
  success: boolean;
  message: string;
  data: {
    workshops: Workshop[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    filters: {
      status?: string;
      search?: string;
      radius?: number | null;
      location?: { latitude: number; longitude: number } | null;
    };
  };
}

export interface CreateWorkshopRequest {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  status?: 'OPEN' | 'CLOSED';
}

export interface WorkshopServiceInterface {
  id: string;
  workshop_id: string;
  name: string;
  description: string;
  vehicle_model: string;
  license_plate: string;
  image_urls: string[];
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopReview {
  id: string;
  rating: number;
  comment: string;
  workshopId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopDetails extends Workshop {
  services?: WorkshopServiceInterface[];
  reviews?: WorkshopReview[];
  averageRating?: number;
}

export interface CreateServiceRequest {
  workshop_id: string;
  name: string;
  description: string;
  vehicle_model: string;
  license_plate: string;
  image_urls?: string[];
  location_address: string;
  location_latitude: number;
  location_longitude: number;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  isAvailable: boolean;
  workshopId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Workshop Service
 * Handles all workshop-related API calls
 */
export class WorkshopService {
  private static instance: WorkshopService;
  private baseURL: string;

  private constructor() {
    this.baseURL = ENV.API_BASE_URL;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WorkshopService {
    if (!WorkshopService.instance) {
      WorkshopService.instance = new WorkshopService();
    }
    return WorkshopService.instance;
  }

  /**
   * Create axios instance with authorization
   */
  private createAxiosInstance() {
    const token = TokenManager.getToken();
    return axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  }

  /**
   * Get all workshops with filters
   */
  async getWorkshops(filters?: WorkshopFilters): Promise<WorkshopResponse> {
    const axiosInstance = this.createAxiosInstance();
    
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response: AxiosResponse<WorkshopResponse> = await axiosInstance.get(
      `/workshops?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Get workshop by ID
   */
  async getWorkshopById(id: string): Promise<{ success: boolean; message: string; data: { workshop: Workshop } }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.get(`/workshops/${id}`);
    // The backend returns data.workshop, so we need to restructure it
    const backendData = response.data;
    return {
      success: backendData.success,
      message: backendData.message,
      data: backendData.data.workshop
    };
  }

  /**
   * Get workshops by owner ID
   */
  async getWorkshopsByOwnerId(ownerId: string): Promise<{ success: boolean; message: string; data: Workshop[] }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.get(`/workshops/owner/${ownerId}`);
    // The backend returns workshops directly under data
    const backendData = response.data;
    return {
      success: backendData.success,
      message: backendData.message,
      data: backendData.data || []
    };
  }

  /**
   * Create a new workshop
   */
  async createWorkshop(workshopData: CreateWorkshopRequest): Promise<{ success: boolean; message: string; data: { workshop: Workshop } }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.post('/workshops', workshopData);
    return response.data;
  }

  /**
   * Update a workshop
   */
  async updateWorkshop(id: string, workshopData: Partial<CreateWorkshopRequest>): Promise<{ success: boolean; message: string; data: { workshop: Workshop } }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.put(`/workshops/${id}`, workshopData);
    return response.data;
  }

  /**
   * Delete a workshop
   */
  async deleteWorkshop(id: string): Promise<{ success: boolean; message: string }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.delete(`/workshops/${id}`);
    return response.data;
  }

  /**
   * Get detailed workshop information with services and reviews
   */
  async getWorkshopDetails(id: string): Promise<{ success: boolean; message: string; data: WorkshopDetails }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.get(`/workshops/${id}/details`);
    // The backend returns data directly, not data.workshop
    const backendData = response.data;
    return {
      success: backendData.success,
      message: backendData.message,
      data: backendData.data
    };
  }

  /**
   * Get services for a workshop
   */
  async getWorkshopServices(id: string): Promise<{ success: boolean; message: string; data: WorkshopServiceInterface[] }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.get(`/workshops/${id}/services`);
    return response.data;
  }

  /**
   * Add a service to a workshop (requires authentication)
   */
  async addWorkshopService(id: string, serviceData: CreateServiceRequest): Promise<{ success: boolean; message: string; data: WorkshopServiceInterface }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.post(`/workshops/${id}/services`, serviceData);
    return response.data;
  }

  /**
   * Get reviews for a workshop
   */
  async getWorkshopReviews(id: string): Promise<{ success: boolean; message: string; data: WorkshopReview[] }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.get(`/workshops/${id}/reviews`);
    return response.data;
  }

  /**
   * Add a review to a workshop (requires authentication)
   */
  async addWorkshopReview(id: string, reviewData: CreateReviewRequest): Promise<{ success: boolean; message: string; data: WorkshopReview }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.post(`/workshops/${id}/reviews`, reviewData);
    return response.data;
  }

  /**
   * Get workers associated with a workshop (requires authentication)
   */
  async getWorkshopWorkers(workshopId: string): Promise<{ success: boolean; message: string; data: Worker[] }> {
    const axiosInstance = this.createAxiosInstance();
    
    const response = await axiosInstance.get(`/workers/workshop/${workshopId}`);
    return response.data;
  }
}

// Export singleton instance
export const workshopService = WorkshopService.getInstance();
