import axios from "axios";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "../types/api";
import { ENV } from "../config/auth.config";
import { TokenManager } from "../lib/token.utils";

// Worker interface
export interface Worker {
  id: string;
  workshop_id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string;
  specialization: string[];
  is_available: boolean;
  current_location_latitude: number | null;
  current_location_longitude: number | null;
  createdAt: string;
  updatedAt: string;
  workshop?: {
    id: string;
    name: string;
    address: string;
    contact_phone: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  };
}

export interface WorkerResponse {
  worker: Worker;
}

/**
 * Worker Service
 * Handles worker-related API calls
 */
export class WorkerService {
  private static instance: WorkerService;
  private baseURL: string;

  private constructor() {
    this.baseURL = `${ENV.API_BASE_URL}/api/workers`;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WorkerService {
    if (!WorkerService.instance) {
      WorkerService.instance = new WorkerService();
    }
    return WorkerService.instance;
  }

  /**
   * Create axios instance with base configuration
   */
  private createAxiosInstance() {
    const instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    instance.interceptors.request.use(
      (config) => {
        const token = TokenManager.getToken();
        if (token) {
          config.headers.Authorization = TokenManager.createAuthHeader(token);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle token expiration
        if (error.response?.status === 401) {
          TokenManager.clearTokens();
          window.location.href = "/login";
        }
        return Promise.reject(this.handleError(error));
      }
    );

    return instance;
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown): Error {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { status: number; data?: { message?: string } } };
      const { data } = axiosError.response;
      return new Error(data?.message || "An error occurred");
    }
    return new Error("Network error");
  }

  /**
   * Get worker details by user ID
   */
  async getWorkerByUserId(userId?: string): Promise<WorkerResponse> {
    try {
      const api = this.createAxiosInstance();
      const endpoint = userId ? `/user/${userId}` : '/user';
      const response: AxiosResponse<ApiResponse<WorkerResponse>> = await api.get(endpoint);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to fetch worker details");
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update worker availability
   */
  async updateAvailability(workerId: string, isAvailable: boolean): Promise<void> {
    try {
      const api = this.createAxiosInstance();
      const response: AxiosResponse<ApiResponse<void>> = await api.patch(
        `/${workerId}/availability`,
        { is_available: isAvailable }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update availability");
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update worker location
   */
  async updateLocation(workerId: string, latitude: number, longitude: number): Promise<void> {
    try {
      const api = this.createAxiosInstance();
      const response: AxiosResponse<ApiResponse<void>> = await api.patch(
        `/${workerId}/location`,
        { 
          current_location_latitude: latitude,
          current_location_longitude: longitude
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update location");
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Export singleton instance
export const workerService = WorkerService.getInstance();
