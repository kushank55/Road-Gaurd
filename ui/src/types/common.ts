// Common utility types used across the application

// Generic types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Object utility types
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ID types
export type ID = string | number;
export type UUID = string;

// Common entity structure
export interface BaseEntity {
  id: ID;
  createdAt: string;
  updatedAt: string;
}

// Generic CRUD operations
export interface CrudOperations<
  T,
  TCreate = Omit<T, keyof BaseEntity>,
  TUpdate = Partial<TCreate>
> {
  create: (data: TCreate) => Promise<T>;
  read: (id: ID) => Promise<T>;
  update: (id: ID, data: TUpdate) => Promise<T>;
  delete: (id: ID) => Promise<void>;
  list: (params?: any) => Promise<T[]>;
}

// Form types
export interface FormField {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  required?: boolean;
}

export interface FormState<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Loading and error states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Environment types
export type Environment = "development" | "production" | "test" | "staging";
