import { Injectable } from '@nestjs/common';
import {
  TELEGRAM_API_BASE_URL,
  TELEGRAM_API_TIMEOUT_MS,
  TELEGRAM_CONTENT_TYPE,
  TELEGRAM_DROP_PENDING_UPDATES,
  TELEGRAM_INVALID_RESPONSE_MESSAGE,
} from '@/modules/channels/constants/telegram.constants';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import type {
  TelegramMeResponse,
  TelegramWebhookInfoResponse,
  TelegramResponse,
} from '@/modules/channels/typedefs/http-telegram-gateway.typedefs';
import type {
  SetTelegramWebhookInput,
  TelegramBot,
  TelegramWebhookInfo,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

@Injectable()
export class HttpTelegramGateway extends TelegramGateway {
  async getMe(token: string): Promise<TelegramBot> {
    const result = await this.call<TelegramMeResponse>(token, 'getMe', { method: 'GET' });
    return {
      id: String(result.id),
      username: result.username ?? '',
    };
  }

  async setWebhook(input: SetTelegramWebhookInput): Promise<void> {
    await this.call<boolean>(input.token, 'setWebhook', {
      method: 'POST',
      headers: { [HttpHeader.ContentType]: TELEGRAM_CONTENT_TYPE },
      body: JSON.stringify({
        url: input.url,
        secret_token: input.secret,
        allowed_updates: input.allowedUpdates,
      }),
    });
  }

  async deleteWebhook(token: string): Promise<void> {
    await this.call<boolean>(token, 'deleteWebhook', {
      method: 'POST',
      headers: { [HttpHeader.ContentType]: TELEGRAM_CONTENT_TYPE },
      body: JSON.stringify({ drop_pending_updates: TELEGRAM_DROP_PENDING_UPDATES }),
    });
  }

  async getWebhookInfo(token: string): Promise<TelegramWebhookInfo> {
    const result = await this.call<TelegramWebhookInfoResponse>(token, 'getWebhookInfo', {
      method: 'GET',
    });
    return {
      url: result.url,
      pendingUpdateCount: result.pending_update_count,
      lastErrorAt:
        result.last_error_date === undefined
          ? null
          : new Date(result.last_error_date * MILLISECONDS_PER_SECOND),
      lastErrorMessage: result.last_error_message ?? null,
    };
  }

  private async call<TResult>(token: string, method: string, init: RequestInit): Promise<TResult> {
    let response: Response;
    try {
      response = await fetch(`${TELEGRAM_API_BASE_URL}/bot${token}/${method}`, {
        ...init,
        signal: AbortSignal.timeout(TELEGRAM_API_TIMEOUT_MS),
      });
    } catch {
      throw new TelegramApiError({ method, status: null });
    }
    const body = await this.readBody<TResult>(response);
    if (body === null || !body.ok) {
      throw new TelegramApiError({
        method,
        status: body?.error_code ?? response.status,
        errorCode: body?.error_code,
        description: body === null ? TELEGRAM_INVALID_RESPONSE_MESSAGE : body.description,
        retryAfterSeconds: body?.parameters?.retry_after,
      });
    }
    if (!response.ok) {
      throw new TelegramApiError({
        method,
        status: response.status,
        description: TELEGRAM_INVALID_RESPONSE_MESSAGE,
      });
    }
    if (body.result === undefined) {
      throw new TelegramApiError({
        method,
        status: null,
        description: TELEGRAM_INVALID_RESPONSE_MESSAGE,
        retryable: false,
      });
    }
    return body.result;
  }

  private async readBody<TResult>(response: Response): Promise<TelegramResponse<TResult> | null> {
    try {
      return (await response.json()) as TelegramResponse<TResult>;
    } catch {
      return null;
    }
  }
}
