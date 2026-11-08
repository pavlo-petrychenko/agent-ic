import { IdPrefix, Locale } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { AgentsRepository } from '@/modules/agents';
import { ConversationsRepository, MessagesRepository } from '@/modules/conversations';
import type { Message } from '@/modules/conversations';
import { UsersRepository, WorkspacesRepository } from '@/modules/identity';
import {
  DELIVERY_LAST_ERROR_MAX_LENGTH,
  DELIVERY_LEASE_SECONDS,
  DELIVERY_MAX_ATTEMPTS,
  DELIVERY_RETRY_BASE_SECONDS,
  DELIVERY_RETRY_MAX_SECONDS,
  EmailGateway,
  EmailTemplate,
  escalationEmailElement,
  escalationEmailSubject,
  escalationTelegramReplyMarkup,
  escalationTelegramText,
  NotificationChannel,
  NotificationKind,
  NotificationsRepository,
  NotificationSettingsService,
  reminderEmailElement,
  reminderEmailSubject,
  reminderTelegramText,
  renderEmail,
  telegramTakeOverCallbackData,
  TelegramAlertsNotConfiguredError,
} from '@/modules/notifications';
import type { NotificationDeliveryRecord, NotificationRecord } from '@/modules/notifications';
import { notificationReasonOf } from '@/modules/runs/helpers/notification-content.helpers';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import type {
  DeliverNotificationInput,
  DeliveryContent,
  SkippedDelivery,
} from '@/modules/runs/typedefs/notification-delivery.typedefs';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { TelegramParseMode } from '@/platform/telegram/constants/telegram.constants';
import { TelegramApiError } from '@/platform/telegram/errors/telegram-api.error';
import { TelegramGateway } from '@/platform/telegram/gateways/telegram.gateway';

