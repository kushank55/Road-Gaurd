import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';
import { getRoleRedirectPath } from '@/lib/role.utils';

interface RoleRedirectProps {
  children?: ReactNode;
}

export function RoleRedirect({ children }: RoleRedirectProps) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  // If not authenticated, don't redirect
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If we're already on a role-specific route, don't redirect
  const currentPath = location.pathname;
  if (currentPath.startsWith('/dashboard') || 
      currentPath.startsWith('/workshops') || 
      currentPath.startsWith('/managerShopPanel') || 
      currentPath.startsWith('/mechanicShopPanel')) {
    return <>{children}</>;
  }

  // Redirect based on role
  const redirectPath = getRoleRedirectPath(role);
  return <Navigate to={redirectPath} replace />;
}
