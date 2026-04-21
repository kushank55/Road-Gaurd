import { useEffect, useState, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { ChevronDown, Sun, Moon, Phone, User, LogOut } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { useNavigate } from "react-router-dom";
import { Trans } from '@/components/Trans';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useLanguageStore, type Language } from '@/stores';
import type { ScrollState, HeaderProps } from "../types/header";
import { NAV_LINKS, LANGUAGES } from "@/constants";

// Enhanced utility to merge class names with proper TypeScript support
const cn = (...classes: ClassValue[]): string => clsx(classes);

export function RAHeader({ className, fixed = true }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Use the language store for managing language state
  const { currentLanguage, setLanguage } = useLanguageStore();
  
  // Authentication and navigation
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Assume these hooks are available
  const { theme, toggleTheme } = useTheme();
  
  const [scrollState, setScrollState] = useState<ScrollState>({
    isScrolled: false,
    isVisible: true,
    isRounded: false,
    lastScrollY: 0,
    scrollDirection: 'none',
  });

  // Navigation handlers
  const handleGetHelpClick = useCallback(() => {
    navigate('/signup');
  }, [navigate]);

  const handleRoadsideAssistanceClick = useCallback(() => {
    if (isAuthenticated) {
      // If authenticated, go to dashboard or roadside assistance page
      navigate('/dashboard');
    } else {
      // If not authenticated, go to signup
      navigate('/signup');
    }
  }, [isAuthenticated, navigate]);

  const handleNavLinkClick = useCallback((href: string, label: string) => {
    if (label === "Roadside Assistance") {
      handleRoadsideAssistanceClick();
    } else {
      navigate(href);
    }
  }, [handleRoadsideAssistanceClick, navigate]);

  // Profile handlers
  const handleProfileClick = useCallback(() => {
    navigate('/profile');
    setProfileDropdownOpen(false);
  }, [navigate]);

  const handleLogoutClick = useCallback(async () => {
    await logout();
    setProfileDropdownOpen(false);
    navigate('/');
  }, [logout, navigate]);

  // Enhanced scroll detection with improved performance and animations
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    setScrollState((prev) => {
      const newState: ScrollState = { ...prev };
      const scrollDiff = currentScrollY - prev.lastScrollY;
      
      // Determine scroll direction
      if (Math.abs(scrollDiff) > 5) {
        newState.scrollDirection = scrollDiff > 0 ? 'down' : 'up';
      }
      
      // Determine states based on scroll position
      const atTop = currentScrollY <= 10;
      const inRoundedZone = currentScrollY > 10 && currentScrollY <= 200;
      const inHideZone = currentScrollY > 300;
      
      // Update rounded state
      newState.isRounded = inRoundedZone || (currentScrollY > 200 && newState.isVisible);
      newState.isScrolled = !atTop;
      
      // Enhanced visibility logic
      if (inHideZone) {
        if (newState.scrollDirection === 'down' && scrollDiff > 10) {
          newState.isVisible = false;
        } else if (newState.scrollDirection === 'up' && scrollDiff < -10) {
          newState.isVisible = true;
        }
      } else {
        newState.isVisible = true;
      }
      
      newState.lastScrollY = currentScrollY;
      return newState;
    });
  }, []);

  // Throttled scroll handler for better performance
  useEffect(() => {
    let ticking = false;
    
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [handleScroll]);

  // Enhanced body scroll lock with cleanup
  useEffect(() => {
    const body = document.body;
    const originalStyle = window.getComputedStyle(body).overflow;
    
    if (open) {
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.width = "100%";
      body.style.top = `-${window.scrollY}px`;
    } else {
      body.style.overflow = originalStyle;
      body.style.position = "";
      body.style.width = "";
      body.style.top = "";
    }
    
    return () => {
      body.style.overflow = originalStyle;
      body.style.position = "";
      body.style.width = "";
      body.style.top = "";
    };
  }, [open]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown="language"]')) {
        setLangDropdownOpen(false);
      }
      if (!target.closest('[data-dropdown="profile"]')) {
        setProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setOpen(false);
      setLangDropdownOpen(false);
      setProfileDropdownOpen(false);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('/')) {
        setOpen(false);
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (open) setOpen(false);
        if (langDropdownOpen) setLangDropdownOpen(false);
        if (profileDropdownOpen) setProfileDropdownOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, langDropdownOpen, profileDropdownOpen]);

  const headerClasses = cn(
    // Base classes with improved font
    "z-50 transition-all duration-500 ease-out will-change-transform font-inter antialiased",
    // Position classes
    fixed && "fixed",
    // Visibility and transform
    scrollState.isVisible 
      ? "translate-y-0 opacity-100" 
      : "-translate-y-full opacity-0",
    // Width and positioning based on scroll state
    scrollState.isRounded 
      ? "inset-x-3 top-3 sm:inset-x-4 sm:top-4 lg:inset-x-6 lg:top-6 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30" 
      : "inset-x-0 top-0 rounded-none shadow-none",
    // Enhanced background with better blur support
    scrollState.isScrolled
      ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-xl border border-gray-200/40 dark:border-gray-800/40"
      : "bg-transparent border-transparent",
    // Custom classes
    className
  );

  const containerClasses = cn(
    "mx-auto flex items-center justify-between transition-all duration-500 ease-out",
    // Enhanced responsive padding
    "px-4 sm:px-6 lg:px-8 xl:px-10",
    // Height and max-width based on state
    scrollState.isRounded 
      ? "h-14 sm:h-16 max-w-6xl" 
      : "h-16 sm:h-18 md:h-20 lg:h-22 max-w-7xl"
  );

  return (
    <header className={headerClasses} role="banner">
      <div className={containerClasses}>
        {/* Enhanced Logo with better spacing */}
        <a 
          href="/" 
          className="flex items-center gap-3 sm:gap-4 group" 
          aria-label="RoadGuard"
        >
          <img
            src="/src/assets/logo_odoo_2.svg"
            alt="RoadGuard Logo"
            className={cn(
              "transition-all duration-300 group-hover:scale-110 rounded-full object-contain",
              scrollState.isRounded 
                ? "h-9 w-9 sm:h-10 sm:w-10" 
                : "h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14",
              scrollState.isScrolled && "shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            )}
          />
          <span className={cn(
            "font-bold tracking-tight text-gray-900 dark:text-white transition-all duration-300 select-none",
            scrollState.isRounded 
              ? "text-lg sm:text-xl font-semibold" 
              : "text-xl sm:text-2xl lg:text-3xl font-bold"
          )}>
            <Trans translationKey="app.title" text="RoadGuard" />
          </span>
        </a>

        {/* Enhanced Desktop Navigation with better spacing */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-12 px-1" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavLinkClick(link.href, link.label)}
              className={cn(
                "relative font-medium transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400",
                "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-blue-600 dark:after:bg-blue-400",
                "after:transition-all after:duration-300 hover:after:w-full",
                scrollState.isRounded 
                  ? "text-sm xl:text-base py-2" 
                  : "text-base xl:text-lg py-3"
              )}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Enhanced Action Buttons with Language and Theme Controls */}
        <div className="hidden lg:flex items-center gap-3 xl:gap-4">
          {/* Modern Language Dropdown Button */}
          <div className="relative" data-dropdown="language">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300",
                "text-gray-700 dark:text-gray-300",
                // Modern glassmorphism effect
                "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
                "border border-gray-200/50 dark:border-gray-700/50",
                "hover:bg-white/80 dark:hover:bg-gray-800/80",
                "hover:border-gray-300/60 dark:hover:border-gray-600/60",
                "hover:shadow-lg hover:shadow-gray-200/30 dark:hover:shadow-gray-900/30",
                "hover:scale-105 active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/50",
                scrollState.isRounded ? "text-sm" : "text-base"
              )}
              aria-label="Select Language"
            >
              <ReactCountryFlag
                countryCode={LANGUAGES.find(lang => lang.code === currentLanguage)?.flag || "US"}
                svg
                style={{ width: "1.2em", height: "1.2em" }}
                className="drop-shadow-sm"
              />
              <ChevronDown className={cn(
                "transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400",
                langDropdownOpen && "rotate-180",
                "w-4 h-4"
              )} />
            </button>
            
            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-3 w-48 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/40 dark:border-gray-700/40 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as Language);
                      setLangDropdownOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-200 rounded-xl mx-1",
                      "hover:bg-gray-100/60 dark:hover:bg-gray-800/60 hover:scale-95",
                      currentLanguage === lang.code 
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/30 shadow-sm" 
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <ReactCountryFlag
                      countryCode={lang.flag}
                      svg
                      style={{ width: "1.2em", height: "1.2em" }}
                      className="drop-shadow-sm"
                    />
                    <span className="text-sm font-medium">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Modern Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={cn(
              "group p-2.5 rounded-xl transition-all duration-300",
              // Modern glassmorphism effect
              "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
              "border border-gray-200/50 dark:border-gray-700/50",
              "hover:bg-white/80 dark:hover:bg-gray-800/80",
              "hover:border-gray-300/60 dark:hover:border-gray-600/60",
              "hover:shadow-lg hover:shadow-gray-200/30 dark:hover:shadow-gray-900/30",
              "hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/50"
            )}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-400 transition-colors duration-300 drop-shadow-sm" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 group-hover:text-slate-700 transition-colors duration-300 drop-shadow-sm" />
            )}
          </button>
          
          {/* 24x7 Support - Plain text, not a link */}
          <div
            className={cn(
              "group flex items-center gap-2 font-semibold transition-all duration-300",
              "text-gray-700 dark:text-gray-300",
              "px-3 py-2 rounded-lg",
              scrollState.isRounded 
                ? "text-sm xl:text-base" 
                : "text-base xl:text-lg"
            )} 
            aria-label="24x7 Support Available"
          >
            <Phone className="w-4 h-4" />
            <Trans translationKey="header.support" text="24x7 Support" />
          </div>
          
          {/* Conditional Action Button - User Profile or Get Help */}
          {isAuthenticated && user ? (
            /* User Profile Dropdown */
            <div className="relative" data-dropdown="profile">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl transition-all duration-300",
                  // Modern glassmorphism effect
                  "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
                  "border border-gray-200/50 dark:border-gray-700/50",
                  "hover:bg-white/80 dark:hover:bg-gray-800/80",
                  "hover:border-gray-300/60 dark:hover:border-gray-600/60",
                  "hover:shadow-lg hover:shadow-gray-200/30 dark:hover:shadow-gray-900/30",
                  "hover:scale-105 active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/50",
                  // Responsive sizing
                  scrollState.isRounded 
                    ? "px-4 py-2.5 text-sm xl:text-base" 
                    : "px-5 py-3 text-base xl:text-lg"
                )}
                aria-label="User Profile"
              >
                {/* User Avatar */}
                <div className={cn(
                  "flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-sm",
                  scrollState.isRounded ? "h-8 w-8 text-sm" : "h-9 w-9 text-base"
                )}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                
                {/* User Name */}
                <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 max-w-32 truncate">
                  {user.name}
                </span>
                
                {/* Dropdown Arrow */}
                <ChevronDown className={cn(
                  "transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-gray-500 dark:text-gray-400",
                  profileDropdownOpen && "rotate-180",
                  "w-4 h-4"
                )} />
              </button>
              
              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/40 dark:border-gray-700/40 py-3 z-50 animate-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-200/30 dark:border-gray-700/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-200 rounded-xl mx-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/60 hover:scale-95 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Profile</span>
                    </button>
                    
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-200 rounded-xl mx-2 hover:bg-red-50/60 dark:hover:bg-red-900/30 hover:scale-95 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Get Help Button for Non-Authenticated Users */
            <button
              onClick={handleGetHelpClick}
              className={cn(
                "group relative overflow-hidden font-semibold rounded-2xl transition-all duration-300",
                "bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700",
                "dark:from-blue-500 dark:via-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-indigo-600",
                "text-white shadow-xl shadow-blue-500/25 dark:shadow-blue-400/20",
                "hover:shadow-2xl hover:shadow-blue-500/40 dark:hover:shadow-blue-400/30",
                "hover:scale-105 active:scale-95 hover:-translate-y-0.5",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
                // Responsive sizing
                scrollState.isRounded 
                  ? "px-5 py-2.5 text-sm xl:text-base" 
                  : "px-6 py-3 text-base xl:text-lg",
                // Shimmer effect on hover
                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                "before:translate-x-[-100%] before:transition-transform before:duration-700",
                "hover:before:translate-x-[100%]"
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Trans translationKey="header.getHelp" text="Get Help" />
                <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:animate-bounce" />
              </span>
            </button>
          )}
        </div>

        {/* Enhanced Modern Mobile Menu Button */}
        <button
          className={cn(
            "group relative inline-flex items-center justify-center rounded-2xl lg:hidden",
            // Modern glassmorphism effect
            "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm",
            "border border-gray-200/50 dark:border-gray-700/50",
            "hover:bg-white/80 dark:hover:bg-gray-800/80",
            "hover:border-gray-300/60 dark:hover:border-gray-600/60",
            "hover:shadow-lg hover:shadow-gray-200/30 dark:hover:shadow-gray-900/30",
            "transition-all duration-300 hover:scale-105 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/50",
            scrollState.isRounded 
              ? "h-11 w-11 sm:h-12 sm:w-12" 
              : "h-12 w-12 sm:h-13 sm:w-13"
          )}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(prev => !prev)}
        >
          <div className={cn(
            "relative transition-all duration-300",
            scrollState.isRounded ? "h-4 w-4" : "h-5 w-5"
          )}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "absolute left-0 block bg-gray-700 dark:bg-gray-300 transition-all duration-300 rounded-full",
                  "group-hover:bg-blue-600 dark:group-hover:bg-blue-400",
                  scrollState.isRounded ? "h-0.5 w-4" : "h-0.5 w-5",
                  i === 0 && (scrollState.isRounded ? "top-0" : "top-0"),
                  i === 1 && (scrollState.isRounded ? "top-[6px]" : "top-[8px]"),
                  i === 2 && (scrollState.isRounded ? "top-3" : "top-4"),
                  open && i === 0 && (scrollState.isRounded ? "translate-y-[6px] rotate-45" : "translate-y-[8px] rotate-45"),
                  open && i === 1 && "opacity-0 scale-0",
                  open && i === 2 && (scrollState.isRounded ? "-translate-y-[6px] -rotate-45" : "-translate-y-[8px] -rotate-45")
                )}
              />
            ))}
          </div>
        </button>
      </div>

      {/* Enhanced Mobile Navigation Drawer */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-500 ease-out",
          scrollState.isScrolled && !scrollState.isRounded && "border-t border-gray-200/50 dark:border-gray-800/50",
          scrollState.isRounded && "border-t border-gray-200/30 dark:border-gray-800/30 mx-3 sm:mx-4 lg:mx-6",
          open ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav 
          className={cn(
            "flex flex-col gap-2 py-6 transition-all duration-300",
            scrollState.isRounded 
              ? "px-6 sm:px-8 max-w-6xl mx-auto" 
              : "px-4 sm:px-6 max-w-7xl mx-auto"
          )} 
          aria-label="Mobile Navigation"
        >
          {/* Mobile Navigation Links */}
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => {
                handleNavLinkClick(link.href, link.label);
                setOpen(false);
              }}
              className={cn(
                "rounded-2xl px-4 py-3 text-base font-medium text-gray-900 dark:text-white w-full text-left",
                "transition-all duration-300 hover:bg-gray-100/60 dark:hover:bg-gray-800/60 active:bg-gray-200/60 dark:active:bg-gray-700/60",
                "border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50",
                "hover:scale-95 hover:shadow-sm"
              )}
            >
              {link.label}
            </button>
          ))}
          
          {/* Mobile Controls */}
          <div className="mt-4 space-y-4">
            {/* Language and Theme Controls Row */}
            <div className="flex items-center gap-3">
              {/* Mobile Language Dropdown */}
              <div className="relative flex-1" data-dropdown="language">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="group flex items-center justify-between w-full px-4 py-3 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <ReactCountryFlag
                      countryCode={LANGUAGES.find(lang => lang.code === currentLanguage)?.flag || "US"}
                      svg
                      style={{ width: "1.2em", height: "1.2em" }}
                      className="drop-shadow-sm"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {LANGUAGES.find(lang => lang.code === currentLanguage)?.name}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "transition-all duration-300 w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400",
                    langDropdownOpen && "rotate-180"
                  )} />
                </button>
                
                {langDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/40 dark:border-gray-700/40 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as Language);
                          setLangDropdownOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-200 rounded-xl mx-1",
                          "hover:bg-gray-100/60 dark:hover:bg-gray-800/60 hover:scale-95",
                          currentLanguage === lang.code 
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-900/30 shadow-sm" 
                            : "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <ReactCountryFlag
                          countryCode={lang.flag}
                          svg
                          style={{ width: "1.2em", height: "1.2em" }}
                          className="drop-shadow-sm"
                        />
                        <span className="text-sm font-medium">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="group p-3 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-105 active:scale-95"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-400 transition-colors duration-300 drop-shadow-sm" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 group-hover:text-slate-700 transition-colors duration-300 drop-shadow-sm" />
                )}
              </button>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Mobile Support - Plain text, not a link */}
              <div
                className={cn(
                  "group flex items-center justify-center gap-2 rounded-2xl px-4 py-3",
                  "text-base font-medium text-gray-700 dark:text-gray-300",
                  "bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50",
                  "transition-all duration-300"
                )}
              >
                <Phone className="w-4 h-4" />
                <Trans translationKey="header.support" text="24x7 Support" />
              </div>
              
              {/* Conditional Mobile Action Button */}
              {isAuthenticated && user ? (
                /* Mobile User Profile Actions */
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Mobile Profile Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        handleProfileClick();
                        setOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-95 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleLogoutClick();
                        setOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-red-200/50 dark:border-red-700/50 hover:bg-red-50/60 dark:hover:bg-red-900/30 transition-all duration-300 hover:scale-95 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Mobile Get Help Button for Non-Authenticated Users */
                <button
                  className={cn(
                    "group relative overflow-hidden rounded-2xl px-4 py-3 text-base font-semibold",
                    "bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700",
                    "dark:from-blue-500 dark:via-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:via-blue-600 dark:hover:to-indigo-600",
                    "text-white shadow-xl shadow-blue-500/25 dark:shadow-blue-400/20",
                    "hover:shadow-2xl hover:shadow-blue-500/40 dark:hover:shadow-blue-400/30",
                    "transition-all duration-300 hover:scale-95 active:scale-90",
                    // Shimmer effect
                    "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
                    "before:translate-x-[-100%] before:transition-transform before:duration-700",
                    "hover:before:translate-x-[100%]"
                  )}
                  onClick={() => {
                    handleGetHelpClick();
                    setOpen(false);
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Trans translationKey="header.getHelpNow" text="Get Help Now" />
                    <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:animate-bounce" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Enhanced Mobile Menu Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm lg:hidden -z-10 transition-all duration-300"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
