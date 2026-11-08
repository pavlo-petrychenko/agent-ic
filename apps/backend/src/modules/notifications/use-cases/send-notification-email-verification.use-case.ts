import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { UsersRepository, WorkspacesRepository } from '@/modules/identity';
import { EmailTemplate } from '@/modules/notifications/constants/notification-metrics.constants';
import {
  NotificationChannel,
  NOTIFICATION_EMAIL_VERIFICATION_TTL_SECONDS,
} from '@/modules/notifications/constants/notification.constants';
import type { NotificationEmailVerificationInput } from '@/modules/notifications/events/notification-email-verification-requested.event';
import { EmailGateway } from '@/modules/notifications/gateways/email.gateway';
import { renderEmail } from '@/modules/notifications/helpers/email-render.helpers';
import {
  notificationEmailVerificationCopy,
  notificationEmailVerificationElement,
  notificationEmailVerificationLink,
} from '@/modules/notifications/helpers/notification-email-verification.helpers';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { getOriginator, requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SendNotificationEmailVerificationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
    private readonly settingsRepository: NotificationSettingsRepository,
    private readonly users: UsersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly email: EmailGateway,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
    private readonly secureTokens: SecureTokenService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: NotificationEmailVerificationInput): Promise<void> {
    requireSystemActor(ctx);
    const initiator = getOriginator(ctx);
    if (initiator.kind !== ActorKind.User || initiator.userId !== input.userId) {
      return;
    }
    const prepared = await this.tenants.run(input.workspaceId, async () => {
      const channelId = await this.settings.channelIdFor(
        input.workspaceId,
        input.userId,
        NotificationChannel.Email,
      );
      const view = await this.settings.describe(input.workspaceId, input.userId);
      if (view.email.email === null || view.email.verifiedAt !== null) {
        return null;
      }
      const [user, workspace] = await Promise.all([
        this.users.findById(input.userId),
        this.workspaces.findById(input.workspaceId),
      ]);
      if (user === null || workspace === null) {
        return null;
      }
      const token = this.secureTokens.generate();
      const expiresAt = new Date(
        this.clock.now().getTime() +
          NOTIFICATION_EMAIL_VERIFICATION_TTL_SECONDS * MILLISECONDS_PER_SECOND,
      );
      const stored = await this.settingsRepository.setEmailVerificationToken(
        input.workspaceId,
        channelId,
        token.hash,
        expiresAt,
      );
      return stored ? { user, workspace, email: view.email.email, token: token.token } : null;
    });
    if (prepared === null) {
      return;
    }
    const props = {
      locale: prepared.user.locale,
      name: prepared.user.name,
      workspaceName: prepared.workspace.name,
      email: prepared.email,
      link: notificationEmailVerificationLink(
        this.config.config.publicUrl,
        this.ids.toPublic(IdPrefix.Workspace, input.workspaceId),
        prepared.token,
      ),
    };
    const copy = notificationEmailVerificationCopy(props);
    const rendered = await renderEmail(notificationEmailVerificationElement(props, copy));
    await this.email.send({
      template: EmailTemplate.NotificationEmailVerification,
      to: prepared.email,
      subject: copy.subject,
      ...rendered,
    });
  }
}
