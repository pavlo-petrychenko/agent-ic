import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationsRepository } from '@/modules/notifications/repositories/notifications.repository';
import type { MarkNotificationsReadInput } from '@/modules/notifications/typedefs/notification.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class MarkNotificationsReadUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: NotificationsRepository,
    private readonly ids: IdService,
    private readonly clock: ClockService,
  ) {}

  execute(ctx: UseCaseCtx, input: MarkNotificationsReadInput): Promise<number> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    const conversationId = this.ids.fromPublic(IdPrefix.Conversation, input.conversationId);
    return this.tenants.run(workspaceId, () =>
      this.notifications.markPlatformReadForConversation(
        workspaceId,
        userId,
        conversationId,
        this.clock.now(),
      ),
    );
  }
}
