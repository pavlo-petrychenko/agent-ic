import { Injectable } from '@nestjs/common';
import { notificationEmailVerificationRequestedEvent } from '@/modules/notifications/events/notification-email-verification-requested.event';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type { NotificationSettingsView } from '@/modules/notifications/typedefs/notification-settings.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';

@Injectable()
export class ResendNotificationEmailVerificationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<NotificationSettingsView> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    return this.tenants.run(workspaceId, async () => {
      const view = await this.settings.describe(workspaceId, userId);
      if (view.email.email !== null && view.email.verifiedAt === null) {
        await this.domainEvents.emit(
          ctx,
          notificationEmailVerificationRequestedEvent,
          { workspaceId, userId },
          { durable: true },
        );
      }
      return view;
    });
  }
}
