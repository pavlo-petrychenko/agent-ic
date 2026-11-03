import { Injectable, Logger } from '@nestjs/common';
import type { BeforeApplicationShutdown, OnApplicationBootstrap } from '@nestjs/common';
import { ChannelHealthLogMessage } from '@/modules/channels/constants/channel-health.constants';
import {
  ChannelPollerLogMessage,
  TELEGRAM_POLL_IDLE_MS,
} from '@/modules/channels/constants/channel-poller.constants';
import { TELEGRAM_ALLOWED_UPDATES } from '@/modules/channels/constants/telegram.constants';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { isTelegramTokenInvalid } from '@/modules/channels/helpers/telegram-error.helpers';
import { TelegramPollerRepository } from '@/modules/channels/repositories/telegram-poller.repository';
import { ChannelHealthService } from '@/modules/channels/services/channel-health.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import { TelegramUpdatesService } from '@/modules/channels/services/telegram-updates.service';
import type {
  TelegramPollerChannel,
  TelegramUpdate,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TelegramTransport } from '@/platform/config/constants/telegram.constants';
import { ConfigService } from '@/platform/config/services/config.service';
import { SystemReason } from '@/platform/context/constants/actor.constants';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';

@Injectable()
export class TelegramPollerService implements OnApplicationBootstrap, BeforeApplicationShutdown {
  private readonly logger = new Logger(TelegramPollerService.name);
  private readonly offsets = new Map<string, number>();
  private stopped = false;
  private loop: Promise<void> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly pollerChannels: TelegramPollerRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly channelHealth: ChannelHealthService,
    private readonly telegram: TelegramGateway,
    private readonly updates: TelegramUpdatesService,
    private readonly contexts: UseCaseCtxService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  onApplicationBootstrap(): void {
    const { config } = this.configService;
    if (config.role !== Role.Gateway || config.telegram.transport !== TelegramTransport.Polling) {
      return;
    }
    this.logger.log({ msg: ChannelPollerLogMessage.Started });
    this.loop = this.run();
  }

  async beforeApplicationShutdown(): Promise<void> {
    this.stopped = true;
    if (this.loop === null) {
      return;
    }
    await this.loop;
    this.logger.log({ msg: ChannelPollerLogMessage.Stopped });
  }

  async pollChannel(channel: TelegramPollerChannel): Promise<void> {
    const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
    if (!('botToken' in credentials)) {
      return;
    }
    let updates: TelegramUpdate[];
    try {
      updates = await this.telegram.getUpdates({
        token: credentials.botToken,
        offset: this.offsets.get(channel.id) ?? 0,
        timeoutSeconds: this.configService.config.telegram.pollTimeoutSeconds,
        allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
      });
    } catch (error) {
      if (isTelegramTokenInvalid(error)) {
        await this.channelHealth
          .markBroken(channel.workspaceId, channel.id)
          .catch((markError: unknown) => {
            this.logger.error({
              msg: ChannelHealthLogMessage.MarkBrokenError,
              channelId: channel.id,
              err: markError,
            });
          });
      }
      this.logger.warn({
        msg: ChannelPollerLogMessage.PollFailed,
        channelId: channel.id,
        err: error,
      });
      await this.clock.sleep(this.retryDelay(error));
      return;
    }
    for (const update of updates) {
      try {
        await this.updates.handleTelegramUpdate(
          this.contexts.system({
            reason: SystemReason.ChannelIngress,
            workspaceId: channel.workspaceId,
            traceId: this.ids.generate(),
            initiatedBy: null,
          }),
          { channelId: channel.id, update },
        );
      } catch (error) {
        this.logger.error({
          msg: ChannelPollerLogMessage.UpdateFailed,
          channelId: channel.id,
          err: error,
        });
        return;
      }
      this.offsets.set(channel.id, Number(update.updateId) + 1);
    }
  }

  private async run(): Promise<void> {
    while (!this.stopped) {
      try {
        const channels = await this.pollerChannels.listConnected();
        if (channels.length === 0) {
          await this.clock.sleep(TELEGRAM_POLL_IDLE_MS);
          continue;
        }
        await Promise.all(channels.map((channel) => this.pollChannel(channel)));
      } catch (error) {
        this.logger.warn({ msg: ChannelPollerLogMessage.PollFailed, err: error });
        await this.clock.sleep(TELEGRAM_POLL_IDLE_MS);
      }
    }
  }

  private retryDelay(error: unknown): number {
    if (error instanceof TelegramApiError && error.retryAfterSeconds !== null) {
      return error.retryAfterSeconds * MILLISECONDS_PER_SECOND;
    }
    return TELEGRAM_POLL_IDLE_MS;
  }
}
