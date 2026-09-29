import { createContext, useEffect, useState, type ReactNode } from "react";
import {
  translations,
  type Language,
  type TranslationKey,
} from "../lib/translations";

type LanguageContextType = {
  language: Language;
  locale: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language") as Language | null;

    return savedLanguage && savedLanguage in translations
      ? savedLanguage
      : "fr-DZ";
  });

  useEffect(() => {
    document.documentElement.lang =
      language === "ar-DZ" ? "ar" : language === "fr-DZ" ? "fr" : "en";

    document.documentElement.dir = language === "ar-DZ" ? "rtl" : "ltr";

    localStorage.setItem("language", language);
  }, [language]);

  function t(key: TranslationKey) {
    return translations[language][key] || translations["fr-DZ"][key];
  }

  return (
    <LanguageContext.Provider value={{ language, locale: language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}