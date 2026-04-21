export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
}

export interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getSystemTheme: () => 'light' | 'dark';
}

export interface ThemeStore extends ThemeState, ThemeActions {}

export interface ThemeContextType extends ThemeStore {
  mounted: boolean;
}