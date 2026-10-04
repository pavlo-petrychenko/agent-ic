export const formatDate = (
  iso: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string => new Intl.DateTimeFormat(locale, options).format(Date.parse(iso));
