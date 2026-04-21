import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Initializes authentication state and provides auth context
 * Note: This is optional since we're using Zustand for state management
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    // Initialize auth state on app start
    checkAuthStatus();
  }, [checkAuthStatus]);

  return <>{children}</>;
};

/**
 * Protected Route Component
 * Wraps components that require authentication
 */
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  roles?: string[];
  requireAll?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <div>Please log in to access this page.</div>,
  roles,
  requireAll = false,
}) => {
  const { isAuthenticated, hasAnyRole, hasAllRoles, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (roles) {
    const hasRequiredRoles = requireAll ? hasAllRoles(roles as any) : hasAnyRole(roles as any);
    if (!hasRequiredRoles) {
      return <div>You don't have permission to access this page.</div>;
    }
  }

  return <>{children}</>;
};

/**
 * Public Route Component  
 * Wraps components that should only be accessible to non-authenticated users
 */
interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    // In a real app, you would use your router's redirect mechanism
    // This is just an example
    window.location.href = redirectTo;
    return null;
  }

  return <>{children}</>;
};
