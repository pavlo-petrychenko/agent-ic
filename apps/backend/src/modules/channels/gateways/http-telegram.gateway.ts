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
import { toTelegramUpdate } from '@/modules/channels/helpers/telegram-update.helpers';
import { telegramReplyMarkup } from '@/modules/channels/helpers/telegram.helpers';
import type {
  TelegramMeResponse,
  TelegramMessageResponse,
  TelegramResponse,
  TelegramUpdateResponse,
  TelegramWebhookInfoResponse,
} from '@/modules/channels/typedefs/http-telegram-gateway.typedefs';
import type {
  AnswerTelegramCallbackQueryInput,
  GetTelegramUpdatesInput,
  SendTelegramChatActionInput,
  SendTelegramMessageInput,
  SetTelegramWebhookInput,
  TelegramBot,
  TelegramUpdate,
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
      username: result.username,
      firstName: result.first_name,
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

  async getUpdates(input: GetTelegramUpdatesInput): Promise<TelegramUpdate[]> {
    const result = await this.call<TelegramUpdateResponse[]>(
      input.token,
      'getUpdates',
      {
        method: 'POST',
        headers: { [HttpHeader.ContentType]: TELEGRAM_CONTENT_TYPE },
        body: JSON.stringify({
          offset: input.offset,
          timeout: input.timeoutSeconds,
          allowed_updates: input.allowedUpdates,
        }),
      },
      input.timeoutSeconds * MILLISECONDS_PER_SECOND + TELEGRAM_API_TIMEOUT_MS,
    );
    return result.map(toTelegramUpdate);
  }

  async sendMessage(input: SendTelegramMessageInput): Promise<void> {
    const replyMarkup = telegramReplyMarkup(input.quickReplies);
    await this.call<TelegramMessageResponse>(input.token, 'sendMessage', {
      method: 'POST',
      headers: { [HttpHeader.ContentType]: TELEGRAM_CONTENT_TYPE },
      body: JSON.stringify({
        chat_id: input.chatId,
        text: input.text,
        ...(replyMarkup === null ? {} : { reply_markup: replyMarkup }),
      }),
    });
  }

  async sendChatAction(input: SendTelegramChatActionInput): Promise<void> {
    await this.call<boolean>(input.token, 'sendChatAction', {
      method: 'POST',
      headers: { [HttpHeader.ContentType]: TELEGRAM_CONTENT_TYPE },
      body: JSON.stringify({
        chat_id: input.chatId,
        action: input.action,
      }),
    });
  }

  async answerCallbackQuery(input: AnswerTelegramCallbackQueryInput): Promise<void> {
    await this.call<boolean>(input.token, 'answerCallbackQuery', {
      method: 'POST',
      headers: { [HttpHeader.ContentType]: TELEGRAM_CONTENT_TYPE },
      body: JSON.stringify({
        callback_query_id: input.callbackQueryId,
        ...(input.text === null ? {} : { text: input.text }),
        ...(input.showAlert ? { show_alert: true } : {}),
      }),
    });
  }

  private async call<TResult>(
    token: string,
    method: string,
    init: RequestInit,
    timeoutMs: number = TELEGRAM_API_TIMEOUT_MS,
  ): Promise<TResult> {
    let response: Response;
    try {
      response = await fetch(`${TELEGRAM_API_BASE_URL}/bot${token}/${method}`, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
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
