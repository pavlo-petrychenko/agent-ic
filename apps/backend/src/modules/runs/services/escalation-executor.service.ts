import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import { EscalationMode, NodeType, RecipientsKind } from '@agent-ic/flow';
import type { EscalationNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { ConversationMode } from '@/modules/conversations';
import { MembershipsRepository } from '@/modules/identity';
import { renderStepText, templateTexts } from '@/modules/runs/helpers/outbound-message.helpers';
import { ConversationExitService } from '@/modules/runs/services/conversation-exit.service';
import type { EscalationRecipients } from '@/modules/runs/typedefs/escalation.typedefs';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class EscalationExecutor implements StepExecutor<EscalationNode> {
  readonly nodeType = NodeType.Escalation;

  constructor(
    private readonly exits: ConversationExitService,
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
    const { workspaceId } = run;
    const texts = templateTexts(config.customerMessage, scope.variables);
    const exit = { ctx, run, nodeId: node.id, texts };
    if (config.mode === EscalationMode.End) {
      const messageIds = await this.exits.end(exit);
      return { port: null, output: { mode: config.mode, messageIds } };
    }
    const messageIds = await this.exits.handOff(exit);
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
      const userIds = recipients.userIds.flatMap(
        (id) => this.ids.tryFromPublic(IdPrefix.User, id) ?? [],
      );
      return this.members.listNames(workspaceId, { userIds });
    }
    const role = recipients.kind === RecipientsKind.Role ? recipients.role : WorkspaceRole.Operator;
    return this.members.listNames(workspaceId, { role });
  }
}
