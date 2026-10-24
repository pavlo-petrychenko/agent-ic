import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { TELEGRAM_ALLOWED_UPDATES } from '@/modules/channels/constants/telegram.constants';
import { TelegramApiError } from '@/modules/channels/errors/telegram-api.error';
import { TelegramTokenInvalidError } from '@/modules/channels/errors/telegram-token-invalid.error';
import { TelegramGateway } from '@/modules/channels/gateways/telegram.gateway';
import { telegramWebhookUrl } from '@/modules/channels/helpers/telegram.helpers';
import { ChannelTokenService } from '@/modules/channels/services/channel-token.service';
import type {
  RegisterTelegramWebhookInput,
  TelegramBot,
  TelegramConnectionCredentials,
} from '@/modules/channels/typedefs/telegram.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class TelegramChannelService {
  constructor(
    private readonly telegram: TelegramGateway,
    private readonly channelTokens: ChannelTokenService,
    private readonly secureTokens: SecureTokenService,
    private readonly config: ConfigService,
    private readonly ids: IdService,
  ) {}

  async readBot(token: string): Promise<TelegramBot> {
    try {
      return await this.telegram.getMe(token);
    } catch (error) {
      if (error instanceof TelegramApiError && (error.status === 401 || error.status === 404)) {
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

  async registerWebhook(input: RegisterTelegramWebhookInput): Promise<void> {
    await this.telegram.setWebhook({
      token: input.token,
      url: telegramWebhookUrl(
        this.config.config.publicUrl,
        this.ids.toPublic(IdPrefix.Workspace, input.workspaceId),
        this.ids.toPublic(IdPrefix.Channel, input.channelId),
      ),
      secret: input.secret,
      allowedUpdates: TELEGRAM_ALLOWED_UPDATES,
    });
  }
}
