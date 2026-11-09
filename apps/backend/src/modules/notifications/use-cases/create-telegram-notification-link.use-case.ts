import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  TELEGRAM_LINK_CODE_LENGTH,
  TELEGRAM_LINK_CODE_TTL_MINUTES,
} from '@/modules/notifications/constants/notification.constants';
import { TelegramAlertsNotConfiguredError } from '@/modules/notifications/errors/telegram-alerts-not-configured.error';
import { notificationActorOf } from '@/modules/notifications/helpers/notification-actor.helpers';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import type { TelegramNotificationLinkView } from '@/modules/notifications/typedefs/telegram-link.typedefs';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CreateTelegramNotificationLinkUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
    private readonly settingsRepository: NotificationSettingsRepository,
    private readonly secureTokens: SecureTokenService,
    private readonly configService: ConfigService,
    private readonly clock: ClockService,
  ) {}

  execute(ctx: UseCaseCtx): Promise<TelegramNotificationLinkView> {
    const { workspaceId, userId } = notificationActorOf(ctx);
    const { alertsBotToken, alertsBotUsername } = this.configService.config.telegram;
    if (alertsBotToken === null || alertsBotUsername === null) {
      throw new TelegramAlertsNotConfiguredError();
    }
    return this.tenants.run(workspaceId, async () => {
      const channelId = await this.settings.channelIdFor(
        workspaceId,
        userId,
        NotificationChannel.Telegram,
      );
      const code = this.secureTokens.generateDigits(TELEGRAM_LINK_CODE_LENGTH);
      const expiresAt = new Date(
        this.clock.now().getTime() +
          TELEGRAM_LINK_CODE_TTL_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
      );
      await this.settingsRepository.setTelegramLinkCode(
        workspaceId,
        channelId,
        this.secureTokens.hash(code),
        expiresAt,
      );
      return { code, botUsername: alertsBotUsername, expiresAt };
    });
  }
}
