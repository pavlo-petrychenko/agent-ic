import { ChannelKind } from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { ChannelEventType } from '@/modules/channels/constants/channel-event.constants';
import { ChannelUpdatesLogMessage } from '@/modules/channels/constants/channel-updates.constants';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { TELEGRAM_QUICK_REPLY_EXPIRED_TEXT } from '@/modules/channels/constants/telegram.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramWebhookUnauthorizedError } from '@/modules/channels/errors/telegram-webhook-unauthorized.error';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import {
  toIncomingMessageInput,
  toIncomingQuickReplyInput,
} from '@/modules/channels/helpers/telegram-update.helpers';
import { parseTelegramQuickReplyCallbackData } from '@/modules/channels/helpers/telegram.helpers';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { ChannelRecord } from '@/modules/channels/typedefs/channel.typedefs';
import type { ReceiveTelegramUpdateInput } from '@/modules/channels/typedefs/channel.typedefs';
import type { TelegramCallbackQuery } from '@/modules/channels/typedefs/telegram.typedefs';
import { ConversationRunsService, IncomingMessagesService } from '@/modules/conversations';
import type { IncomingMessageResult } from '@/modules/conversations';
import { ClockService } from '@/platform/clock/services/clock.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class TelegramUpdatesService {
  private readonly logger = new Logger(TelegramUpdatesService.name);

  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly channelEvents: ChannelEventsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly secureTokens: SecureTokenService,
    private readonly incoming: IncomingMessagesService,
    private readonly runs: ConversationRunsService,
    private readonly telegram: TelegramGateway,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async handleTelegramUpdate(
    ctx: UseCaseCtx,
    input: ReceiveTelegramUpdateInput,
  ): Promise<IncomingMessageResult | null> {
    requireSystemActor(ctx);
    const { workspaceId } = ctx;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    return this.tenantTransactions.run(workspaceId, async () => {
      const channel = await this.channels.findById(workspaceId, input.channelId);
      if (channel === null || channel.kind !== ChannelKind.Telegram) {
        if (input.webhookSecret !== undefined) {
          throw new ChannelNotFoundError();
        }
        return null;
      }
      if (input.webhookSecret !== undefined) {
        if (input.webhookSecret === null) {
          throw new TelegramWebhookUnauthorizedError();
        }
        const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
        if (
          !('webhookSecretHash' in credentials) ||
          !this.secureTokens.matches(input.webhookSecret, credentials.webhookSecretHash)
        ) {
          throw new TelegramWebhookUnauthorizedError();
        }
      }
      if (channel.status !== ChannelStatus.Connected) {
        return null;
      }
      const callbackQuery = input.update.callbackQuery;
      if (callbackQuery !== null) {
        return this.handleCallbackQuery(
          ctx,
          workspaceId,
          channel,
          input.update.updateId,
          callbackQuery,
        );
      }
      const message = input.update.message;
      if (message === null) {
        return null;
      }
      const mapped = toIncomingMessageInput(channel, message);
      if (mapped === null) {
        return null;
      }
      const inserted = await this.channelEvents.insertIfAbsent({
        id: this.ids.generate(),
        workspaceId,
        channelId: channel.id,
        externalId: input.update.updateId,
        type: ChannelEventType.Message,
        senderExternalId: message.senderId ?? message.chatId,
        senderName: message.senderName,
        text: message.text,
        sentAt: message.sentAt,
        receivedAt: this.clock.now(),
      });
      if (!inserted) {
        return null;
      }
      return this.incoming.handleIncomingMessage(ctx, mapped);
    });
  }

  private async handleCallbackQuery(
    ctx: UseCaseCtx,
    workspaceId: string,
    channel: ChannelRecord,
    updateId: string,
    query: TelegramCallbackQuery,
  ): Promise<IncomingMessageResult | null> {
    const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
    if (!('botToken' in credentials)) {
      throw new ChannelNotFoundError();
    }
    if (query.data === null || query.chatId === null) {
      return this.dropCallbackQuery(credentials.botToken, query, null);
    }
    const callback = parseTelegramQuickReplyCallbackData(query.data);
    if (callback === null) {
      return this.dropCallbackQuery(credentials.botToken, query, TELEGRAM_QUICK_REPLY_EXPIRED_TEXT);
    }
    const text = await this.runs.quickReplyText({
      workspaceId,
      messageId: callback.messageId,
      index: callback.index,
      channelId: channel.id,
      endUserExternalId: query.chatId,
    });
    if (text === null) {
      return this.dropCallbackQuery(credentials.botToken, query, TELEGRAM_QUICK_REPLY_EXPIRED_TEXT);
    }
    await this.answerCallbackQuery(credentials.botToken, query, null);
    const mapped = toIncomingQuickReplyInput(channel, query, text);
    if (mapped === null) {
      return null;
    }
    const receivedAt = this.clock.now();
    const inserted = await this.channelEvents.insertIfAbsent({
      id: this.ids.generate(),
      workspaceId,
      channelId: channel.id,
      externalId: updateId,
      type: ChannelEventType.QuickReply,
      senderExternalId: query.senderId,
      senderName: query.senderName,
      text,
      sentAt: receivedAt,
      receivedAt,
    });
    if (!inserted) {
      return null;
    }
    return this.incoming.handleIncomingMessage(ctx, mapped);
  }

  private async dropCallbackQuery(
    token: string,
    query: TelegramCallbackQuery,
    text: string | null,
  ): Promise<null> {
    await this.answerCallbackQuery(token, query, text);
    return null;
  }

  private async answerCallbackQuery(
    token: string,
    query: TelegramCallbackQuery,
    text: string | null,
  ): Promise<void> {
    try {
      await this.telegram.answerCallbackQuery({
        token,
        callbackQueryId: query.id,
        text,
        showAlert: false,
      });
    } catch (error) {
      this.logger.warn({
        msg: ChannelUpdatesLogMessage.AnswerCallbackFailed,
        callbackQueryId: query.id,
        err: error,
      });
    }
  }
}
