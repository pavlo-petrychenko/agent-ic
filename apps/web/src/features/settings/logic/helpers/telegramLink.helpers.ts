const MILLISECONDS_PER_MINUTE = 60_000;
const CODE_GROUP_LENGTH = 3;

export const telegramLinkMinutesLeft = (expiresAt: string, now: number = Date.now()): number =>
  Math.max(1, Math.ceil((new Date(expiresAt).getTime() - now) / MILLISECONDS_PER_MINUTE));

export const formatTelegramLinkCode = (code: string): string =>
  code.length === CODE_GROUP_LENGTH * 2
    ? `${code.slice(0, CODE_GROUP_LENGTH)} ${code.slice(CODE_GROUP_LENGTH)}`
    : code;

export const formatTelegramLinkedAt = (linkedAt: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(linkedAt));
