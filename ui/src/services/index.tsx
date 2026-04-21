import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import type {
  ApiCallParams,
  ApiCallResponse,
  ApiResponse,
  ApiError,
  ApiServiceConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from '../types/api';

class ApiService {
  private axiosInstance: AxiosInstance;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(config: ApiServiceConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
    });

    if (config.enableInterceptors !== false) {
      this.setupInterceptors();
    }
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token && !config.headers?.skipAuthHeader) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp (using a custom property)
        (config as any).startTime = Date.now();
        
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('🚫 Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = Date.now() - (response.config as any).startTime;
        console.log(`✅ API Response: ${response.status} (${duration}ms)`);
        return response;
      },
      async (error: AxiosError) => {
        const duration = Date.now() - (error.config as any)?.startTime;
        console.error(`❌ API Error: ${error.response?.status} (${duration}ms)`);
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }
    return null;
  }

  /**
   * Handle unauthorized responses
   */
  private handleUnauthorized(): void {
    // Clear tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
    
    // Redirect to login or trigger auth refresh
    // This can be customized based on your auth flow
    console.warn('🔐 Unauthorized access - tokens cleared');
  }

  /**
   * Format axios error into ApiError
   */
  private formatError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };

    if (error.response) {
      // Server responded with error status
      apiError.statusCode = error.response.status;
      apiError.message = (error.response.data as any)?.message || error.message;
      apiError.details = error.response.data;
      
      // Handle specific CORS errors
      if (error.response.status === 0 || error.message.includes('CORS')) {
        apiError.message = 'CORS error: Unable to connect to the server. Please check your network connection and server configuration.';
        apiError.statusCode = 0;
      }
    } else if (error.request) {
      // Request was made but no response received
      apiError.message = 'Network error - please check your connection and ensure the server is running';
      apiError.statusCode = 0;
    } else {
      // Something else happened
      apiError.message = error.message;
      
      // Handle CORS-related errors
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        apiError.message = 'CORS error: Cross-origin request blocked. Please check server CORS configuration.';
        apiError.statusCode = 0;
      }
    }

    return apiError;
  }

  /**
   * Retry mechanism for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries: number = this.retryAttempts
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as AxiosError)) {
        console.log(`🔄 Retrying request... (${this.retryAttempts - retries + 1}/${this.retryAttempts})`);
        await this.delay(this.retryDelay);
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    if (!error.response) return true; // Network error
    
    const status = error.response.status;
    return status >= 500 || status === 408 || status === 429;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main API call method
   */
  async apiCall<TResponse = any, TData = any>({
    path,
    method,
    data,
    params,
    config = {},
  }: ApiCallParams<TData>): ApiCallResponse<TResponse> {
    try {
      const response = await this.retryRequest<ApiResponse<TResponse>>(() =>
        this.axiosInstance.request({
          url: path,
          method,
          data,
          params,
          ...config,
          headers: {
            ...config.headers,
            ...config.customHeaders,
          },
        })
      );

      // Return standardized response
      const responseData = response.data;
      return {
        data: (responseData as any).data !== undefined ? (responseData as any).data : responseData,
        message: (responseData as any).message,
        success: true,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const apiError = error as ApiError;
      throw apiError;
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T = any>(path: string, params?: any, config?: any): ApiCallResponse<T> {
    return this.apiCall<T>({ path, method: 'GET', params, config });
  }

  async post<T = any, D = any>(path: string, data?: D, config?: any): ApiCallResponse<T> {
    return this.apiCall<T, D>({ path, method: 'POST', data, config });
  }

  async put<T = any, D = any>(path: string, data?: D, config?: any): ApiCallResponse<T> {
    return this.apiCall<T, D>({ path, method: 'PUT', data, config });
  }

  async patch<T = any, D = any>(path: string, data?: D, config?: any): ApiCallResponse<T> {
    return this.apiCall<T, D>({ path, method: 'PATCH', data, config });
  }

  async delete<T = any>(path: string, config?: any): ApiCallResponse<T> {
    return this.apiCall<T>({ path, method: 'DELETE', config });
  }

  /**
   * Upload file
   */
  async uploadFile<T = any>(
    path: string,
    file: File,
    onUploadProgress?: (progress: number) => void
  ): ApiCallResponse<T> {
    const formData = new FormData();
    formData.append('file', file);

    return this.apiCall<T, FormData>({
      path,
      method: 'POST',
      data: formData,
      config: {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(progress);
          }
        },
      },
    });
  }

  /**
   * Download file
   */
  async downloadFile(path: string, filename?: string): Promise<void> {
    try {
      const response = await this.axiosInstance.get(path, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use provided filename
      const contentDisposition = response.headers['content-disposition'];
      const headerFilename = contentDisposition?.match(/filename="?(.+)"?/)?.[1];
      
      link.setAttribute('download', filename || headerFilename || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw this.formatError(error as AxiosError);
    }
  }

  /**
   * Add custom request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    return this.axiosInstance.interceptors.request.use(
      interceptor.onFulfilled,
      interceptor.onRejected
    );
  }

  /**
   * Add custom response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): number {
    return this.axiosInstance.interceptors.response.use(
      interceptor.onFulfilled,
      interceptor.onRejected
    );
  }

  /**
   * Remove interceptor
   */
  removeRequestInterceptor(interceptorId: number): void {
    this.axiosInstance.interceptors.request.eject(interceptorId);
  }

  removeResponseInterceptor(interceptorId: number): void {
    this.axiosInstance.interceptors.response.eject(interceptorId);
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string, persistent: boolean = false): void {
    if (typeof window !== 'undefined') {
      if (persistent) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('authToken', token);
      }
    }
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
  }

  /**
   * Update base URL
   */
  setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  /**
   * Get current base URL
   */
  getBaseURL(): string | undefined {
    return this.axiosInstance.defaults.baseURL;
  }
}

// Create and export API service instance
const apiConfig: ApiServiceConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  defaultHeaders: {
    'Accept': 'application/json',
  },
  enableInterceptors: true,
};

export const apiService = new ApiService(apiConfig);

// Export the class for creating custom instances
export { ApiService };
export type { ApiServiceConfig, ApiCallParams, ApiCallResponse };

// Export utility functions for direct use
export const api = {
  get: <T = any>(path: string, params?: any, config?: any) => 
    apiService.get<T>(path, params, config),
  
  post: <T = any, D = any>(path: string, data?: D, config?: any) => 
    apiService.post<T, D>(path, data, config),
  
  put: <T = any, D = any>(path: string, data?: D, config?: any) => 
    apiService.put<T, D>(path, data, config),
  
  patch: <T = any, D = any>(path: string, data?: D, config?: any) => 
    apiService.patch<T, D>(path, data, config),
  
  delete: <T = any>(path: string, config?: any) => 
    apiService.delete<T>(path, config),
  
  upload: <T = any>(path: string, file: File, onProgress?: (progress: number) => void) => 
    apiService.uploadFile<T>(path, file, onProgress),
  
  download: (path: string, filename?: string) => 
    apiService.downloadFile(path, filename),
};

// Default export
export default apiService;

// Export auth service
export { authService } from './auth.service';

// Export translation service
export { translationService } from './translation.service';

// Export workshop service
export { workshopService } from './workshop.service';

// Export service request service
export { serviceRequestService } from './serviceRequest.service';