/**
 * Theme utility functions and helpers
 */

import type { Theme } from '@/types/theme';

/**
 * Check if a theme value is valid
 */
export function isValidTheme(theme: string): theme is Theme {
  return ['light', 'dark', 'system'].includes(theme);
}

/**
 * Get theme-aware CSS classes based on current theme
 */
export function getThemeClasses(resolvedTheme: 'light' | 'dark') {
  return {
    // Background variations
    surface: resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white',
    elevated: resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50',
    
    // Text variations
    primary: resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900',
    secondary: resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600',
    muted: resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    
    // Border variations
    border: resolvedTheme === 'dark' ? 'border-gray-600' : 'border-gray-200',
    subtle: resolvedTheme === 'dark' ? 'border-gray-700' : 'border-gray-100',
    
    // Interactive states
    hover: resolvedTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    active: resolvedTheme === 'dark' ? 'active:bg-gray-600' : 'active:bg-gray-100',
  };
}

/**
 * Get theme preference from various sources
 */
export function getThemePreference(): Theme {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('roadguard-theme');
    if (stored && isValidTheme(stored)) {
      return stored;
    }
  }
  
  // Fallback to system
  return 'system';
}

/**
 * Apply theme to document root
 */
export function applyTheme(resolvedTheme: 'light' | 'dark') {
  if (typeof window === 'undefined') return;
  
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Create a media query listener for system theme changes
 */
export function createThemeMediaQuery(callback: (theme: 'light' | 'dark') => void) {
  if (typeof window === 'undefined') return { remove: () => {} };
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return {
    remove: () => mediaQuery.removeEventListener('change', handleChange),
  };
}

/**
 * Theme-aware CSS variable helpers
 */
export const themeVars = {
  // Get CSS custom property value
  get: (property: string) => {
    if (typeof window === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(property);
  },
  
  // Set CSS custom property
  set: (property: string, value: string) => {
    if (typeof window === 'undefined') return;
    document.documentElement.style.setProperty(property, value);
  },
  
  // Remove CSS custom property
  remove: (property: string) => {
    if (typeof window === 'undefined') return;
    document.documentElement.style.removeProperty(property);
  },
};
