import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  API_CHANNEL_WEBHOOK_TIMEOUT_MS,
  ApiChannelWebhookHeader,
} from '@/modules/channels/constants/api-channel-webhook.constants';
import { ApiChannelWebhookMissingError } from '@/modules/channels/errors/api-channel-webhook-missing.error';
import { ApiChannelWebhookSecretMissingError } from '@/modules/channels/errors/api-channel-webhook-secret-missing.error';
import { ApiChannelWebhookError } from '@/modules/channels/errors/api-channel-webhook.error';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import {
  apiChannelWebhookTimestamp,
  signApiChannelWebhook,
} from '@/modules/channels/helpers/api-channel-webhook.helpers';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { ChannelOutboundMessage } from '@/modules/channels/typedefs/channel-message.typedefs';
import type { ChannelRecord } from '@/modules/channels/typedefs/channel.typedefs';
import { ChannelKind } from '@/modules/conversations';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { IdService } from '@/platform/ids/services/id.service';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';

@Injectable()
export class ApiChannelAdapter extends ChannelAdapter {
  readonly kind = ChannelKind.Api;

  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly outbound: OutboundHttpGateway,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {
    super();
  }

  async send(message: ChannelOutboundMessage): Promise<void> {
    const channel = await this.loadChannel(message);
    if (!('webhook' in channel.identity) || channel.identity.webhook === null) {
      throw new ApiChannelWebhookMissingError();
    }
    const webhook = channel.identity.webhook;
    const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
    if (!('secretKeyHash' in credentials) || !credentials.webhookSigningSecret) {
      throw new ApiChannelWebhookSecretMissingError();
    }

    const body = JSON.stringify({
      conversation_id: this.ids.toPublic(IdPrefix.Conversation, message.conversationId),
      message_id: this.ids.toPublic(IdPrefix.Message, message.messageId),
      user_id: message.endUserExternalId,
      text: message.text,
      quick_replies: message.quickReplies,
    });
    const timestamp = apiChannelWebhookTimestamp(this.clock.now());
    const deliveryId = this.ids.toPublic(IdPrefix.Message, message.messageId);
    const result = await this.outbound.send({
      method: 'POST',
      url: webhook,
      headers: {
        [HttpHeader.ContentType]: 'application/json',
        [ApiChannelWebhookHeader.Signature]: signApiChannelWebhook(
          credentials.webhookSigningSecret,
          timestamp,
          body,
        ),
        [ApiChannelWebhookHeader.Timestamp]: timestamp,
        [ApiChannelWebhookHeader.Delivery]: deliveryId,
      },
      body,
      timeoutMs: API_CHANNEL_WEBHOOK_TIMEOUT_MS,
    });
    if (
      result.outcome !== OutboundHttpOutcome.Responded ||
      result.status === null ||
      result.status < 200 ||
      result.status >= 300
    ) {
      throw new ApiChannelWebhookError(result.outcome, result.status);
    }
  }

  isChannelBroken(_error: unknown): boolean {
    return false;
  }

  private async loadChannel(message: ChannelOutboundMessage): Promise<ChannelRecord> {
    const channelId = message.channelId;
    const channel =
      channelId === null
        ? null
        : await this.tenantTransactions.run(message.workspaceId, () =>
            this.channels.findById(message.workspaceId, channelId),
          );
    if (channel === null || channel.kind !== ChannelKind.Api) {
      throw new ChannelNotFoundError();
    }
    return channel;
  }
}
