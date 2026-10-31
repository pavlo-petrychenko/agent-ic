import { Injectable, Logger } from '@nestjs/common';
import {
  ChannelHealthLogMessage,
  TELEGRAM_HEALTH_CHECK_CONCURRENCY,
} from '@/modules/channels/constants/channel-health.constants';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { isTelegramTokenInvalid } from '@/modules/channels/helpers/telegram-error.helpers';
import { TelegramPollerRepository } from '@/modules/channels/repositories/telegram-poller.repository';
import { ChannelHealthService } from '@/modules/channels/services/channel-health.service';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type {
  TelegramPollerChannel,
  TelegramTokenHealthResult,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { TelegramTransport } from '@/platform/config/constants/telegram.constants';
import { ConfigService } from '@/platform/config/services/config.service';

@Injectable()
export class TelegramTokenHealthService {
  private readonly logger = new Logger(TelegramTokenHealthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly channels: TelegramPollerRepository,
    private readonly channelTokens: ChannelTokenService,
    private readonly telegram: TelegramGateway,
    private readonly health: ChannelHealthService,
  ) {}

  async checkConnected(): Promise<TelegramTokenHealthResult> {
    if (this.configService.config.telegram.transport !== TelegramTransport.Webhook) {
      return { checked: 0, broken: 0 };
    }
    const channels = await this.channels.listConnected();
    let checked = 0;
    let broken = 0;
    for (let start = 0; start < channels.length; start += TELEGRAM_HEALTH_CHECK_CONCURRENCY) {
      const batch = channels.slice(start, start + TELEGRAM_HEALTH_CHECK_CONCURRENCY);
      const results = await Promise.all(batch.map((channel) => this.checkChannel(channel)));
      checked += results.length;
      broken += results.filter((transitioned) => transitioned).length;
    }
    this.logger.log({ msg: ChannelHealthLogMessage.CheckFinished, checked, broken });
    return { checked, broken };
  }

  private async checkChannel(channel: TelegramPollerChannel): Promise<boolean> {
    try {
      const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
      if (!('botToken' in credentials)) {
        return false;
      }
      await this.telegram.getWebhookInfo(credentials.botToken);
      return false;
    } catch (error) {
      if (isTelegramTokenInvalid(error)) {
        return this.health.markBroken(channel.workspaceId, channel.id);
      }
      this.logger.warn({
        msg: ChannelHealthLogMessage.CheckFailed,
        channelId: channel.id,
        err: error,
      });
      return false;
    }
  }
}
