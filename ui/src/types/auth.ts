import type { BaseEntity, ID } from "./common";

// User roles - matching backend UserRole enum
export const UserRole = {
  ADMIN: "ADMIN",
  MECHANIC_OWNER: "MECHANIC_OWNER", 
  MECHANIC_EMPLOYEE: "MECHANIC_EMPLOYEE",
  USER: "USER",
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// User interface
export interface User extends BaseEntity {
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  is_verified: boolean;
  // Removed lastLoginAt, avatar, isActive as they don't exist in backend
}

// Authentication request DTOs
export interface LoginRequest {
  identifier: string; // Changed from email to identifier to match backend
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: UserRole; // Made optional to match backend
  workshop_id?: string; // Optional workshop selection for mechanics
}

// Email verification request DTOs
export interface RequestEmailVerificationRequest {
  email: string;
  name: string;
}

export interface VerifyEmailRequest {
  email: string;
  otpCode: string;
}

export interface ResendEmailVerificationRequest {
  email: string;
  name: string;
}

export interface VerifyOtpRequest {
  identifier: string;
  otpCode: string;
}

export interface ResendOtpRequest {
  identifier: string;
}

export interface DeleteAccountRequest {
  password?: string;
  reason?: string;
}

// Worker interface for mechanic users
export interface Worker {
  id: string;
  workshop_id: string;
  specialization: string[];
  is_available: boolean;
}

// Authentication response DTOs
export interface AuthResponse {
  user: User;
  token: string;
  worker?: Worker; // Optional worker data for mechanic users
  // Removed refreshToken and expiresAt as backend doesn't provide them
}

// Auth store state interface
export interface AuthState {
  user: User | null;
  token: string | null;
  worker: Worker | null; // Worker data for mechanic users
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  expiresAt: string | null;
}

// Auth store actions interface
export interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  deleteAccount: (data?: DeleteAccountRequest) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  // Email verification methods
  requestEmailVerification: (data: RequestEmailVerificationRequest) => Promise<void>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
  resendEmailVerification: (data: ResendEmailVerificationRequest) => Promise<void>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<void>;
  resendOtp: (data: ResendOtpRequest) => Promise<void>;
}

// Combined auth store interface
export interface AuthStore extends AuthState, AuthActions {}

// Auth context interface for React Context (alternative to Zustand)
export type AuthContextType = AuthStore

// Permission types
export type Permission = 
  | "read"
  | "write"
  | "delete"
  | "admin"
  | "moderate"
  | "manage_users"
  | "manage_content";

export interface UserPermissions {
  [key: string]: Permission[];
}

// Token payload interface (for JWT decoding)
export interface TokenPayload {
  sub?: ID; // user id (frontend format)
  userId?: string; // user id (backend format)
  email: string;
  phone: string;
  role: UserRole;
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}

// Auth error types
export const AuthErrorType = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type AuthErrorType = typeof AuthErrorType[keyof typeof AuthErrorType];

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: unknown;
}

// Auth configuration
export interface AuthConfig {
  tokenStorageKey: string;
  tokenExpirationBuffer: number; // in minutes
  autoRefreshEnabled: boolean;
  persistAuth: boolean;
}
