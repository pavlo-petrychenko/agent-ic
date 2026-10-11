import { NodeType, PortName } from '@agent-ic/flow';
import type { SendMessageNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import { messageTexts, quickReplyLabels } from '@/modules/runs/helpers/outbound-message.helpers';
import { RunMessagesService } from '@/modules/runs/services/run-messages.service';
import type {
  StepExecution,
  StepExecutor,
  StepOutcome,
} from '@/modules/runs/typedefs/step-executor.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class SendMessageExecutor implements StepExecutor<SendMessageNode> {
  readonly nodeType = NodeType.SendMessage;

  constructor(
    private readonly messages: RunMessagesService,
    private readonly tenants: TenantTransactionService,
  ) {}

  async execute({ ctx, run, node, scope }: StepExecution<SendMessageNode>): Promise<StepOutcome> {
    const { content, quickReplies, typing, waitForDelivery } = node.config;
    const texts = messageTexts(content, scope.variables);
    const buttons = quickReplyLabels(quickReplies, scope.variables);
    const messageIds = await this.tenants.run(run.workspaceId, () =>
      this.messages.send(ctx, run, node.id, texts, buttons),
    );
    return { port: PortName.Next, output: { messageIds, typing, waitForDelivery } };
  }
}
