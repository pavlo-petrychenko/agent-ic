import { EscalationMode, NodeType } from '@agent-ic/flow';
import type { EscalationNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { ConversationRunsService, WaitingReason } from '@/modules/conversations';
import { RUN_EVENT_EMIT_OPTIONS, RunEventName } from '@/modules/runs/constants/run-event.constants';
import { runEscalatedEvent } from '@/modules/runs/events/run-escalated.event';
import { renderStepText, templateTexts } from '@/modules/runs/helpers/outbound-message.helpers';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';

@Injectable()
export class EscalationExecutor implements StepExecutor<EscalationNode> {
  readonly nodeType = NodeType.Escalation;

  constructor(
    private readonly messages: RunMessagesService,
    private readonly conversations: ConversationRunsService,
    private readonly domainEvents: DomainEventsService,
    private readonly tenants: TenantTransactionService,
  ) {}

  execute(execution: StepExecution<EscalationNode>): Promise<StepOutcome> {
    return this.tenants.run(execution.run.workspaceId, () => this.escalate(execution));
  }

  private async escalate({
    ctx,
    run,
    node,
    scope,
  }: StepExecution<EscalationNode>): Promise<StepOutcome> {
    const { config } = node;
    const { workspaceId, conversationId } = run;
    const texts = templateTexts(config.customerMessage, scope.variables);
    const messageIds = await this.messages.send(ctx, run, node.id, texts);
    if (config.mode === EscalationMode.End) {
      await this.conversations.close(workspaceId, conversationId);
      return { port: null, output: { mode: config.mode, messageIds } };
    }
    const reason = WaitingReason.Escalated;
    await this.conversations.markWaiting(ctx, { workspaceId, conversationId, reason });
    await this.domainEvents.emit(
      ctx,
      runEscalatedEvent,
      {
        runId: run.id,
        conversationId,
        agentId: run.agentId,
        versionId: run.versionId,
        nodeId: node.id,
        mode: run.mode,
      },
      RUN_EVENT_EMIT_OPTIONS[RunEventName.Escalated],
    );
    const escalation = renderStepText(config.reason, scope.variables);
    return { port: null, output: { mode: config.mode, messageIds, reason: escalation } };
  }
}
