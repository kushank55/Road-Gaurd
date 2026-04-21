import { Request } from 'express';

// User role enum
export enum UserRole {
  ADMIN = 'ADMIN',
  MECHANIC_OWNER = 'MECHANIC_OWNER',
  MECHANIC_EMPLOYEE = 'MECHANIC_EMPLOYEE',
  USER = 'USER'
}

// User interface
export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  is_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User creation payload
export interface ICreateUser {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  workshop_id?: string; // Optional workshop selection for mechanics
}

// User login payload
export interface ILoginUser {
  identifier: string;
  password: string;
}

// OTP interface
export interface IOtp {
  id: string;
  user_id: string | null; // Nullable for pre-registration verification
  email: string; // Add email field for pre-registration verification
  otp_code: string;
  purpose: 'VERIFICATION' | 'PASSWORD_RESET' | 'EMAIL_VERIFICATION';
  expires_at: Date;
  is_used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// JWT Payload
export interface IJwtPayload {
  userId: string;
  email: string;
  phone: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// API Response interface
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  stack?: string;
}

// Extended Request interface with user
export interface IAuthenticatedRequest extends Request {
  user?: IJwtPayload;
}

// Workshop interface
export interface IWorkshop {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  status: 'OPEN' | 'CLOSED';
  rating: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Workshop creation payload
export interface ICreateWorkshop {
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  status?: 'OPEN' | 'CLOSED';
}

// Workshop update payload
export interface IUpdateWorkshop {
  name?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  status?: 'OPEN' | 'CLOSED';
}

// Workshop query filters
export interface IWorkshopFilters {
  status?: 'OPEN' | 'CLOSED';
  latitude?: number;
  longitude?: number;
  radius?: number;
  search?: string;
  sort?: 'nearest' | 'mostRated' | 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

// Service interface
export interface IService {
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
  createdAt: Date;
  updatedAt: Date;
}

// Service creation payload
export interface ICreateService {
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

// Service Request Status Enum
export enum ServiceRequestStatus {
  PENDING = 'PENDING',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Service Request Priority Enum
export enum ServiceRequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Service Request Type Enum
export enum ServiceRequestType {
  INSTANT_SERVICE = 'INSTANT_SERVICE',
  PRE_BOOK_SLOTS = 'PRE_BOOK_SLOTS'
}

// Service Request interface
export interface IServiceRequest {
  id: string;
  user_id: string;
  workshop_id: string | null;
  name: string;
  description: string;
  service_type: ServiceRequestType;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  scheduled_start_time: Date | null;
  scheduled_end_time: Date | null;
  issue_description: string;
  image_urls: string[];
  assigned_worker_id: string | null;
  estimated_completion: Date | null;
  actual_completion: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Service Request creation payload
export interface ICreateServiceRequest {
  name: string;
  description: string;
  service_type: ServiceRequestType;
  priority?: ServiceRequestPriority;
  location_address: string;
  location_latitude: number;
  location_longitude: number;
  scheduled_start_time?: Date;
  scheduled_end_time?: Date;
  issue_description: string;
  image_urls?: string[];
  workshop_id?: string;
  assigned_worker_id?: string;
}

// Service Request update payload
export interface IUpdateServiceRequest {
  status?: ServiceRequestStatus;
  workshop_id?: string;
  assigned_worker_id?: string;
  estimated_completion?: Date;
  actual_completion?: Date;
}

// Quotation interface
export interface IQuotation {
  id: string;
  service_request_id: string;
  workshop_id: string;
  service_charges: number;
  variable_cost: number;
  spare_parts_cost: number;
  total_amount: number;
  notes: string | null;
  valid_until: Date;
  is_accepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Quotation creation payload
export interface ICreateQuotation {
  service_charges: number;
  variable_cost: number;
  spare_parts_cost: number;
  notes?: string;
  valid_until: Date;
}

// Worker interface (for workshop employees)
export interface IWorker {
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
  createdAt: Date;
  updatedAt: Date;
}

// Worker creation payload
export interface ICreateWorker {
  user_id: string;
  name: string;
  phone: string;
  email: string;
  specialization: string[];
}

// Service Request Filters
export interface IServiceRequestFilters {
  status?: ServiceRequestStatus;
  service_type?: ServiceRequestType;
  priority?: ServiceRequestPriority;
  workshop_id?: string;
  user_id?: string;
  assigned_worker_id?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}

// Review interface
export interface IReview {
  id: string;
  workshop_id: string;
  user_id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// Review creation payload
export interface ICreateReview {
  rating: number;
  comment: string;
}

// Database connection config
export interface IDatabaseConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: 'postgres';
  logging: boolean;
}

// Environment variables
export interface IEnvConfig {
  NODE_ENV: string;
  PORT: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
}
