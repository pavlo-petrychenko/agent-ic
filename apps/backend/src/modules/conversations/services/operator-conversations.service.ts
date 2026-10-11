import { IdPrefix, PermissionAction } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { OPERATOR_RESOURCE } from '@/modules/conversations/constants/operator.constants';
import { ConversationClosedError } from '@/modules/conversations/errors/conversation-closed.error';
import { ConversationNotFoundError } from '@/modules/conversations/errors/conversation-not-found.error';
import { ConversationsRepository } from '@/modules/conversations/repositories/conversations.repository';
import type { Conversation } from '@/modules/conversations/typedefs/conversation.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { WorkspaceAccess } from '@/platform/context/typedefs/workspace-access.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class OperatorConversationsService {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly ids: IdService,
  ) {}

  async requireOperable(
    ctx: UseCaseCtx,
    { workspaceId, userId }: WorkspaceAccess,
    publicId: string,
  ): Promise<Conversation> {
    const id = this.ids.fromPublic(IdPrefix.Conversation, publicId);
    const conversation = await this.conversations.findById(workspaceId, id);
    if (conversation === null) {
      throw new ConversationNotFoundError(publicId);
    }
    authorize(ctx, OPERATOR_RESOURCE[conversation.mode], PermissionAction.Edit);
    if (
      conversation.mode === ConversationMode.Simulation &&
      conversation.endUserExternalId !== userId
    ) {
      throw new ConversationNotFoundError(publicId);
    }
    if (conversation.state === ConversationState.Closed) {
      throw new ConversationClosedError(publicId);
    }
    return conversation;
  }
}
