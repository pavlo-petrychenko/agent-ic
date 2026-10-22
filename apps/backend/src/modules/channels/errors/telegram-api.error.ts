import { TELEGRAM_UPSTREAM } from '@/modules/channels/constants/telegram.constants';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { isRetryableUpstreamStatus } from '@/platform/errors/helpers/upstream.helpers';

export interface TelegramApiErrorOptions {
  readonly method: string;
  readonly status: number | null;
  readonly errorCode?: number | null;
  readonly description?: string | null;
  readonly retryAfterSeconds?: number | null;
  readonly retryable?: boolean;
}

export class TelegramApiError extends UpstreamError {
  readonly method: string;
  readonly status: number | null;
  readonly errorCode: number | null;
  readonly description: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(options: TelegramApiErrorOptions) {
    super(TELEGRAM_UPSTREAM, {
      retryable:
        options.retryable ?? (options.status === null || isRetryableUpstreamStatus(options.status)),
    });
    this.name = new.target.name;
    this.method = options.method;
    this.status = options.status;
    this.errorCode = options.errorCode ?? null;
    this.description = options.description ?? null;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}
