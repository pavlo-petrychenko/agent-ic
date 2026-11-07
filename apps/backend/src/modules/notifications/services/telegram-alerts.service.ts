import { Injectable, Logger } from '@nestjs/common';
import { NotificationLogMessage } from '@/modules/notifications/constants/notification-log.constants';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import { TELEGRAM_ALERTS_LINK_INSTRUCTIONS } from '@/modules/notifications/constants/telegram-alert.constants';
import {
  telegramLinkCodeFromMessage,
  telegramLinkReply,
} from '@/modules/notifications/helpers/telegram-link.helpers';
import { NotificationSettingsRepository } from '@/modules/notifications/repositories/notification-settings.repository';
import { TelegramLinkRepository } from '@/modules/notifications/repositories/telegram-link.repository';
import { NotificationSettingsService } from '@/modules/notifications/services/notification-settings.service';
import {
  TelegramLinkStatus,
  type TelegramLinkResult,
} from '@/modules/notifications/typedefs/telegram-link.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { TelegramGateway } from '@/platform/telegram/gateways/telegram.gateway';
import type { TelegramUpdate } from '@/platform/telegram/typedefs/telegram.typedefs';

@Injectable()
export class TelegramAlertsService {
  private readonly logger = new Logger(TelegramAlertsService.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
    private readonly settingsRepository: NotificationSettingsRepository,
    private readonly links: TelegramLinkRepository,
    private readonly secureTokens: SecureTokenService,
    private readonly configService: ConfigService,
    private readonly clock: ClockService,
    private readonly telegram: TelegramGateway,
  ) {}

  async handleUpdate(ctx: UseCaseCtx, update: TelegramUpdate): Promise<TelegramLinkResult | null> {
    requireSystemActor(ctx);
    const message = update.message;
    if (message === null || message.text === null) {
      return null;
    }
    const code = telegramLinkCodeFromMessage(message.text);
    if (code === null) {
      await this.reply(message.chatId, TELEGRAM_ALERTS_LINK_INSTRUCTIONS);
      return null;
    }
    const linkCodeHash = this.secureTokens.hash(code);
    const located = await this.links.findByCodeHash(linkCodeHash);
    if (located === null) {
      const result: TelegramLinkResult = {
        status: TelegramLinkStatus.Invalid,
        username: null,
      };
      await this.reply(message.chatId, telegramLinkReply(result.status));
      return result;
    }
    const result = await this.tenants.run(located.workspaceId, async () => {
      const link = await this.settingsRepository.findTelegramLinkByCodeHash(
        located.workspaceId,
        linkCodeHash,
      );
      if (link === null) {
        return { status: TelegramLinkStatus.Invalid, username: null } satisfies TelegramLinkResult;
      }
      if (
        link.linkCodeExpiresAt === null ||
        link.linkCodeExpiresAt.getTime() < this.clock.now().getTime()
      ) {
        await this.settingsRepository.clearTelegramLinkCode(located.workspaceId, link.channelId);
        return { status: TelegramLinkStatus.Expired, username: null } satisfies TelegramLinkResult;
      }
      if (link.chatId !== null && link.chatId !== message.chatId) {
        return {
          status: TelegramLinkStatus.AlreadyLinked,
          username: null,
        } satisfies TelegramLinkResult;
      }
      await this.settingsRepository.linkTelegramChat(
        located.workspaceId,
        link.channelId,
        message.chatId,
        message.senderUsername,
        this.clock.now(),
      );
      await this.settings.setChannelEnabled(
        located.workspaceId,
        link.userId,
        NotificationChannel.Telegram,
        true,
      );
      return {
        status: TelegramLinkStatus.Linked,
        username: message.senderUsername,
      } satisfies TelegramLinkResult;
    });
    await this.reply(message.chatId, telegramLinkReply(result.status));
    return result;
  }

  private async reply(chatId: string, text: string): Promise<void> {
    const token = this.configService.config.telegram.alertsBotToken;
    if (token === null) {
      return;
    }
    try {
      await this.telegram.sendMessage({
        token,
        chatId,
        text,
        replyMarkup: null,
      });
    } catch (error) {
      this.logger.warn({
        msg: NotificationLogMessage.TelegramAlertsReplyFailed,
        chatId,
        err: error,
      });
    }
  }
}
