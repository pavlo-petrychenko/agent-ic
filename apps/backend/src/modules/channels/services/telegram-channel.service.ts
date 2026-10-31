import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { TELEGRAM_ALLOWED_UPDATES } from '@/modules/channels/constants/telegram.constants';
import { ChannelNotFoundError } from '@/modules/channels/errors/channel-not-found.error';
import { TelegramTokenInvalidError } from '@/modules/channels/errors/telegram-token-invalid.error';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { isTelegramTokenInvalid } from '@/modules/channels/helpers/telegram-error.helpers';
import { telegramWebhookUrl } from '@/modules/channels/helpers/telegram.helpers';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type { TelegramChannelIdentity } from '@/modules/channels/typedefs/channel-identity.typedefs';
import type { ChannelRecord } from '@/modules/channels/typedefs/channel.typedefs';
import type {
  ConfigureTelegramTransportInput,
  TelegramBot,
  TelegramConnectionCredentials,
  TelegramReconnectPreparation,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { TelegramTransport } from '@/platform/config/constants/telegram.constants';
import { ConfigService } from '@/platform/config/services/config.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class TelegramChannelService {
  constructor(
    private readonly telegram: TelegramGateway,
    private readonly channelTokens: ChannelTokenService,
    private readonly secureTokens: SecureTokenService,
    private readonly configService: ConfigService,
    private readonly ids: IdService,
  ) {}

  async readBot(token: string): Promise<TelegramBot> {
    try {
      return await this.telegram.getMe(token);
    } catch (error) {
      if (isTelegramTokenInvalid(error)) {
        throw new TelegramTokenInvalidError();
      }
      throw error;
    }
  }

  createCredentials(token: string): TelegramConnectionCredentials {
    const secret = this.secureTokens.generate();
    return {
      sealed: this.channelTokens.sealCredentials({
        botToken: token,
        webhookSecretHash: secret.hash,
      }),
      webhookSecret: secret.token,
    };
  }

  async readIdentity(
    channel: Pick<ChannelRecord, 'externalId' | 'credentialsSealed'>,
  ): Promise<TelegramChannelIdentity> {
    const { bot } = await this.openBot(channel);
    return { username: bot.username, firstName: bot.firstName };
  }

  async prepareReconnect(
    channel: Pick<ChannelRecord, 'externalId' | 'credentialsSealed'>,
  ): Promise<TelegramReconnectPreparation> {
    const { token, bot } = await this.openBot(channel);
    const next = this.createCredentials(token);
    return {
      token,
      identity: { username: bot.username, firstName: bot.firstName },
      sealed: next.sealed,
      webhookSecret: next.webhookSecret,
    };
  }

  private async openBot(
    channel: Pick<ChannelRecord, 'externalId' | 'credentialsSealed'>,
  ): Promise<{ token: string; bot: TelegramBot }> {
    const credentials = this.channelTokens.openCredentials(channel.credentialsSealed);
    if (!('botToken' in credentials)) {
      throw new ChannelNotFoundError();
    }
    const bot = await this.readBot(credentials.botToken);
    if (bot.id !== channel.externalId) {
      throw new TelegramTokenInvalidError();
    }
    return { token: credentials.botToken, bot };
  }

  async configureTransport(input: ConfigureTelegramTransportInput): Promise<void> {
    if (!this.usesWebhook()) {
      await this.telegram.deleteWebhook(input.token);
      return;
    }
    await this.telegram.setWebhook({
      token: input.token,
      url: telegramWebhookUrl(
        this.configService.config.publicUrl,
        this.ids.toPublic(IdPrefix.Workspace, input.workspaceId),
        this.ids.toPublic(IdPrefix.Channel, input.channelId),
      ),
      secret: input.secret,
      allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
    });
  }

  async deleteWebhook(token: string): Promise<void> {
    await this.telegram.deleteWebhook(token);
  }

  private usesWebhook(): boolean {
    return this.configService.config.telegram.transport === TelegramTransport.Webhook;
  }
}
