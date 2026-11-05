import { NodeType, PortName } from '@agent-ic/flow';
import type { TriggerScheduleNode } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import type { StepExecutor, StepOutcome } from '@/modules/runs/typedefs/step-executor.typedefs';

@Injectable()
export class ScheduleTriggerExecutor implements StepExecutor<TriggerScheduleNode> {
  readonly nodeType = NodeType.TriggerSchedule;

  execute(): Promise<StepOutcome> {
    return Promise.resolve({ port: PortName.Next, output: {} });
  }
}
