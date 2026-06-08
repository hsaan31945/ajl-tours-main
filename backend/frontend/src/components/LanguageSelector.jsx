import React from "react";
import { ChevronDown, Globe } from "lucide-react";
import { useI18n } from "../i18n";

const LanguageSelector = ({ compact = false, className = "" }) => {
  const { language, setLanguage, supportedLanguages, t } = useI18n();

  return (
    <label
      className={`relative inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-orange-600 ${className}`}
      title={t("language.label")}
    >
      <Globe className="h-4 w-4" aria-hidden="true" />
      {!compact && <span className="text-xs text-gray-500">{t("language.label")}</span>}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        className="appearance-none bg-transparent pr-5 font-bold text-gray-800 outline-none cursor-pointer"
        aria-label={t("language.label")}
      >
        {supportedLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {compact ? item.shortLabel : t(item.labelKey)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400" aria-hidden="true" />
    </label>
  );
};

export default LanguageSelector;
