import React, { useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { useI18n } from "../i18n";
import PreferencesModal from "./PreferencesModal";

const LanguageSelector = ({ compact = false, className = "" }) => {
  const { language, supportedLanguages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const selectedLanguage = supportedLanguages.find((item) => item.code === language) || supportedLanguages[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-orange-600 ${className}`}
        title={t("language.label")}
        aria-label={t("language.label")}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {!compact && <span className="text-xs text-gray-500">{t("language.label")}</span>}
        <span className="pr-5 font-bold text-gray-800">
          {compact ? selectedLanguage.shortLabel : t(selectedLanguage.labelKey)}
        </span>
        <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400" aria-hidden="true" />
      </button>

      {open && <PreferencesModal initialTab="language" onClose={() => setOpen(false)} />}
    </>
  );
};

export default LanguageSelector;
