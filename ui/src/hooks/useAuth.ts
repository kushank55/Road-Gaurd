import { useCallback, useEffect } from "react";
import {
  useAuthStore,
  useAuthUser,
  useAuthToken as useStoreAuthToken,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useUserRole,
  useLoginAction,
  useSignupAction,
  useLogoutAction,
  useDeleteAccountAction,
  useClearErrorAction,
  useUpdateProfileAction,
  useCheckAuthStatusAction,
  useRequestEmailVerificationAction,
  useVerifyEmailAction,
  useResendEmailVerificationAction,
  useVerifyOtpAction,
  useResendOtpAction,
} from "../stores/auth.store";
import type {
  LoginRequest,
  SignupRequest,
  DeleteAccountRequest,
  User,
  UserRole,
} from "../types/auth";
import { TokenManager } from "../lib/token.utils";

/**
 * Main authentication hook
 * Provides comprehensive auth state and actions
 */
export const useAuth = () => {
  const user = useAuthUser();
  const token = useStoreAuthToken();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const role = useUserRole();
  
  // Individual action selectors to prevent infinite loops
  const login = useLoginAction();
  const signup = useSignupAction();
  const logout = useLogoutAction();
  const deleteAccount = useDeleteAccountAction();
  const clearError = useClearErrorAction();
  const updateProfile = useUpdateProfileAction();
  const checkAuthStatus = useCheckAuthStatusAction();
  const requestEmailVerification = useRequestEmailVerificationAction();
  const verifyEmail = useVerifyEmailAction();
  const resendEmailVerification = useResendEmailVerificationAction();
  const verifyOtp = useVerifyOtpAction();
  const resendOtp = useResendOtpAction();

  // Initialize auth check on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    role,
    
    // Actions
    login,
    signup,
    logout,
    deleteAccount,
    clearError,
    updateProfile,
    checkAuthStatus,
    requestEmailVerification,
    verifyEmail,
    resendEmailVerification,
    verifyOtp,
    resendOtp,
    
    // Utility methods
    hasRole: (roleToCheck: UserRole) => role === roleToCheck,
    hasAnyRole: (rolesToCheck: UserRole[]) => rolesToCheck.includes(role as UserRole),
    hasAllRoles: (rolesToCheck: UserRole[]) => rolesToCheck.includes(role as UserRole),
    isAdmin: role === "ADMIN",
    isMechanicOwner: role === "MECHANIC_OWNER",
    isMechanicEmployee: role === "MECHANIC_EMPLOYEE",
    isUser: role === "USER",
  };
};

/**
 * Hook for authentication status only
 * Lightweight hook for components that only need to know if user is authenticated
 */
export const useAuthStatus = () => {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const user = useAuthUser();

  return {
    isAuthenticated,
    isLoading,
    user,
    userId: user?.id || null,
  };
};

/**
 * Hook for user profile information
 */
export const useUserProfile = () => {
  const user = useAuthUser();
  const updateUserProfile = useUpdateProfileAction();
  const isLoading = useAuthLoading();

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      updateUserProfile(updates);
    },
    [updateUserProfile]
  );

  return {
    user,
    isLoading,
    updateProfile,
    
    // User info shortcuts
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "",
    is_verified: user?.is_verified || false,
  };
};

/**
 * Hook for token management
 */
export const useAuthTokens = () => {
  const token = useAuthStore((state) => state.token);
  const expiresAt = useAuthStore((state) => state.expiresAt);

  const getAuthHeader = useCallback(() => {
    return TokenManager.createAuthHeader(token || undefined);
  }, [token]);

  const isTokenValid = useCallback(() => {
    return token ? !TokenManager.isTokenExpired(token) : false;
  }, [token]);

  const getTimeUntilExpiration = useCallback(() => {
    return token ? TokenManager.getTimeUntilExpiration(token) : 0;
  }, [token]);

  return {
    token,
    expiresAt,
    bearerToken: getAuthHeader(),
    isValid: isTokenValid(),
    timeUntilExpiration: getTimeUntilExpiration(),
  };
};

/**
 * Hook for role-based access control
 */
export const usePermissions = () => {
  const role = useUserRole();

  const hasRole = useCallback(
    (roleToCheck: UserRole): boolean => {
      return role === roleToCheck;
    },
    [role]
  );

  const hasAnyRole = useCallback(
    (rolesToCheck: UserRole[]): boolean => {
      return rolesToCheck.includes(role as UserRole);
    },
    [role]
  );

  const hasAllRoles = useCallback(
    (rolesToCheck: UserRole[]): boolean => {
      return rolesToCheck.includes(role as UserRole);
    },
    [role]
  );

  const canAccess = useCallback(
    (requiredRoles: UserRole | UserRole[], requireAll: boolean = false): boolean => {
      if (!Array.isArray(requiredRoles)) {
        return hasRole(requiredRoles);
      }
      
      return requireAll ? hasAllRoles(requiredRoles) : hasAnyRole(requiredRoles);
    },
    [hasRole, hasAllRoles, hasAnyRole]
  );

  return {
    role,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,
    
    // Convenience boolean flags
    isAdmin: hasRole("ADMIN" as UserRole),
    isMechanicOwner: hasRole("MECHANIC_OWNER" as UserRole),
    isMechanicEmployee: hasRole("MECHANIC_EMPLOYEE" as UserRole),
    isUser: hasRole("USER" as UserRole),
  };
};

/**
 * Hook for authentication actions only
 */
export const useAuthActionsHook = () => {
  const login = useLoginAction();
  const signup = useSignupAction();
  const logout = useLogoutAction();
  const deleteAccount = useDeleteAccountAction();
  const clearError = useClearErrorAction();
  const updateProfile = useUpdateProfileAction();
  const checkAuthStatus = useCheckAuthStatusAction();
  
  return {
    login,
    signup,
    logout,
    deleteAccount,
    clearError,
    updateUserProfile: updateProfile,
    checkAuthStatus,
  };
};

/**
 * Hook for login functionality
 */
export const useLogin = () => {
  const login = useLoginAction();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  const loginUser = useCallback(
    async (credentials: LoginRequest) => {
      try {
        await login(credentials);
        return { success: true, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Login failed";
        return { success: false, error: errorMessage };
      }
    },
    [login]
  );

  return {
    login: loginUser,
    isLoading,
    error,
  };
};

/**
 * Hook for signup functionality
 */
export const useSignup = () => {
  const signup = useSignupAction();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  const signupUser = useCallback(
    async (data: SignupRequest) => {
      try {
        await signup(data);
        return { success: true, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Signup failed";
        return { success: false, error: errorMessage };
      }
    },
    [signup]
  );

  return {
    signup: signupUser,
    isLoading,
    error,
  };
};

/**
 * Hook for logout functionality
 */
export const useLogout = () => {
  const logout = useLogoutAction();

  const logoutUser = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    logout: logoutUser,
  };
};

/**
 * Hook for account deletion
 */
export const useDeleteAccount = () => {
  const deleteAccount = useDeleteAccountAction();
  const isLoading = useAuthLoading();
  const error = useAuthError();

  const deleteUserAccount = useCallback(
    async (data?: DeleteAccountRequest) => {
      try {
        await deleteAccount(data);
        return { success: true, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete account";
        return { success: false, error: errorMessage };
      }
    },
    [deleteAccount]
  );

  return {
    deleteAccount: deleteUserAccount,
    isLoading,
    error,
  };
};
