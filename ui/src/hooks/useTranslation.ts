import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguageStore } from '@/stores';
import type { Language } from '@/stores';

export interface UseTranslationOptions {
  key: string;
  text: string;
  fallback?: string;
}

export const useTranslation = (options: UseTranslationOptions) => {
  const { key, text, fallback } = options;
  const { currentLanguage, translations, isLoading, error } = useLanguageStore();
  const [translatedText, setTranslatedText] = useState<string>(text);
  const translateRef = useRef(useLanguageStore.getState().translate);

  // Update the ref when the store changes
  useEffect(() => {
    translateRef.current = useLanguageStore.getState().translate;
  }, []);

  const translateText = useCallback(async () => {
    if (currentLanguage === 'en') {
      setTranslatedText(text);
      return;
    }

    // Check if translation already exists
    const existingTranslation = translations[key]?.[currentLanguage];
    if (existingTranslation) {
      setTranslatedText(existingTranslation);
      return;
    }

    try {
      const result = await translateRef.current(key, text);
      setTranslatedText(result);
    } catch (error) {
      console.error(`Translation failed for key "${key}":`, error);
      setTranslatedText(fallback || text);
    }
  }, [key, text, currentLanguage, translations, fallback]);

  useEffect(() => {
    translateText();
  }, [translateText]);

  return {
    t: translatedText,
    isLoading,
    error,
    currentLanguage,
  };
};

export const useBatchTranslation = (translations: Array<{ key: string; text: string }>) => {
  const { currentLanguage, isLoading, error } = useLanguageStore();
  const translateBatchRef = useRef(useLanguageStore.getState().translateBatch);

  // Update the ref when the store changes
  useEffect(() => {
    translateBatchRef.current = useLanguageStore.getState().translateBatch;
  }, []);

  const translateAll = useCallback(async () => {
    if (currentLanguage === 'en') {
      return;
    }

    try {
      await translateBatchRef.current(translations);
    } catch (error) {
      console.error('Batch translation failed:', error);
    }
  }, [translations, currentLanguage]);

  useEffect(() => {
    translateAll();
  }, [translateAll]);

  return {
    isLoading,
    error,
    currentLanguage,
  };
};

export const useLanguage = () => {
  const { currentLanguage, setLanguage, clearTranslations } = useLanguageStore();

  const changeLanguage = useCallback((language: Language) => {
    setLanguage(language);
  }, [setLanguage]);

  return {
    currentLanguage,
    changeLanguage,
    clearTranslations,
  };
};
