import React, { createContext, useContext, useEffect, useState } from 'react';
import { useThemeStore } from '@/stores/theme.store';
import type { ThemeContextType, Theme } from '@/types/theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    toggleTheme,
    getSystemTheme,
  } = useThemeStore();

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      
      // Update system theme in store
      useThemeStore.setState({ systemTheme: newSystemTheme });
      
      // If current theme is system, update resolved theme
      if (theme === 'system') {
        const newResolvedTheme = newSystemTheme;
        useThemeStore.setState({ resolvedTheme: newResolvedTheme });
        
        // Update document class
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newResolvedTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Set mounted to true after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    if (mounted) {
      const currentSystemTheme = getSystemTheme();
      useThemeStore.setState({ systemTheme: currentSystemTheme });
      
      if (theme === 'system') {
        const newResolvedTheme = currentSystemTheme;
        useThemeStore.setState({ resolvedTheme: newResolvedTheme });
        
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newResolvedTheme);
      }
    }
  }, [mounted, theme, getSystemTheme]);

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    toggleTheme,
    getSystemTheme,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
}