import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';

// Get the saved language from localStorage or default to 'en'
// Check if we're in a browser environment (localStorage is not available during SSR)
const savedLanguage = typeof window !== 'undefined' 
  ? (localStorage.getItem('language') || 'en')
  : 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })
  .then(() => {
  })
  .catch((err) => {
    console.error('Error initializing i18n:', err);
  });

export default i18n; 