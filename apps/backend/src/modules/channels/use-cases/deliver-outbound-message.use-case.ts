import { Injectable, Logger } from '@nestjs/common';
import { ChannelLogMessage } from '@/modules/channels/constants/channel-delivery.constants';
import {
  deliveryChannelKind,
  toChannelOutboundMessage,
} from '@/modules/channels/helpers/channel-delivery.helpers';
import { ChannelAdapterRegistryService } from '@/modules/channels/services/channel-adapter-registry.service';
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
    try {
      await this.adapters
        .adapterFor(deliveryChannelKind(delivery.conversation))
        .send(toChannelOutboundMessage(delivery));
    } catch (error) {
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
}
