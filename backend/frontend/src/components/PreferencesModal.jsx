import React, { useEffect, useMemo } from "react";
import { Check, CircleDollarSign, Globe, X } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n";

const FEATURED_CURRENCY_CODES = ["AUD", "GBP", "CAD", "EUR", "CHF", "USD"];

const PreferenceItem = ({ active, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-[2.75rem] items-center justify-start gap-2 rounded-md px-0 text-left text-sm font-bold transition-colors hover:text-blue-600 ${
      active ? "text-blue-600" : "text-slate-800"
    }`}
  >
    <span>{children}</span>
    {active && <Check className="h-5 w-5 shrink-0 stroke-[2.5]" aria-hidden="true" />}
  </button>
);

const CurrencyLabel = ({ item }) => (
  <>
    {item.name} <span className="font-bold text-slate-500">{item.symbol}</span>
  </>
);

const PreferencesModal = ({ mode = "currency", onClose }) => {
  const { currency, setCurrency, SUPPORTED_CURRENCIES } = useCurrency();
  const { language, setLanguage, supportedLanguages, t } = useI18n();
  const isCurrencyMode = mode === "currency";
  const title = isCurrencyMode ? "Currency" : t("language.label");
  const Icon = isCurrencyMode ? CircleDollarSign : Globe;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const currencyByCode = useMemo(
    () => SUPPORTED_CURRENCIES.reduce((acc, item) => ({ ...acc, [item.code]: item }), {}),
    [SUPPORTED_CURRENCIES]
  );

  const featuredCurrencies = FEATURED_CURRENCY_CODES
    .map((code) => currencyByCode[code])
    .filter(Boolean);

  const chooseCurrency = (code) => {
    setCurrency(code);
    onClose();
  };

  const chooseLanguage = (code) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black/55 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="relative flex max-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
          aria-label="Close preferences"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="shrink-0 px-6 pt-14 sm:px-7">
          <div className="flex border-b border-slate-200">
            <div className="flex min-w-[9rem] items-center justify-center gap-2 border-b-4 border-blue-600 px-4 pb-4 text-sm font-bold text-slate-900">
              <Icon className="h-5 w-5" aria-hidden="true" />
              {title}
            </div>
          </div>
        </div>

        {isCurrencyMode ? (
          <div className="min-h-0 overflow-y-auto px-6 pb-8 pt-3 sm:px-7">
            <div className="grid grid-cols-1 gap-x-12 sm:grid-cols-3">
              {featuredCurrencies.map((item) => (
                <PreferenceItem
                  key={`featured-${item.code}`}
                  active={currency === item.code}
                  onClick={() => chooseCurrency(item.code)}
                >
                  <CurrencyLabel item={item} />
                </PreferenceItem>
              ))}
            </div>

            <h3 className="mt-4 border-b border-slate-200 pb-4 text-sm font-bold text-slate-900">
              All currencies
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-x-12 sm:grid-cols-3">
              {SUPPORTED_CURRENCIES.map((item) => (
                <PreferenceItem
                  key={item.code}
                  active={currency === item.code}
                  onClick={() => chooseCurrency(item.code)}
                >
                  <CurrencyLabel item={item} />
                </PreferenceItem>
              ))}
            </div>
          </div>
        ) : (
          <div className="min-h-0 overflow-y-auto px-6 pb-8 pt-3 sm:px-7">
            <h3 className="border-b border-slate-200 pb-4 text-sm font-bold text-slate-900">
              All languages
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-x-12 sm:grid-cols-2">
              {supportedLanguages.map((item) => (
                <PreferenceItem
                  key={item.code}
                  active={language === item.code}
                  onClick={() => chooseLanguage(item.code)}
                >
                  {t(item.labelKey)} <span className="font-bold text-slate-500">{item.shortLabel}</span>
                </PreferenceItem>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreferencesModal;
