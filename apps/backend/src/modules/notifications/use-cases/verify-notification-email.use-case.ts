import { Injectable } from '@nestjs/common';
import { NotificationEmailVerificationExpiredError } from '@/modules/notifications/errors/notification-email-verification-expired.error';
import { NotificationEmailVerificationInvalidError } from '@/modules/notifications/errors/notification-email-verification-invalid.error';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { verifyNotificationEmailInputSchema } from '@/modules/notifications/schemas/notification-settings.schema';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type {
  NotificationSettingsView,
  VerifyNotificationEmailInput,
} from '@/modules/notifications/typedefs/notification-settings.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class VerifyNotificationEmailUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
    private readonly settingsRepository: NotificationSettingsRepository,
    private readonly secureTokens: SecureTokenService,
    private readonly clock: ClockService,
  ) {}

  async execute(
    ctx: UseCaseCtx,
    input: VerifyNotificationEmailInput,
  ): Promise<NotificationSettingsView> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    const parsed = verifyNotificationEmailInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new NotificationEmailVerificationInvalidError();
    }
    return this.tenants.run(workspaceId, async () => {
      const now = this.clock.now();
      const tokenHash = this.secureTokens.hash(parsed.data.token);
      const verification = await this.settingsRepository.findEmailVerification(
        workspaceId,
        userId,
        tokenHash,
      );
      if (
        verification === null ||
        verification.email === null ||
        verification.verifiedAt !== null
      ) {
        throw new NotificationEmailVerificationInvalidError();
      }
      if (
        verification.verificationExpiresAt === null ||
        verification.verificationExpiresAt.getTime() <= now.getTime()
      ) {
        throw new NotificationEmailVerificationExpiredError();
      }
      const verified = await this.settingsRepository.markEmailVerified(
        workspaceId,
        verification.channelId,
        tokenHash,
        now,
      );
      if (!verified) {
        throw new NotificationEmailVerificationInvalidError();
      }
      return this.settings.describe(workspaceId, userId);
    });
  }
}
