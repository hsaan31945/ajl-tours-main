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
    .replace(/\s{2,}/g, ' ')
    .trim();
};
