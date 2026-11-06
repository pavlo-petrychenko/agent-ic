import { Injectable } from '@nestjs/common';
import { ConversationMode, MessagesRepository } from '@/modules/conversations';
import {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationKind,
  NotificationsRepository,
  NotificationRecipientsService,
} from '@/modules/notifications';
import type { RunEscalatedPayload } from '@/modules/runs/typedefs/run-event.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class CreateEscalationNotificationsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly recipients: NotificationRecipientsService,
    private readonly notifications: NotificationsRepository,
    private readonly messages: MessagesRepository,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, payload: RunEscalatedPayload): Promise<void> {
    requireSystemActor(ctx);
    if (payload.mode !== ConversationMode.Live) {
      return;
    }
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    await this.tenants.run(workspaceId, () => this.create(workspaceId, payload));
  }

  private async create(workspaceId: string, payload: RunEscalatedPayload): Promise<void> {
    const recipients = await this.recipients.recipientsFor(
      workspaceId,
      payload.versionId,
      payload.nodeId,
    );
    if (recipients.length === 0) {
      return;
    }
    const lastCustomerMessage = await this.messages.findLatestCustomerMessage(
      workspaceId,
      payload.conversationId,
    );
    const lastCustomerMessageId = lastCustomerMessage?.id ?? null;
    for (const recipient of recipients) {
      const notificationId = await this.notifications.insertIfAbsent({
        id: this.ids.generate(),
        workspaceId,
        userId: recipient.userId,
        runStepId: payload.runStepId,
        kind: NotificationKind.Escalation,
        lastCustomerMessageId,
      });
      for (const channel of recipient.channels) {
        const sent = channel === NotificationChannel.Platform;
        await this.notifications.insertDeliveryIfAbsent({
          id: this.ids.generate(),
          workspaceId,
          notificationId,
          channel,
          status: sent ? NotificationDeliveryStatus.Delivered : NotificationDeliveryStatus.Pending,
          sentAt: sent ? this.clock.now() : null,
          readAt: null,
        });
      }
    }
  }
}
