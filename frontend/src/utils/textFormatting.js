export const stripHtmlToText = (value = '') => {
  if (typeof value !== 'string') return '';

  return value
    .replace(/<\s*\/p\s*>/gi, '\n\n')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const cleanDisplayName = (value = '') => {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/^[\s,،;:]+/, '')
    .replace(/^explore\s+/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const formatDurationLabel = (value = '') => {
  const duration = String(value || '').trim();
  return duration.replace(/\b(\d+(?:\.\d+)?)\s+Hour\b/gi, (_, count) => (
    Number(count) === 1 ? `${count} Hour` : `${count} Hours`
  ));
};

export const formatIncludedLabel = (value = '') => {
  const label = String(value || '').trim();
  if (/^wi-?fi\s+free$/i.test(label)) return 'Complimentary Wi-Fi Onboard';
  return label;
};
