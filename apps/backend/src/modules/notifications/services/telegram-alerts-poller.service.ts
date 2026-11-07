import { Injectable, Logger } from '@nestjs/common';
import type { BeforeApplicationShutdown, OnApplicationBootstrap } from '@nestjs/common';
import { NotificationLogMessage } from '@/modules/notifications/constants/notification-log.constants';
import { TELEGRAM_ALERTS_POLL_IDLE_MS } from '@/modules/notifications/constants/telegram-alert.constants';
import { TelegramAlertsService } from '@/modules/notifications/services/telegram-alerts.service';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TelegramTransport } from '@/platform/config/constants/telegram.constants';
import { ConfigService } from '@/platform/config/services/config.service';
import { SystemReason } from '@/platform/context/constants/actor.constants';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TELEGRAM_ALLOWED_UPDATES } from '@/platform/telegram/constants/telegram.constants';
import { TelegramGateway } from '@/platform/telegram/gateways/telegram.gateway';

@Injectable()
export class TelegramAlertsPollerService
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(TelegramAlertsPollerService.name);
  private offset = 0;
  private stopped = false;
  private loop: Promise<void> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegram: TelegramGateway,
    private readonly alerts: TelegramAlertsService,
    private readonly contexts: UseCaseCtxService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  onApplicationBootstrap(): void {
    const { config } = this.configService;
    if (
      config.role !== Role.Gateway ||
      config.telegram.transport !== TelegramTransport.Polling ||
      config.telegram.alertsBotToken === null
    ) {
      return;
    }
    this.logger.log({ msg: NotificationLogMessage.TelegramAlertsPollStarted });
    this.loop = this.run();
  }

  async beforeApplicationShutdown(): Promise<void> {
    this.stopped = true;
    if (this.loop === null) {
      return;
    }
    await this.loop;
  }

  private async run(): Promise<void> {
    while (!this.stopped) {
      const token = this.configService.config.telegram.alertsBotToken;
      if (token === null) {
        return;
      }
      try {
        const updates = await this.telegram.getUpdates({
          token,
          offset: this.offset,
          timeoutSeconds: this.configService.config.telegram.pollTimeoutSeconds,
          allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
        });
        for (const update of updates) {
          await this.alerts.handleUpdate(
            this.contexts.system({
              reason: SystemReason.TelegramAlertsIngress,
              workspaceId: null,
              traceId: this.ids.generate(),
              initiatedBy: null,
            }),
            update,
          );
          this.offset = Number(update.updateId) + 1;
        }
        if (updates.length === 0) {
          await this.clock.sleep(TELEGRAM_ALERTS_POLL_IDLE_MS);
        }
      } catch (error) {
        this.logger.warn({ msg: NotificationLogMessage.TelegramAlertsPollFailed, err: error });
        await this.clock.sleep(TELEGRAM_ALERTS_POLL_IDLE_MS);
      }
    }
  }
}
