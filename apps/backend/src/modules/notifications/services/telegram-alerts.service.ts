import { IdPrefix, Locale } from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from '@/modules/identity';
import { NotificationLogMessage } from '@/modules/notifications/constants/notification-log.constants';
import { NotificationChannel } from '@/modules/notifications/constants/notification.constants';
import {
  TELEGRAM_ALERTS_LINK_INSTRUCTIONS,
  TELEGRAM_ALERT_TAKE_OVER_COPY,
} from '@/modules/notifications/constants/telegram-alert.constants';
import { telegramAlertTakeOverRequestedEvent } from '@/modules/notifications/events/telegram-alert-take-over-requested.event';
import { parseTelegramTakeOverCallback } from '@/modules/notifications/helpers/telegram-alert-callback.helpers';
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
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TelegramGateway } from '@/platform/telegram/gateways/telegram.gateway';
import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from '@/platform/telegram/typedefs/telegram.typedefs';

@Injectable()
export class TelegramAlertsService {
  private readonly logger = new Logger(TelegramAlertsService.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly settings: NotificationSettingsService,
    private readonly settingsRepository: NotificationSettingsRepository,
    private readonly users: UsersRepository,
    private readonly links: TelegramLinkRepository,
    private readonly secureTokens: SecureTokenService,
    private readonly configService: ConfigService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
    private readonly events: DomainEventsService,
    private readonly telegram: TelegramGateway,
  ) {}

  async handleUpdate(ctx: UseCaseCtx, update: TelegramUpdate): Promise<TelegramLinkResult | null> {
    requireSystemActor(ctx);
    if (update.message !== null) {
      return this.handleMessage(ctx, update.message);
    }
    if (update.callbackQuery !== null) {
      await this.handleCallback(ctx, update.callbackQuery);
    }
    return null;
  }

  private async handleMessage(
    ctx: UseCaseCtx,
    message: TelegramMessage,
  ): Promise<TelegramLinkResult | null> {
    if (message.text === null) {
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

  private async handleCallback(ctx: UseCaseCtx, callback: TelegramCallbackQuery): Promise<void> {
    const parsed = parseTelegramTakeOverCallback(callback.data);
    if (parsed === null) {
      await this.answerCallback(callback.id, TELEGRAM_ALERT_TAKE_OVER_COPY[Locale.En].invalid);
      return;
    }
    const workspaceId = this.ids.tryFromPublic(IdPrefix.Workspace, parsed.workspacePublicId);
    const conversationId = this.ids.tryFromPublic(
      IdPrefix.Conversation,
      parsed.conversationPublicId,
    );
    const chatId = callback.chatId;
    if (workspaceId === null || conversationId === null || chatId === null) {
      await this.answerCallback(callback.id, TELEGRAM_ALERT_TAKE_OVER_COPY[Locale.En].invalid);
      return;
    }
    const target = await this.tenants.run(workspaceId, async () => {
      const link = await this.settingsRepository.findTelegramLinkByChat(workspaceId, chatId);
      if (link === null) {
        return null;
      }
      const user = await this.users.findById(link.userId);
      return { link, locale: user?.locale ?? Locale.En };
    });
    if (target === null) {
      await this.answerCallback(callback.id, TELEGRAM_ALERT_TAKE_OVER_COPY[Locale.En].invalid);
      return;
    }
    const inboxUrl = new URL(
      `/w/${parsed.workspacePublicId}/inbox`,
      this.configService.config.publicUrl,
    );
    inboxUrl.searchParams.set('conversation', parsed.conversationPublicId);
    await this.events.emit({ ...ctx, workspaceId }, telegramAlertTakeOverRequestedEvent, {
      userId: target.link.userId,
      conversationPublicId: parsed.conversationPublicId,
      chatId,
      messageId: callback.telegramMessageId,
      callbackQueryId: callback.id,
      locale: target.locale,
      inboxUrl: inboxUrl.toString(),
    });
  }

  private async answerCallback(callbackQueryId: string, text: string): Promise<void> {
    const token = this.configService.config.telegram.alertsBotToken;
    if (token === null) {
      return;
    }
    try {
      await this.telegram.answerCallbackQuery({
        token,
        callbackQueryId,
        text,
        showAlert: false,
      });
    } catch (error) {
      this.logger.warn({
        msg: NotificationLogMessage.TelegramAlertsCallbackFailed,
        callbackQueryId,
        err: error,
      });
    }
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
