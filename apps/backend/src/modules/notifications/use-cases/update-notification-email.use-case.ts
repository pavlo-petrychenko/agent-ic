import { Injectable } from '@nestjs/common';
import { InvalidNotificationEmailError } from '@/modules/notifications/errors/invalid-notification-email.error';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { updateNotificationEmailInputSchema } from '@/modules/notifications/schemas/notification-settings.schema';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type {
  NotificationSettingsView,
  UpdateNotificationEmailInput,
} from '@/modules/notifications/typedefs/notification-settings.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class UpdateNotificationEmailUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
  ) {}

  execute(ctx: UseCaseCtx, input: UpdateNotificationEmailInput): Promise<NotificationSettingsView> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    const parsed = updateNotificationEmailInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new InvalidNotificationEmailError();
    }
    return this.tenants.run(workspaceId, () =>
      this.settings.setEmail(workspaceId, userId, parsed.data.email),
    );
  }
}
