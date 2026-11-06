import { IdPrefix, Locale } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MessagesRepository } from '@/modules/conversations';
import type { Message } from '@/modules/conversations';
import { UsersRepository, WorkspacesRepository } from '@/modules/identity';
import {
  EmailGateway,
  EmailTemplate,
  escalationEmailElement,
  escalationEmailSubject,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationsRepository,
  NotificationSettingsService,
  renderEmail,
} from '@/modules/notifications';
import type { NotificationDeliveryRecord, NotificationRecord } from '@/modules/notifications';
import { notificationReasonOf } from '@/modules/runs/helpers/notification-content.helpers';
import { RunStepsRepository } from '@/modules/runs/repositories/run-steps.repository';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { ClockService } from '@/platform/clock/services/clock.service';
import { ConfigService } from '@/platform/config/services/config.service';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

interface DeliverNotificationInput {
  readonly notificationId: string;
  readonly channel: NotificationChannel;
}

interface DeliveryContent {
  readonly delivery: NotificationDeliveryRecord;
  readonly to: string;
  readonly name: string;
  readonly locale: Locale;
  readonly reason: string | null;
  readonly lastMessage: string | null;
  readonly link: string;
}

interface SkippedDelivery {
  readonly delivery: NotificationDeliveryRecord;
  readonly to: null;
}

@Injectable()
export class DeliverNotificationUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly notifications: NotificationsRepository,
    private readonly settings: NotificationSettingsService,
    private readonly email: EmailGateway,
    private readonly users: UsersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly steps: RunStepsRepository,
    private readonly runs: RunsRepository,
    private readonly messages: MessagesRepository,
    private readonly config: ConfigService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: DeliverNotificationInput): Promise<void> {
    requireSystemActor(ctx);
    if (input.channel !== NotificationChannel.Email) {
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
      await this.fail(workspaceId, content.delivery.id);
      return;
    }
    const rendered = await renderEmail(
      escalationEmailElement({
        locale: content.locale,
        name: content.name,
        reason: content.reason,
        lastMessage: content.lastMessage,
        link: content.link,
      }),
    );
    try {
      await this.email.send({
        template: EmailTemplate.Escalation,
        to: content.to,
        subject: escalationEmailSubject(content.locale),
        ...rendered,
      });
    } catch (error) {
      await this.fail(workspaceId, content.delivery.id);
      throw error;
    }
    await this.tenants.run(workspaceId, () =>
      this.notifications.markDeliveryDelivered(workspaceId, content.delivery.id, this.clock.now()),
    );
  }

  private async load(
    workspaceId: string,
    input: DeliverNotificationInput,
  ): Promise<DeliveryContent | SkippedDelivery | null> {
    const notification = await this.notifications.findById(workspaceId, input.notificationId);
    if (notification === null) {
      return null;
    }
    const delivery = await this.notifications.findDelivery(
      workspaceId,
      notification.id,
      NotificationChannel.Email,
    );
    if (
      delivery === null ||
      delivery.status === NotificationDeliveryStatus.Delivered ||
      delivery.status === NotificationDeliveryStatus.Read
    ) {
      return null;
    }
    const settings = await this.settings.describe(workspaceId, notification.userId);
    const user = await this.users.findById(notification.userId);
    if (!settings.email.enabled || user === null) {
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
    email: string,
  ): Promise<DeliveryContent | SkippedDelivery> {
    if (user === null) {
      return { delivery, to: null };
    }
    const step = await this.steps.findById(workspaceId, notification.runStepId);
    const run = step === null ? null : await this.runs.findById(workspaceId, step.runId);
    const conversationId = run?.conversationId ?? null;
    const lastMessage: Message | null =
      notification.lastCustomerMessageId === null
        ? conversationId === null
          ? null
          : await this.messages.findLatestCustomerMessage(workspaceId, conversationId)
        : await this.messages.findById(workspaceId, notification.lastCustomerMessageId);
    const workspace = await this.workspaces.findById(workspaceId);
    const link = this.inboxLink(workspace?.workspaceId ?? null, conversationId);
    return {
      delivery,
      to: email,
      name: user.name,
      locale: user.locale,
      reason: notificationReasonOf(step),
      lastMessage: lastMessage?.text ?? null,
      link,
    };
  }

  private inboxLink(workspacePublicId: string | null, conversationId: string | null): string {
    const base = this.config.config.publicUrl;
    const conversation =
      conversationId === null ? '' : this.ids.toPublic(IdPrefix.Conversation, conversationId);
    const path = workspacePublicId === null ? '/w' : `/w/${workspacePublicId}/inbox`;
    const url = new URL(conversation === '' ? path : `${path}/${conversation}`, base);
    return url.toString();
  }

  private async fail(workspaceId: string, deliveryId: string): Promise<void> {
    await this.tenants.run(workspaceId, () =>
      this.notifications.markDeliveryFailed(workspaceId, deliveryId),
    );
  }
}
