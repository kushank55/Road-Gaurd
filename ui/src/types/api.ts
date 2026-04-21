import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// HTTP Methods
export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

// Generic API Response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  statusCode: number;
  timestamp?: string;
}

// Error response structure
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
  timestamp?: string;
}

// Request configuration extending AxiosRequestConfig
export interface ApiRequestConfig
  extends Omit<AxiosRequestConfig, "method" | "url"> {
  // Optional custom configurations
  skipAuthHeader?: boolean;
  customHeaders?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// API Service configuration
export interface ApiServiceConfig {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  enableInterceptors?: boolean;
}

// Request parameters for the main API function
export interface ApiCallParams<TData = any> {
  path: string;
  method: HttpMethod;
  data?: TData;
  params?: Record<string, any>;
  config?: ApiRequestConfig;
}

// Response type for API calls
export type ApiCallResponse<T = any> = Promise<ApiResponse<T>>;

// Interceptor types
export interface RequestInterceptor {
  onFulfilled?: (
    config: InternalAxiosRequestConfig
  ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  onRejected?: (error: any) => any;
}

export interface ResponseInterceptor {
  onFulfilled?: (
    response: AxiosResponse
  ) => AxiosResponse | Promise<AxiosResponse>;
  onRejected?: (error: any) => any;
}

// Common HTTP status codes
export const HttpStatusCode = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCodeType =
  (typeof HttpStatusCode)[keyof typeof HttpStatusCode];
