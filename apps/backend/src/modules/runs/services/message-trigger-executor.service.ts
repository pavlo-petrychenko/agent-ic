import { NodeType, PortName } from '@agent-ic/flow';
import type { TriggerMessageNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import type { StepExecutor, StepOutcome } from '@/modules/runs/typedefs/step-executor.typedefs';

@Injectable()
export class MessageTriggerExecutor implements StepExecutor<TriggerMessageNode> {
  readonly nodeType = NodeType.TriggerMessage;

  execute(): Promise<StepOutcome> {
    return Promise.resolve({ port: PortName.Next, output: {} });
  }
}
