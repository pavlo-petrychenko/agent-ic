import { Injectable } from '@nestjs/common';
import { TelegramAlertsUnauthorizedError } from '@/modules/notifications/errors/telegram-alerts-unauthorized.error';
import { TelegramAlertsService } from '@/modules/notifications/services/telegram-alerts.service';
import type {
  HandleTelegramAlertsWebhookInput,
  TelegramLinkResult,
} from '@/modules/notifications/typedefs/telegram-link.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { SystemReason } from '@/platform/context/constants/actor.constants';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { IdService } from '@/platform/ids/services/id.service';
import { toTelegramUpdate } from '@/platform/telegram/helpers/telegram-update.helpers';
import { telegramWebhookUpdateSchema } from '@/platform/telegram/schemas/telegram-update.schema';

@Injectable()
export class HandleTelegramAlertsUpdateUseCase {
  constructor(
    private readonly configService: ConfigService,
    private readonly contexts: UseCaseCtxService,
    private readonly ids: IdService,
    private readonly alerts: TelegramAlertsService,
  ) {}

  async execute(input: HandleTelegramAlertsWebhookInput): Promise<TelegramLinkResult | null> {
    const { alertsBotToken, alertsWebhookSecret } = this.configService.config.telegram;
    if (
      alertsBotToken === null ||
      alertsWebhookSecret === null ||
      input.secret === undefined ||
      input.secret !== alertsWebhookSecret
    ) {
      throw new TelegramAlertsUnauthorizedError();
    }
    const parsed = telegramWebhookUpdateSchema.safeParse(input.body);
    if (!parsed.success) {
      return null;
    }
    return this.alerts.handleUpdate(
      this.contexts.system({
        reason: SystemReason.TelegramAlertsIngress,
        workspaceId: null,
        traceId: this.ids.generate(),
        initiatedBy: null,
      }),
      toTelegramUpdate(parsed.data),
    );
  }
}
