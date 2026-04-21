import { useThemeContext } from '@/contexts/ThemeProvider';

/**
 * Custom hook for managing application theme
 * 
 * @returns {Object} Theme utilities and state
 * @returns {Theme} theme - Current theme setting ('light' | 'dark' | 'system')
 * @returns {'light' | 'dark'} resolvedTheme - Actual applied theme (resolves 'system' to 'light' or 'dark')
 * @returns {'light' | 'dark'} systemTheme - Current system theme preference
 * @returns {(theme: Theme) => void} setTheme - Function to set the theme
 * @returns {() => void} toggleTheme - Function to toggle between themes
 * @returns {() => 'light' | 'dark'} getSystemTheme - Function to get current system theme
 * @returns {boolean} mounted - Whether the component has mounted (useful for SSR)
 * 
 * @example
 * ```tsx
 * const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
 * 
 * // Set specific theme
 * setTheme('dark');
 * 
 * // Toggle theme
 * toggleTheme();
 * 
 * // Check current resolved theme
 * if (resolvedTheme === 'dark') {
 *   // Dark theme is active
 * }
 * ```
 */
export function useTheme() {
  return useThemeContext();
}

/**
 * Lightweight hook that only returns the current resolved theme
 * Use this when you only need to know if the current theme is light or dark
 * 
 * @returns {'light' | 'dark'} The current resolved theme
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const { resolvedTheme } = useThemeContext();
  return resolvedTheme;
}

/**
 * Hook that returns whether dark mode is currently active
 * 
 * @returns {boolean} True if dark mode is active
 */
export function useIsDark(): boolean {
  const { resolvedTheme } = useThemeContext();
  return resolvedTheme === 'dark';
}

/**
 * Hook that returns whether light mode is currently active
 * 
 * @returns {boolean} True if light mode is active
 */
export function useIsLight(): boolean {
  const { resolvedTheme } = useThemeContext();
  return resolvedTheme === 'light';
}
