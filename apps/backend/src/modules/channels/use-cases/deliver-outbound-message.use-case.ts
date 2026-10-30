import { Injectable, Logger } from '@nestjs/common';
import { ChannelLogMessage } from '@/modules/channels/constants/channel-delivery.constants';
import { ChannelHealthLogMessage } from '@/modules/channels/constants/channel-health.constants';
import { ChannelSendOutcome } from '@/modules/channels/constants/channel-metrics.constants';
import type { ChannelAdapter } from '@/modules/channels/gateways/channel-adapter.gateway';
import {
  deliveryChannelKind,
  toChannelOutboundMessage,
} from '@/modules/channels/helpers/channel-delivery.helpers';
import { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
import { ChannelHealthService } from '@/modules/channels/services/channel-health.service';
import { ChannelMetricsService } from '@/modules/channels/services/channel-metrics.service';
import { ConversationRunsService, MessageDelivery } from '@/modules/conversations';
import type { OutboundQueuedPayload } from '@/modules/conversations';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class DeliverOutboundMessageUseCase {
  private readonly logger = new Logger(DeliverOutboundMessageUseCase.name);

  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly conversationRuns: ConversationRunsService,
    private readonly adapters: ChannelAdapterRegistryService,
    private readonly health: ChannelHealthService,
    private readonly metrics: ChannelMetricsService,
  ) {}

  async execute(ctx: UseCaseCtx, input: OutboundQueuedPayload): Promise<void> {
    requireSystemActor(ctx);
    const { workspaceId } = ctx;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const delivery = await this.tenantTransactions.run(workspaceId, () =>
      this.conversationRuns.outboundDelivery(workspaceId, input.messageId),
    );
    if (delivery.message.delivery === MessageDelivery.Delivered) {
      return;
    }
    const channelKind = deliveryChannelKind(delivery.conversation);
    let adapter: ChannelAdapter | null = null;
    try {
      adapter = this.adapters.adapterFor(channelKind);
      await adapter.send(toChannelOutboundMessage(delivery));
    } catch (error) {
      this.metrics.messageSent(channelKind, ChannelSendOutcome.Failed);
      if (adapter?.isChannelBroken(error) === true) {
        await this.markChannelBroken(workspaceId, delivery.conversation.channelId, input.messageId);
      }
      await this.markDelivery(workspaceId, input.messageId, MessageDelivery.Failed).catch(
        (markError: unknown) => {
          this.logger.error({
            msg: ChannelLogMessage.MarkFailedError,
            messageId: input.messageId,
            err: markError,
          });
        },
      );
      throw error;
    }
    this.metrics.messageSent(channelKind, ChannelSendOutcome.Delivered);
    await this.markDelivery(workspaceId, input.messageId, MessageDelivery.Delivered);
  }

  private markDelivery(
    workspaceId: string,
    messageId: string,
    delivery: MessageDelivery,
  ): Promise<void> {
    return this.tenantTransactions.run(workspaceId, () =>
      this.conversationRuns.markDelivery(workspaceId, messageId, delivery),
    );
  }

  private async markChannelBroken(
    workspaceId: string,
    channelId: string | null,
    messageId: string,
  ): Promise<void> {
    if (channelId === null) {
      return;
    }
    await this.health.markBroken(workspaceId, channelId).catch((error: unknown) => {
      this.logger.error({
        msg: ChannelHealthLogMessage.MarkBrokenError,
        channelId,
        messageId,
        err: error,
      });
    });
  }
}
