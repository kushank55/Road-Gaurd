import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translationService } from '@/services/translation.service';

export type Language = 'en' | 'hi';

export interface LanguageState {
  currentLanguage: Language;
  translations: Record<string, Record<Language, string>>;
  isLoading: boolean;
  error: string | null;
  setLanguage: (language: Language) => void;
  translate: (key: string, text: string) => Promise<string>;
  translateBatch: (translations: Array<{ key: string; text: string }>) => Promise<void>;
  clearTranslations: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      translations: {},
      isLoading: false,
      error: null,

      setLanguage: (language: Language) => {
        console.log(`🌍 Language changed to: ${language}`);
        set({ currentLanguage: language, error: null });
        // Load cached translations when language changes
        translationService.loadCachedTranslations();
      },

      translate: async (key: string, text: string) => {
        const { currentLanguage, translations } = get();
        
        // If it's English, return the original text
        if (currentLanguage === 'en') {
          return text;
        }

        // Check if translation already exists
        if (translations[key]?.[currentLanguage]) {
          return translations[key][currentLanguage];
        }

        try {
          // Only set loading if not already loading
          const currentState = get();
          if (!currentState.isLoading) {
            set({ isLoading: true, error: null });
          }
          
          const translatedText = await translationService.translate(text, currentLanguage);
          
          // Store the translation
          set((state) => ({
            translations: {
              ...state.translations,
              [key]: {
                ...state.translations[key],
                [currentLanguage]: translatedText,
              },
            },
          }));

          return translatedText;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Translation failed';
          set({ error: errorMessage });
          console.error('Translation error:', error);
          return text; // Fallback to original text
        } finally {
          // Only clear loading if no other translations are in progress
          const currentState = get();
          if (currentState.isLoading) {
            set({ isLoading: false });
          }
        }
      },

      translateBatch: async (translations: Array<{ key: string; text: string }>) => {
        const { currentLanguage } = get();
        
        if (currentLanguage === 'en') {
          console.log('🇺🇸 English is current language, skipping batch translation');
          return;
        }

        try {
          console.log(`🔄 Starting batch translation for ${translations.length} items`);
          set({ isLoading: true, error: null });
          
          const texts = translations.map(t => t.text);
          const translatedTexts = await translationService.translateBatch(texts, currentLanguage);
          
          console.log(`✅ Batch translation completed, storing ${translatedTexts.length} translations`);
          
          // Store all translations
          const newTranslations: Record<string, Record<Language, string>> = {};
          translations.forEach((translation, index) => {
            newTranslations[translation.key] = {
              ...get().translations[translation.key],
              [currentLanguage]: translatedTexts[index] || translation.text,
            };
          });

          set((state) => ({
            translations: {
              ...state.translations,
              ...newTranslations,
            },
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Batch translation failed';
          set({ error: errorMessage });
          console.error('❌ Batch translation error:', error);
          
          // Log more details about the error
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      clearTranslations: () => {
        set({ translations: {}, error: null });
        translationService.clearCache();
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'language-store',
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
        translations: state.translations,
      }),
    }
  )
);
