import { Injectable } from '@nestjs/common';
import { ConversationRunsService, WaitingReason } from '@/modules/conversations';
import { RUN_EVENT_EMIT_OPTIONS, RunEventName } from '@/modules/runs/constants/run-event.constants';
import { runEscalatedEvent } from '@/modules/runs/events/run-escalated.event';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import type { ConversationExit } from '@/modules/runs/typedefs/conversation-exit.typedefs';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';

@Injectable()
export class ConversationExitService {
  constructor(
    private readonly messages: RunMessagesService,
    private readonly conversations: ConversationRunsService,
    private readonly domainEvents: DomainEventsService,
  ) {}

  async end({ ctx, run, nodeId, texts }: ConversationExit): Promise<string[]> {
    const messageIds = await this.messages.send(ctx, run, nodeId, texts);
    await this.conversations.close(run.workspaceId, run.conversationId);
    return messageIds;
  }

  async handOff({ ctx, run, nodeId, texts }: ConversationExit): Promise<string[]> {
    const { workspaceId, conversationId } = run;
    const messageIds = await this.messages.send(ctx, run, nodeId, texts);
    const reason = WaitingReason.Escalated;
    if (await this.conversations.markWaiting(ctx, { workspaceId, conversationId, reason })) {
      await this.domainEvents.emit(
        ctx,
        runEscalatedEvent,
        {
          runId: run.id,
          conversationId,
          agentId: run.agentId,
          versionId: run.versionId,
          nodeId,
          mode: run.mode,
        },
        RUN_EVENT_EMIT_OPTIONS[RunEventName.Escalated],
      );
    }
    return messageIds;
  }
}
