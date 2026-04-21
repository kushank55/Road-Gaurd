import Cookies from "js-cookie";
import type { TokenPayload } from "../types/auth";
import { STORAGE_KEYS, COOKIE_CONFIG, TOKEN_CONFIG } from "../config/auth.config";

/**
 * Utility class for handling authentication tokens
 */
export class TokenManager {
  /**
   * Set authentication token in storage
   */
  static setToken(token: string, refreshToken?: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      Cookies.set(COOKIE_CONFIG.TOKEN_COOKIE_NAME, token, {
        ...COOKIE_CONFIG.DEFAULT_OPTIONS,
        expires: 7, // 7 days
      });

      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (error) {
      console.error("Failed to store token:", error);
    }
  }

  /**
   * Get authentication token from storage
   */
  static getToken(): string | null {
    try {
      // Try localStorage first, then cookies
      return (
        localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
        Cookies.get(COOKIE_CONFIG.TOKEN_COOKIE_NAME) ||
        null
      );
    } catch (error) {
      console.error("Failed to retrieve token:", error);
      return null;
    }
  }

  /**
   * Set refresh token in storage
   */
  static setRefreshToken(refreshToken: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error("Failed to store refresh token:", error);
    }
  }

  /**
   * Get refresh token from storage
   */
  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Failed to retrieve refresh token:", error);
      return null;
    }
  }

  /**
   * Remove all tokens from storage
   */
  static clearTokens(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
      
      Cookies.remove(COOKIE_CONFIG.TOKEN_COOKIE_NAME, {
        path: COOKIE_CONFIG.DEFAULT_OPTIONS.path,
      });
    } catch (error) {
      console.error("Failed to clear tokens:", error);
    }
  }

  /**
   * Check if token exists
   */
  static hasToken(): boolean {
    return Boolean(this.getToken());
  }

  /**
   * Decode JWT token (simple base64 decode - for payload extraction only)
   * Note: This is NOT for verification, only for extracting payload data
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded) as TokenPayload;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error("Failed to check token expiration:", error);
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  static getTokenExpirationTime(token: string): Date | null {
    try {
      const payload = this.decodeToken(token);
      if (!payload) return null;

      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error("Failed to get token expiration time:", error);
      return null;
    }
  }

  /**
   * Create Authorization header value
   */
  static createAuthHeader(token?: string): string | null {
    const authToken = token || this.getToken();
    return authToken ? `${TOKEN_CONFIG.BEARER_PREFIX}${authToken}` : null;
  }

  /**
   * Extract user data from token
   */
  static getUserFromToken(token?: string): Partial<TokenPayload> | null {
    const authToken = token || this.getToken();
    if (!authToken) return null;

    const payload = this.decodeToken(authToken);
    if (!payload) return null;

    // Handle both backend format (userId) and frontend format (sub)
    const userId = payload.sub || payload.userId;

    return {
      sub: userId,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
    };
  }

  /**
   * Check if current token is valid (exists and not expired)
   */
  static isCurrentTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  static getTimeUntilExpiration(token?: string): number {
    const authToken = token || this.getToken();
    if (!authToken) return 0;

    const expirationTime = this.getTokenExpirationTime(authToken);
    if (!expirationTime) return 0;

    return Math.max(0, expirationTime.getTime() - Date.now());
  }
}

/**
 * Storage utility for persisting auth state
 */
export class AuthStorage {
  /**
   * Save user data to storage
   */
  static saveUserData(userData: unknown): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  }

  /**
   * Get user data from storage
   */
  static getUserData(): unknown | null {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to retrieve user data:", error);
      return null;
    }
  }

  /**
   * Save auth state to storage
   */
  static saveAuthState(state: unknown): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save auth state:", error);
    }
  }

  /**
   * Get auth state from storage
   */
  static getAuthState(): unknown | null {
    try {
      const state = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error("Failed to retrieve auth state:", error);
      return null;
    }
  }

  /**
   * Clear all stored data
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }
}
