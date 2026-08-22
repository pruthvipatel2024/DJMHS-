import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import gu from './locales/gu.json';
import hi from './locales/hi.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      gu: { translation: gu },
      hi: { translation: hi }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

i18n.on('languageChanged', (lng) => {
  if (lng === 'gu') {
    document.documentElement.style.setProperty('--font-sans', '"Noto Sans Gujarati"');
  } else if (lng === 'hi') {
    document.documentElement.style.setProperty('--font-sans', '"Noto Sans Devanagari"');
  } else {
    document.documentElement.style.setProperty('--font-sans', 'Inter');
  }
});

// Set initial font
if (i18n.language === 'gu') document.documentElement.style.setProperty('--font-sans', '"Noto Sans Gujarati"');
else if (i18n.language === 'hi') document.documentElement.style.setProperty('--font-sans', '"Noto Sans Devanagari"');
else document.documentElement.style.setProperty('--font-sans', 'Inter');

export default i18n;
