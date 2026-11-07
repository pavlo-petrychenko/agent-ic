import { permissionsForRole } from '@agent-ic/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { TelegramTakeOverOutcomeKind } from '@/modules/conversations/constants/conversation-take-over.constants';
import { authorizeOperator } from '@/modules/conversations/helpers/operator.helpers';
import { ConversationTakeOverService } from '@/modules/conversations/services/conversation-take-over.service';
import { MembershipsRepository } from '@/modules/identity';
import {
  NotificationLogMessage,
  TELEGRAM_ALERT_TAKE_OVER_COPY,
  type TelegramAlertTakeOverInput,
} from '@/modules/notifications';
import { ConfigService } from '@/platform/config/services/config.service';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { requireSystemActor } from '@/platform/context/helpers/use-case-ctx.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { TelegramGateway } from '@/platform/telegram/gateways/telegram.gateway';

@Injectable()
export class TakeOverFromTelegramUseCase {
  private readonly logger = new Logger(TakeOverFromTelegramUseCase.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly memberships: MembershipsRepository,
    private readonly takeOvers: ConversationTakeOverService,
    private readonly config: ConfigService,
    private readonly telegram: TelegramGateway,
  ) {}

  async execute(ctx: UseCaseCtx, input: TelegramAlertTakeOverInput): Promise<void> {
    requireSystemActor(ctx);
    const workspaceId = ctx.workspaceId;
    if (workspaceId === null) {
      throw new WorkspaceAccessDeniedError();
    }
    const copy = TELEGRAM_ALERT_TAKE_OVER_COPY[input.locale];
    const role = await this.tenants.run(workspaceId, () =>
      this.memberships.findRole(workspaceId, input.userId),
    );
    if (role === null) {
      await this.answer(input, copy.unavailable, true);
      await this.removeKeyboard(input);
      return;
    }
    const userCtx: UseCaseCtx = {
      ...ctx,
      actor: { kind: ActorKind.User, userId: input.userId },
      initiatedBy: ctx.actor,
      workspaceId,
      workspaceRole: role,
      permissions: permissionsForRole(role),
      clientIp: null,
    };
    let access;
    try {
      access = authorizeOperator(userCtx);
    } catch (error) {
      this.logger.warn({
        msg: NotificationLogMessage.TelegramAlertTakeOverFailed,
        conversationPublicId: input.conversationPublicId,
        err: error,
      });
      await this.answer(input, copy.unavailable, true);
      await this.removeKeyboard(input);
      return;
    }
    try {
      const outcome = await this.takeOvers.takeOverForTelegram(
        userCtx,
        access,
        input.conversationPublicId,
      );
      switch (outcome.kind) {
        case TelegramTakeOverOutcomeKind.TakenOver:
          await this.answer(input, copy.takenOver, false);
          break;
        case TelegramTakeOverOutcomeKind.SameUser:
          await this.answer(input, copy.alreadyYours, true);
          break;
        case TelegramTakeOverOutcomeKind.OtherUser:
          await this.answer(
            input,
            copy.alreadyOther.replace('{name}', outcome.name ?? copy.otherFallback),
            true,
          );
          break;
        case TelegramTakeOverOutcomeKind.Closed:
          await this.answer(input, copy.closed, true);
          break;
      }
    } catch (error) {
      this.logger.warn({
        msg: NotificationLogMessage.TelegramAlertTakeOverFailed,
        conversationPublicId: input.conversationPublicId,
        err: error,
      });
      await this.answer(input, copy.unavailable, true);
    }
    await this.removeKeyboard(input);
  }

  private async answer(
    input: TelegramAlertTakeOverInput,
    text: string,
    showAlert: boolean,
  ): Promise<void> {
    const token = this.config.config.telegram.alertsBotToken;
    if (token === null) {
      return;
    }
    try {
      await this.telegram.answerCallbackQuery({
        token,
        callbackQueryId: input.callbackQueryId,
        text,
        showAlert,
      });
    } catch (error) {
      this.logger.warn({
        msg: NotificationLogMessage.TelegramAlertTakeOverFailed,
        callbackQueryId: input.callbackQueryId,
        err: error,
      });
    }
  }

  private async removeKeyboard(input: TelegramAlertTakeOverInput): Promise<void> {
    const token = this.config.config.telegram.alertsBotToken;
    if (token === null || input.messageId === null) {
      return;
    }
    try {
      await this.telegram.removeInlineKeyboard({
        token,
        chatId: input.chatId,
        messageId: input.messageId,
      });
    } catch (error) {
      this.logger.warn({
        msg: NotificationLogMessage.TelegramAlertTakeOverFailed,
        chatId: input.chatId,
        err: error,
      });
    }
  }
}
