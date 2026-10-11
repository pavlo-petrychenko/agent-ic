import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { EscalationMode, NodeType, RecipientsKind } from '@agent-ic/flow';
import type { EscalationNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { ConversationMode, ConversationRunsService, WaitingReason } from '@/modules/conversations';
import { MembershipsRepository } from '@/modules/identity';
import { RUN_EVENT_EMIT_OPTIONS, RunEventName } from '@/modules/runs/constants/run-event.constants';
import { runEscalatedEvent } from '@/modules/runs/events/run-escalated.event';
import { renderStepText, templateTexts } from '@/modules/runs/helpers/outbound-message.helpers';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import type { EscalationRecipients } from '@/modules/runs/typedefs/escalation.typedefs';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class EscalationExecutor implements StepExecutor<EscalationNode> {
  readonly nodeType = NodeType.Escalation;

  constructor(
    private readonly messages: RunMessagesService,
    private readonly conversations: ConversationRunsService,
    private readonly domainEvents: DomainEventsService,
    private readonly tenants: TenantTransactionService,
    private readonly members: MembershipsRepository,
    private readonly ids: IdService,
  ) {}

  execute(execution: StepExecution<EscalationNode>): Promise<StepOutcome> {
    return this.tenants.run(execution.run.workspaceId, () => this.escalate(execution));
  }

  private async escalate(execution: StepExecution<EscalationNode>): Promise<StepOutcome> {
    const { ctx, run, node, scope } = execution;
    const { config } = node;
    const { workspaceId, conversationId } = run;
    const texts = templateTexts(config.customerMessage, scope.variables);
    const messageIds = await this.messages.send(ctx, run, node.id, texts);
    if (config.mode === EscalationMode.End) {
      await this.conversations.close(workspaceId, conversationId);
      return { port: null, output: { mode: config.mode, messageIds } };
    }
    const reason = WaitingReason.Escalated;
    if (await this.conversations.markWaiting(ctx, { workspaceId, conversationId, reason })) {
      await this.emitEscalated(execution);
    }
    const escalation = renderStepText(config.reason, scope.variables);
    const output = { mode: config.mode, messageIds, reason: escalation };
    if (run.mode === ConversationMode.Live) {
      return { port: null, output };
    }
    const wouldNotify = await this.recipientNames(workspaceId, config.notify.recipients);
    return { port: null, output: { ...output, wouldNotify } };
  }

  private recipientNames(workspaceId: string, recipients: EscalationRecipients): Promise<string[]> {
    if (recipients.kind === RecipientsKind.Users) {
      const userIds = recipients.userIds.map((id) => this.ids.fromPublic(IdPrefix.User, id));
      return this.members.listNames(workspaceId, { userIds });
    }
    const role = recipients.kind === RecipientsKind.Role ? recipients.role : WorkspaceRole.Operator;
    return this.members.listNames(workspaceId, { role });
  }

  private async emitEscalated({ ctx, run, node }: StepExecution<EscalationNode>): Promise<void> {
    await this.domainEvents.emit(
      ctx,
      runEscalatedEvent,
      {
        runId: run.id,
        conversationId: run.conversationId,
        agentId: run.agentId,
        versionId: run.versionId,
        nodeId: node.id,
        mode: run.mode,
      },
      RUN_EVENT_EMIT_OPTIONS[RunEventName.Escalated],
    );
  }
}
