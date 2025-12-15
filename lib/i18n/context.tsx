'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved language preference from localStorage
    const savedLanguage = localStorage.getItem('appLanguage') as Language;
    if (savedLanguage && (savedLanguage === 'id' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en') {
        setLanguageState('en');
      } else {
        setLanguageState('id');
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const value: I18nContextType = {
    language: mounted ? language : 'id', // Prevent hydration mismatch
    setLanguage,
    t: translations[mounted ? language : 'id'],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

