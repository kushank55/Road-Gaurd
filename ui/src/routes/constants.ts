// Route constants for better maintainability
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  NOT_FOUND: "/404",
} as const;

// Route helper functions
export const getHomeUrl = () => ROUTES.HOME;
export const getLoginUrl = (returnUrl?: string) =>
  returnUrl
    ? `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(returnUrl)}`
    : ROUTES.LOGIN;
export const getSignupUrl = () => ROUTES.SIGNUP;
export const getDashboardUrl = () => ROUTES.DASHBOARD;
export const getProfileUrl = () => ROUTES.PROFILE;
export const getSettingsUrl = () => ROUTES.SETTINGS;

export type RouteKeys = keyof typeof ROUTES;
