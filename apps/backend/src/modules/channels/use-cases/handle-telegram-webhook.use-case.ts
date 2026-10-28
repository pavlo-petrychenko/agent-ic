import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { parseChannelInput } from '@/modules/channels/helpers/channel-input.helpers';
import { toTelegramUpdate } from '@/modules/channels/helpers/telegram-update.helpers';
import { telegramWebhookUpdateSchema } from '@/modules/channels/schemas/telegram.schema';
import { TelegramUpdatesService } from '@/modules/channels/services/telegram-updates.service';
import type { HandleTelegramWebhookInput } from '@/modules/channels/typedefs/channel.typedefs';
import { TelegramTransport } from '@/platform/config/constants/telegram.constants';
import { ConfigService } from '@/platform/config/services/config.service';
import { SystemReason } from '@/platform/context/constants/actor.constants';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class HandleTelegramWebhookUseCase {
  constructor(
    private readonly configService: ConfigService,
    private readonly contexts: UseCaseCtxService,
    private readonly updates: TelegramUpdatesService,
    private readonly ids: IdService,
  ) {}

  async execute(input: HandleTelegramWebhookInput): Promise<void> {
    if (this.configService.config.telegram.transport !== TelegramTransport.Webhook) {
      throw new ChannelNotFoundError();
    }
    const update = parseChannelInput(telegramWebhookUpdateSchema, input.body);
    const workspaceId = this.ids.fromPublic(IdPrefix.Workspace, input.workspacePublicId);
    const channelId = this.ids.fromPublic(IdPrefix.Channel, input.channelPublicId);
    await this.updates.handleTelegramUpdate(
      this.contexts.system({
        reason: SystemReason.ChannelIngress,
        workspaceId,
        traceId: this.ids.generate(),
        initiatedBy: null,
      }),
      {
        channelId,
        update: toTelegramUpdate(update),
        webhookSecret: input.secret,
      },
    );
  }
}
