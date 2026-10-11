import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import {
  ConversationMode,
  ConversationNotFoundError,
  ConversationRunsService,
} from '@/modules/conversations';
import { RunsRepository } from '@/modules/runs/repositories/runs.repository';
import { RunDetailsService } from '@/modules/runs/services/run-details.service';
import type { RunView, SimulationRunsInput } from '@/modules/runs/typedefs/run-details.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class ListSimulationRunsUseCase {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly conversations: ConversationRunsService,
    private readonly runs: RunsRepository,
    private readonly details: RunDetailsService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SimulationRunsInput): Promise<RunView[]> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.Testing,
      PermissionAction.View,
    );
    const conversationId = this.ids.fromPublic(IdPrefix.Conversation, input.conversationId);
    return this.tenants.run(workspaceId, async () => {
      const conversation = await this.conversations.getConversation(workspaceId, conversationId);
      if (
        conversation.mode !== ConversationMode.Simulation ||
        conversation.endUserExternalId !== userId
      ) {
        throw new ConversationNotFoundError(input.conversationId);
      }
      const runs = await this.runs.listByConversation(workspaceId, conversationId);
      return Promise.all(runs.map((run) => this.details.details(run)));
    });
  }
}
