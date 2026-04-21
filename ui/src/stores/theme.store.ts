import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeStore, Theme } from '@/types/theme';

const STORAGE_KEY = 'roadguard-theme';

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',
      systemTheme: 'light',

      setTheme: (theme: Theme) => {
        const resolvedTheme = getResolvedTheme(theme);
        const systemTheme = getSystemTheme();
        
        set({ theme, resolvedTheme, systemTheme });
        
        // Apply theme to document
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolvedTheme);
        }
      },

      toggleTheme: () => {
        const { theme } = get();
        let newTheme: Theme;
        
        if (theme === 'system') {
          // If system, switch to opposite of system preference
          newTheme = getSystemTheme() === 'light' ? 'dark' : 'light';
        } else {
          // Toggle between light and dark
          newTheme = theme === 'light' ? 'dark' : 'light';
        }
        
        get().setTheme(newTheme);
      },

      getSystemTheme,
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Update system theme and resolved theme after rehydration
          const systemTheme = getSystemTheme();
          const resolvedTheme = getResolvedTheme(state.theme);
          
          state.systemTheme = systemTheme;
          state.resolvedTheme = resolvedTheme;
          
          // Apply theme to document
          if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(resolvedTheme);
          }
        }
      },
    }
  )
);

// Initialize theme on store creation
if (typeof window !== 'undefined') {
  const initialState = useThemeStore.getState();
  const systemTheme = getSystemTheme();
  const resolvedTheme = getResolvedTheme(initialState.theme);
  
  useThemeStore.setState({
    systemTheme,
    resolvedTheme,
  });
  
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
}