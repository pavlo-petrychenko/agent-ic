import { Injectable, Logger } from '@nestjs/common';
import { authorizeOperator } from '@/modules/conversations/helpers/operator.helpers';
import { ConversationTakeOverService } from '@/modules/conversations/services/conversation-take-over.service';
import { MembershipsRepository } from '@/modules/identity';
import { NotificationLogMessage, type TelegramAlertTakeOverInput } from '@/modules/notifications';
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
    const role = await this.tenants.run(workspaceId, () =>
      this.memberships.findRole(workspaceId, input.userId),
    );
    if (role === null) {
      return;
    }
    const userCtx: UseCaseCtx = {
      ...ctx,
      actor: { kind: ActorKind.User, userId: input.userId },
      initiatedBy: ctx.actor,
      workspaceId,
      workspaceRole: role,
      clientIp: null,
    };
    const access = authorizeOperator(userCtx);
    try {
      await this.takeOvers.takeOver(userCtx, access, input.conversationPublicId);
    } catch (error) {
      this.logger.warn({
        msg: NotificationLogMessage.TelegramAlertTakeOverFailed,
        conversationPublicId: input.conversationPublicId,
        err: error,
      });
      return;
    }
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
