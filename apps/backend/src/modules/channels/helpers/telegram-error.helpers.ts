import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';

export const isTelegramTokenInvalid = (error: unknown): boolean =>
  error instanceof TelegramApiError && (error.status === 401 || error.status === 404);
