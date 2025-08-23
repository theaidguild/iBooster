import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Translation resources
import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';

const resources = {
  en: {
    translation: en,
  },
  'pt-BR': {
    translation: ptBR,
  },
};

// Get the system locale
const deviceLanguage = Localization.locale;

// Determine which language to use
const getLanguage = () => {
  // Check if the device language is supported
  if (deviceLanguage.startsWith('pt')) {
    return 'pt-BR';
  }
  // Default to English for unsupported languages
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLanguage(),
    fallbackLng: 'en',
    
    // Allow keys to be used as the fallback value
    keySeparator: '.',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Enable React Suspense mode for better loading experience
    react: {
      useSuspense: true,
    },
  });

export default i18n;