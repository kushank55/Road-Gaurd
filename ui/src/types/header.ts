export interface NavLink {
  label: string;
  href: string;
  icon?: string; // Optional icon for better mobile UX
}

export interface ScrollState {
  isScrolled: boolean;
  isVisible: boolean;
  isRounded: boolean;
  lastScrollY: number;
  scrollDirection: 'up' | 'down' | 'none';
}

export interface HeaderProps {
  className?: string;
  fixed?: boolean; // Control whether header should be fixed
}
