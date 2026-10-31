import { Injectable } from '@nestjs/common';
import {
  TELEGRAM_BOT_RATE_LIMIT,
  TELEGRAM_CHAT_RATE_LIMIT,
  TELEGRAM_RATE_LIMIT_SUBJECT_SEPARATOR,
} from '@/modules/channels/constants/telegram-rate-limit.constants';
import { TelegramChatAction } from '@/modules/channels/constants/telegram.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { isTelegramTokenInvalid } from '@/modules/channels/helpers/telegram-error.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
import type { ChannelRecord } from '@/modules/channels/typedefs/channel.typedefs';
import { ChannelKind } from '@/modules/conversations';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class TelegramChannelAdapter extends ChannelAdapter {
  readonly kind = ChannelKind.Telegram;

  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly telegram: TelegramGateway,
    private readonly rateLimits: RateLimitService,
  ) {
    super();
  }

  async send(message: ChannelOutboundMessage): Promise<void> {
    const channel = await this.loadChannel(message);
    const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
    if (!('botToken' in credentials)) {
      throw new ChannelNotFoundError();
    }
    await this.rateLimits.enforce(TELEGRAM_BOT_RATE_LIMIT, channel.id);
    await this.rateLimits.enforce(
      TELEGRAM_CHAT_RATE_LIMIT,
      [channel.id, message.endUserExternalId].join(TELEGRAM_RATE_LIMIT_SUBJECT_SEPARATOR),
    );
    if (channel.showTyping) {
      await this.telegram.sendChatAction({
        token: credentials.botToken,
        chatId: message.endUserExternalId,
        action: TelegramChatAction.Typing,
      });
    }
    await this.telegram.sendMessage({
      token: credentials.botToken,
      chatId: message.endUserExternalId,
      messageId: message.messageId,
      text: message.text,
      quickReplies: message.quickReplies,
    });
  }

  isChannelBroken(error: unknown): boolean {
    return isTelegramTokenInvalid(error);
  }

  private async loadChannel(message: ChannelOutboundMessage): Promise<ChannelRecord> {
    const channelId = message.channelId;
    const channel =
      channelId === null
        ? null
        : await this.tenantTransactions.run(message.workspaceId, () =>
            this.channels.findById(message.workspaceId, channelId),
          );
    if (channel === null || channel.kind !== ChannelKind.Telegram) {
      throw new ChannelNotFoundError();
    }
    return channel;
  }
}
