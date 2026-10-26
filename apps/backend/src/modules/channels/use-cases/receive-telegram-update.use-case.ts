import { ChannelKind } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelEventType } from '@/modules/channels/constants/channel-event.constants';
import { ChannelStatus } from '@/modules/channels/constants/channel.constants';
import { toIncomingMessageInput } from '@/modules/channels/helpers/telegram-update.helpers';
import { ChannelEventsRepository } from '@/modules/channels/repositories/channel-events.repository';
import { ChannelsRepository } from '@/modules/channels/repositories/channels.repository';
import type { ReceiveTelegramUpdateInput } from '@/modules/channels/typedefs/channel.typedefs';
import { IncomingMessagesService } from '@/modules/conversations';
import type { IncomingMessageResult } from '@/modules/conversations';
import { ClockService } from '@/platform/clock/services/clock.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ReceiveTelegramUpdateUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly channels: ChannelsRepository,
    private readonly channelEvents: ChannelEventsRepository,
    private readonly incoming: IncomingMessagesService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(
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
      if (
        channel === null ||
        channel.kind !== ChannelKind.Telegram ||
        channel.status !== ChannelStatus.Connected
      ) {
        return null;
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
}
