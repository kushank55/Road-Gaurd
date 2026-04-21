import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AuthStore,
  AuthState,
  LoginRequest,
  SignupRequest,
  DeleteAccountRequest,
  User,
  RequestEmailVerificationRequest,
  VerifyEmailRequest,
  ResendEmailVerificationRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
} from "../types/auth";
import { authService } from "../services/auth.service";
import { TokenManager, AuthStorage } from "../lib/token.utils";

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  worker: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  expiresAt: null,
};

/**
 * Zustand store for authentication state management
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const authResponse = await authService.login(credentials);

          set({
            user: authResponse.user,
            token: authResponse.token,
            worker: authResponse.worker || null,
            expiresAt: null, // Backend doesn't provide expiresAt
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Save user data to storage
          AuthStorage.saveUserData(authResponse.user);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Login failed";
          set({
            user: null,
            token: null,
            worker: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      signup: async (data: SignupRequest) => {
        set({ isLoading: true, error: null });

        try {
          const authResponse = await authService.signup(data);

          set({
            user: authResponse.user,
            token: authResponse.token,
            worker: authResponse.worker || null,
            expiresAt: null, // Backend doesn't provide expiresAt
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Save user data to storage
          AuthStorage.saveUserData(authResponse.user);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Signup failed";
          set({
            user: null,
            token: null,
            worker: null,
            expiresAt: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call backend logout
          await authService.logout();
        } catch (error) {
          console.error("Logout error:", error);
          // Continue with local cleanup even if backend fails
        } finally {
          // Clear local state and storage
          set({
            ...initialState,
          });
          TokenManager.clearTokens();
          AuthStorage.clearAll();
        }
      },

      deleteAccount: async (data?: DeleteAccountRequest) => {
        set({ isLoading: true, error: null });

        try {
          await authService.deleteAccount(data);

          // Clear state after successful deletion
          set({
            ...initialState,
          });

          // Clear storage
          TokenManager.clearTokens();
          AuthStorage.clearAll();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to delete account";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuthStatus: () => {
        try {
          const token = TokenManager.getToken();
          const userData = AuthStorage.getUserData() as User | null;

          if (token && !TokenManager.isTokenExpired(token)) {
            // Token is valid
            set({
              user: userData,
              token,
              isAuthenticated: true,
              error: null,
            });
          } else {
            // No valid token, ensure clean state
            get().logout();
          }
        } catch (error) {
          console.error("Error checking auth status:", error);
          get().logout();
        }
      },

      updateUserProfile: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ user: updatedUser });
          AuthStorage.saveUserData(updatedUser);
        }
      },

      // Email verification methods
      requestEmailVerification: async (data: RequestEmailVerificationRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authService.requestEmailVerification(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to request email verification";
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      verifyEmail: async (data: VerifyEmailRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authService.verifyEmail(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to verify email";
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      resendEmailVerification: async (data: ResendEmailVerificationRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resendEmailVerification(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to resend email verification";
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      verifyOtp: async (data: VerifyOtpRequest) => {
        set({ isLoading: true, error: null });
        try {
          const authResponse = await authService.verifyOtp(data);
          set({
            user: authResponse.user,
            token: authResponse.token,
            expiresAt: null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          AuthStorage.saveUserData(authResponse.user);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to verify OTP";
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      resendOtp: async (data: ResendOtpRequest) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resendOtp(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to resend OTP";
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Check auth status after hydration
        if (state) {
          state.checkAuthStatus();
        }
      },
    }
  )
);

// Selectors for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Fixed: Cache the empty string to prevent infinite re-renders
const EMPTY_ROLE = "";
export const useUserRole = () =>
  useAuthStore((state) => state.user?.role ?? EMPTY_ROLE);

// Separate action selectors to avoid creating new objects on every render
export const useLoginAction = () => useAuthStore((state) => state.login);
export const useSignupAction = () => useAuthStore((state) => state.signup);
export const useLogoutAction = () => useAuthStore((state) => state.logout);
export const useDeleteAccountAction = () =>
  useAuthStore((state) => state.deleteAccount);
export const useClearErrorAction = () =>
  useAuthStore((state) => state.clearError);
export const useSetLoadingAction = () =>
  useAuthStore((state) => state.setLoading);
export const useCheckAuthStatusAction = () =>
  useAuthStore((state) => state.checkAuthStatus);
export const useUpdateProfileAction = () =>
  useAuthStore((state) => state.updateUserProfile);

// Email verification action selectors
export const useRequestEmailVerificationAction = () =>
  useAuthStore((state) => state.requestEmailVerification);
export const useVerifyEmailAction = () =>
  useAuthStore((state) => state.verifyEmail);
export const useResendEmailVerificationAction = () =>
  useAuthStore((state) => state.resendEmailVerification);
export const useVerifyOtpAction = () =>
  useAuthStore((state) => state.verifyOtp);
export const useResendOtpAction = () =>
  useAuthStore((state) => state.resendOtp);

// Legacy action selectors - use individual selectors above for better performance
export const useAuthActions = () => {
  const login = useLoginAction();
  const signup = useSignupAction();
  const logout = useLogoutAction();
  const deleteAccount = useDeleteAccountAction();
  const clearError = useClearErrorAction();
  const setLoading = useSetLoadingAction();
  const checkAuthStatus = useCheckAuthStatusAction();
  const updateUserProfile = useUpdateProfileAction();
  const requestEmailVerification = useRequestEmailVerificationAction();
  const verifyEmail = useVerifyEmailAction();
  const resendEmailVerification = useResendEmailVerificationAction();
  const verifyOtp = useVerifyOtpAction();
  const resendOtp = useResendOtpAction();

  return {
    login,
    signup,
    logout,
    deleteAccount,
    clearError,
    setLoading,
    checkAuthStatus,
    updateUserProfile,
    requestEmailVerification,
    verifyEmail,
    resendEmailVerification,
    verifyOtp,
    resendOtp,
  };
};
