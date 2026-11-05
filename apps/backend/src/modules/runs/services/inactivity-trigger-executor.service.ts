import { NodeType, PortName } from '@agent-ic/flow';
import type { TriggerInactivityNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import type { StepExecutor, StepOutcome } from '@/modules/runs/typedefs/step-executor.typedefs';

@Injectable()
export class InactivityTriggerExecutor implements StepExecutor<TriggerInactivityNode> {
  readonly nodeType = NodeType.TriggerInactivity;

  execute(): Promise<StepOutcome> {
    return Promise.resolve({ port: PortName.Next, output: {} });
  }
}
