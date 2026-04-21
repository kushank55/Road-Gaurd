import React, { useEffect, useRef } from 'react';
import { translationService } from '@/services/translation.service';
import { useLanguageStore } from '@/stores';

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { setLanguage } = useLanguageStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    // Load cached translations on app initialization
    translationService.loadCachedTranslations();
    
    // Initialize with the current language from store
    const currentLanguage = useLanguageStore.getState().currentLanguage;
    setLanguage(currentLanguage);
    
    initialized.current = true;
    console.log('🌍 TranslationProvider initialized');
  }, [setLanguage]);

  return <>{children}</>;
};
