import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';
import type { UserRole } from '@/types/auth';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = "/unauthorized" 
}: RoleBasedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user doesn't have the required role, redirect to fallback
  if (!role || !allowedRoles.includes(role as UserRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminRoute({ children, fallbackPath }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return (
    <RoleBasedRoute allowedRoles={['ADMIN']} fallbackPath={fallbackPath}>
      {children}
    </RoleBasedRoute>
  );
}

export function MechanicOwnerRoute({ children, fallbackPath }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return (
    <RoleBasedRoute allowedRoles={['MECHANIC_OWNER']} fallbackPath={fallbackPath}>
      {children}
    </RoleBasedRoute>
  );
}

export function MechanicEmployeeRoute({ children, fallbackPath }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return (
    <RoleBasedRoute allowedRoles={['MECHANIC_EMPLOYEE']} fallbackPath={fallbackPath}>
      {children}
    </RoleBasedRoute>
  );
}

export function UserRoute({ children, fallbackPath }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return (
    <RoleBasedRoute allowedRoles={['USER']} fallbackPath={fallbackPath}>
      {children}
    </RoleBasedRoute>
  );
}

export function ClientRoute({ children, fallbackPath }: Omit<RoleBasedRouteProps, 'allowedRoles'>) {
  return (
    <RoleBasedRoute allowedRoles={['USER']} fallbackPath={fallbackPath}>
      {children}
    </RoleBasedRoute>
  );
}
