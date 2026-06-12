import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "../locales/en.json";
import de from "../locales/de.json";
import fr from "../locales/fr.json";
import it from "../locales/it.json";

export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "ajl:selectedLanguage";

export const SUPPORTED_LANGUAGES = [
  { code: "en", labelKey: "language.english", shortLabel: "EN" },
  { code: "de", labelKey: "language.german", shortLabel: "DE" },
  { code: "fr", labelKey: "language.french", shortLabel: "FR" },
  { code: "it", labelKey: "language.italian", shortLabel: "IT" },
];

const resources = { en, de, fr, it };
const supportedCodes = new Set(SUPPORTED_LANGUAGES.map((language) => language.code));

const getNestedValue = (source, key) => (
  String(key || "")
    .split(".")
    .reduce((current, segment) => (current && current[segment] !== undefined ? current[segment] : undefined), source)
);

const interpolate = (value, params = {}) => (
  String(value).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, paramKey) => (
    params[paramKey] !== undefined ? String(params[paramKey]) : ""
  ))
);

const normalizeLanguage = (value) => {
  const code = String(value || "").toLowerCase().split("-")[0];
  return supportedCodes.has(code) ? code : DEFAULT_LANGUAGE;
};

const detectInitialLanguage = () => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && supportedCodes.has(stored)) return stored;

  const browserLanguage = normalizeLanguage(window.navigator?.language);
  return browserLanguage === DEFAULT_LANGUAGE ? DEFAULT_LANGUAGE : browserLanguage;
};

const I18nContext = createContext(null);

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(detectInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const safeLanguage = normalizeLanguage(nextLanguage);
    setLanguageState(safeLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, safeLanguage);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === LANGUAGE_STORAGE_KEY && event.newValue && supportedCodes.has(event.newValue)) {
        setLanguageState(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      const translated = getNestedValue(resources[language], key);
      const fallback = getNestedValue(resources[DEFAULT_LANGUAGE], key);
      const value = translated ?? fallback ?? key;
      return interpolate(value, params);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
      defaultLanguage: DEFAULT_LANGUAGE,
    }),
    [language, setLanguage, t]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

export const getLocalizedField = (item, field, language, fallbackLanguage = DEFAULT_LANGUAGE) => {
  if (!item || !field) return "";
  const code = normalizeLanguage(language);

  return (
    item?.translations?.[code]?.[field] ??
    item?.i18n?.[code]?.[field] ??
    item?.[`${field}_${code}`] ??
    item?.translations?.[fallbackLanguage]?.[field] ??
    item?.i18n?.[fallbackLanguage]?.[field] ??
    item?.[`${field}_${fallbackLanguage}`] ??
    item?.[field] ??
    ""
  );
};
