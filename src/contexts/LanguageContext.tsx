import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext({
  language: 'English',
  setLanguage: (lang: string) => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };
  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange }}>
      {children}
    </LanguageContext.Provider>
  );
} 