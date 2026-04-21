import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n with basic configuration
// Note: We're using our custom translation service instead of static files
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {}
      },
      hi: {
        translation: {}
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    // Disable loading from backend since we're using our custom service
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Disable automatic language detection for now
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    // Add debug mode for development
    debug: process.env.NODE_ENV === 'development',
    // Ensure proper key handling
    keySeparator: '.',
    nsSeparator: ':',
    // Add missing key handling
    saveMissing: false,
    missingKeyHandler: (lng, _ns, key, _fallbackValue) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
    },
  });

// Export a function to change language that also updates our custom service
export const changeLanguage = async (language: string) => {
  try {
    await i18n.changeLanguage(language);
    console.log(`🌍 i18n language changed to: ${language}`);
  } catch (error) {
    console.error('Failed to change i18n language:', error);
  }
};

export default i18n;
