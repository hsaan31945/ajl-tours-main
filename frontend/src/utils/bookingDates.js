const LANGUAGE_LOCALES = {
  en: "en-US",
  de: "de-CH",
  fr: "fr-CH",
  it: "it-CH",
};

const parseDateTimeAsUtc = (dateValue, timeValue = "09:00") => {
  const [year, month, day] = String(dateValue || "").split("-").map(Number);
  const [hour = 9, minute = 0] = String(timeValue || "09:00").split(":").map(Number);

  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0));
};

export const getFreeCancellationCutoff = (dateValue, timeValue) => {
  const start = parseDateTimeAsUtc(dateValue, timeValue);
  if (!start) return null;
  return new Date(start.getTime() - 24 * 60 * 60 * 1000);
};

export const formatFreeCancellationCutoff = (dateValue, timeValue, language = "en") => {
  const cutoff = getFreeCancellationCutoff(dateValue, timeValue);
  if (!cutoff) return "";

  return new Intl.DateTimeFormat(LANGUAGE_LOCALES[language] || LANGUAGE_LOCALES.en, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(cutoff);
};