@Injectable()
export class DeliverNotificationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: NotificationsRepository,
    private readonly settings: NotificationSettingsService,
    private readonly email: EmailGateway,
    private readonly telegram: TelegramGateway,
    private readonly users: UsersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly agents: AgentsRepository,
    private readonly conversations: ConversationsRepository,
    private readonly steps: RunStepsRepository,
    private readonly runs: RunsRepository,
    private readonly messages: MessagesRepository,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: DeliverNotificationInput): Promise<void> {
    requireSystemActor(ctx);
    if (
      input.channel !== NotificationChannel.Email &&
      input.channel !== NotificationChannel.Telegram
    ) {
      return;
    }
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const content = await this.tenants.run(workspaceId, () => this.load(workspaceId, input));
    if (content === null) {
      return;
    }
    if (content.to === null) {
      await this.fail(workspaceId, content.delivery, null, false);
      return;
    }
    try {
      if (content.delivery.channel === NotificationChannel.Telegram) {
        await this.sendTelegram(content);
      } else {
        await this.sendEmail(content);
      }
    } catch (error) {
      await this.fail(workspaceId, content.delivery, error, true);
      throw error;
    }
    await this.tenants.run(workspaceId, () =>
      this.notifications.markDeliveryDelivered(workspaceId, content.delivery.id, this.clock.now()),
    );
  }

  private async sendEmail(content: DeliveryContent): Promise<void> {
    const reminder = content.kind === NotificationKind.Reminder;
    const props = {
      locale: content.locale,
      customerName: content.customerName,
      agentName: content.agentName,
      recipientEmail: content.to,
      channelKind: content.channelKind,
      reason: content.reason,
      lastMessage: content.lastMessage,
      time: content.time,
      workspaceName: content.workspaceName,
      link: content.link,
      waitingMinutes: content.waitingMinutes,
    };
    const rendered = await renderEmail(
      reminder ? reminderEmailElement(props) : escalationEmailElement(props),
    );
    await this.email.send({
      template: reminder ? EmailTemplate.Reminder : EmailTemplate.Escalation,
      to: content.to,
      subject: reminder
        ? reminderEmailSubject(content.locale, content.customerName, content.waitingMinutes)
        : escalationEmailSubject(content.locale, content.customerName),
      ...rendered,
    });
  }

  private async sendTelegram(content: DeliveryContent): Promise<void> {
    const token = this.config.config.telegram.alertsBotToken;
    if (token === null) {
      throw new TelegramAlertsNotConfiguredError();
    }
    const props = {
      locale: content.locale,
      customerName: content.customerName,
      agentName: content.agentName,
      channelKind: content.channelKind,
      reason: content.reason,
      lastMessage: content.lastMessage,
      waitingMinutes: content.waitingMinutes,
    };
    await this.telegram.sendMessage({
      token,
      chatId: content.to,
      text:
        content.kind === NotificationKind.Reminder
          ? reminderTelegramText(props)
          : escalationTelegramText(props),
      parseMode: TelegramParseMode.Html,
      replyMarkup: escalationTelegramReplyMarkup(content.locale, {
        inboxUrl: content.link,
        takeOverCallbackData:
          content.conversationPublicId === null
            ? null
            : telegramTakeOverCallbackData(content.workspacePublicId, content.conversationPublicId),
      }),
    });
  }

  private async load(
    workspaceId: string,
    input: DeliverNotificationInput,
  ): Promise<DeliveryContent | SkippedDelivery | null> {
    const notification = await this.notifications.findById(workspaceId, input.notificationId);
    if (notification === null) {
      return null;
    }
    const now = this.clock.now();
    const delivery = await this.notifications.claimDelivery(
      workspaceId,
      notification.id,
      input.channel,
      now,
      new Date(now.getTime() + DELIVERY_LEASE_SECONDS * MILLISECONDS_PER_SECOND),
    );
    if (delivery === null) {
      return null;
    }
    const user = await this.users.findById(notification.userId);
    if (user === null) {
      return { delivery, to: null };
    }
    if (input.channel === NotificationChannel.Telegram) {
      const chatId = await this.settings.telegramChatId(workspaceId, notification.userId);
      return chatId === null
        ? { delivery, to: null }
        : this.content(workspaceId, notification, delivery, user, chatId);
    }
    const settings = await this.settings.describe(workspaceId, notification.userId);
    if (!settings.email.enabled) {
      return { delivery, to: null };
    }
    return this.content(
      workspaceId,
      notification,
      delivery,
      user,
      settings.email.email ?? user.email,
    );
  }

  private async content(
    workspaceId: string,
    notification: NotificationRecord,
    delivery: NotificationDeliveryRecord,
    user: Awaited<ReturnType<UsersRepository['findById']>>,
    destination: string,
  ): Promise<DeliveryContent | SkippedDelivery> {
    if (user === null) {
      return { delivery, to: null };
    }
    const step = await this.steps.findById(workspaceId, notification.runStepId);
    const run = step === null ? null : await this.runs.findById(workspaceId, step.runId);
    const conversationId = run?.conversationId ?? null;
    const agent = run === null ? null : await this.agents.findById(workspaceId, run.agentId);
    const conversation =
      run === null ? null : await this.conversations.findById(workspaceId, run.conversationId);
    const lastMessage: Message | null =
      notification.lastCustomerMessageId === null
        ? conversationId === null
          ? null
          : await this.messages.findLatestCustomerMessage(workspaceId, conversationId)
        : await this.messages.findById(workspaceId, notification.lastCustomerMessageId);
    const workspace = await this.workspaces.findById(workspaceId);
    const workspacePublicId = this.ids.toPublic(IdPrefix.Workspace, workspaceId);
    const conversationPublicId =
      conversationId === null ? null : this.ids.toPublic(IdPrefix.Conversation, conversationId);
    const link = this.inboxLink(workspacePublicId, conversationPublicId);
    return {
      delivery,
      kind: notification.kind,
      to: destination,
      customerName: conversation?.endUserName ?? null,
      agentName: agent?.name ?? null,
      channelKind: conversation?.channelKind ?? null,
      locale: user.locale,
      reason: notificationReasonOf(step),
      lastMessage: lastMessage?.text ?? null,
      time: this.timeOf(notification.createdAt, user.locale, workspace?.timeZone ?? null),
      workspaceName: workspace?.name ?? null,
      link,
      workspacePublicId,
      conversationPublicId,
      waitingMinutes: this.waitingMinutes(notification, conversation?.lastEscalatedAt ?? null),
    };
  }

  private waitingMinutes(notification: NotificationRecord, escalatedAt: Date | null): number {
    if (escalatedAt === null) {
      return 0;
    }
    const minutes =
      (notification.createdAt.getTime() - escalatedAt.getTime()) /
      (SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND);
    return Math.max(1, Math.round(minutes));
  }

  private timeOf(at: Date, locale: Locale, timeZone: string | null): string {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...(timeZone === null ? {} : { timeZone }),
    }).format(at);
  }

  private inboxLink(workspacePublicId: string, conversationPublicId: string | null): string {
    const base = this.config.config.publicUrl;
    const url = new URL(`/w/${workspacePublicId}/inbox`, base);
    if (conversationPublicId !== null) {
      url.searchParams.set('conversation', conversationPublicId);
    }
    return url.toString();
  }

  private async fail(
    workspaceId: string,
    delivery: NotificationDeliveryRecord,
    error: unknown,
    retry: boolean,
  ): Promise<void> {
    const now = this.clock.now();
    const exhausted = !retry || delivery.attempts >= DELIVERY_MAX_ATTEMPTS;
    const nextAttemptAt = exhausted
      ? null
      : new Date(now.getTime() + this.retryDelayMs(delivery.attempts, error));
    await this.tenants.run(workspaceId, () =>
      this.notifications.markDeliveryFailed(workspaceId, delivery.id, {
        nextAttemptAt,
        lastError:
          error instanceof Error ? error.message.slice(0, DELIVERY_LAST_ERROR_MAX_LENGTH) : null,
      }),
    );
  }

  private retryDelayMs(attempts: number, error: unknown): number {
    if (error instanceof TelegramApiError && error.retryAfterSeconds !== null) {
      return error.retryAfterSeconds * MILLISECONDS_PER_SECOND;
    }
    const exponent = Math.max(0, attempts - 1);
    return (
      Math.min(DELIVERY_RETRY_BASE_SECONDS * 2 ** exponent, DELIVERY_RETRY_MAX_SECONDS) *
      MILLISECONDS_PER_SECOND
    );
  }
}
