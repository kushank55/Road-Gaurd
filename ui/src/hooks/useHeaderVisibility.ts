import { useCallback, useState } from 'react';

/**
 * Hook for header visibility control across different pages
 */
export const useHeaderVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  const hideHeader = useCallback(() => setIsVisible(false), []);
  const showHeader = useCallback(() => setIsVisible(true), []);

  return { isVisible, hideHeader, showHeader };
};
