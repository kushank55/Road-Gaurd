import type { UserRole } from '@/types/auth';

/**
 * Get the appropriate redirect path based on user role
 */
export const getRoleRedirectPath = (role: UserRole | string | null | undefined): string => {
  switch (role) {
    case 'ADMIN':
      return '/dashboard';
    case 'MECHANIC_OWNER':
      return '/managerShopPanel';
    case 'MECHANIC_EMPLOYEE':
      return '/mechanicShopPanel';
    case 'USER':
      return '/workshops';
    default:
      return '/workshops'; // Default to client view
  }
};

/**
 * Check if a user has access to a specific route
 */
export const hasRouteAccess = (userRole: UserRole | string | null | undefined, requiredRoles: UserRole[]): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as UserRole);
};

/**
 * Get route permissions for different user roles
 */
export const ROUTE_PERMISSIONS = {
  '/dashboard': ['ADMIN'],
  '/managerShopPanel': ['MECHANIC_OWNER'],
  '/mechanicShopPanel': ['MECHANIC_EMPLOYEE'],
  '/workshops': ['USER', 'ADMIN', 'MECHANIC_OWNER', 'MECHANIC_EMPLOYEE'], // All authenticated users can view workshops
  '/workshops/shop/:shopId': ['USER', 'ADMIN', 'MECHANIC_OWNER', 'MECHANIC_EMPLOYEE'],
} as const;

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (userRole: UserRole | string | null | undefined, route: string): boolean => {
  if (!userRole) return false;
  
  // Check exact route match first
  if (ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS]) {
    return hasRouteAccess(userRole, [...ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS]]);
  }
  
  // Check pattern matches (for dynamic routes)
  for (const [pattern, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route.startsWith(pattern.replace(/:[^/]+/g, ''))) {
      return hasRouteAccess(userRole, [...allowedRoles]);
    }
  }
  
  return false;
};

/**
 * Get user-friendly role display names
 */
export const getRoleDisplayName = (role: UserRole | string | null | undefined): string => {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'MECHANIC_OWNER':
      return 'Shop Manager';
    case 'MECHANIC_EMPLOYEE':
      return 'Mechanic';
    case 'USER':
      return 'Customer';
    default:
      return 'Unknown';
  }
};

/**
 * Get role priority for sorting (higher number = higher priority)
 */
export const getRolePriority = (role: UserRole | string | null | undefined): number => {
  switch (role) {
    case 'ADMIN':
      return 4;
    case 'MECHANIC_OWNER':
      return 3;
    case 'MECHANIC_EMPLOYEE':
      return 2;
    case 'USER':
      return 1;
    default:
      return 0;
  }
};
